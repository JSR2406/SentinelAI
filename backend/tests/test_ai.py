import pytest
from app.database import SessionLocal, init_db
from app.models.models import User, Repository, Scan, Issue
from app.schemas.schemas import AIChatRequest, AIFixRequest
from app.services.ai_service import AIService

def test_ai_service_explanation_caching_and_autofix():
    init_db()
    db = SessionLocal()

    import uuid
    uid = str(uuid.uuid4())[:8]
    user = User(id=f"user_ai_{uid}", email=f"ai_{uid}@test.com")
    db.add(user)
    db.commit()

    repo = Repository(id=f"repo_{uid}", user_id=user.id, name="ai-repo", url="https://github.com/ai/repo.git")
    db.add(repo)
    db.commit()

    scan = Scan(id=f"scan_ai_{uid}", repo_id=repo.id, status="COMPLETED")
    db.add(scan)
    db.commit()

    issue = Issue(
        scan_id=scan.id, tool="Gitleaks", title="Exposed Secret Key",
        severity="CRITICAL", file_path="config.js", line=12,
        description="Hardcoded API secret found", recommendation="Rotate token"
    )
    db.add(issue)
    db.commit()

    # 1. Chat explanation
    req = AIChatRequest(scanId=scan.id, issueId=issue.id, message="Explain this leak")
    res1 = AIService.explain_issue_or_chat(db, req)
    assert res1.cached is False
    assert "Gitleaks" in res1.explanation or "SentinelAI" in res1.explanation

    # 2. Caching check for repeated query
    res2 = AIService.explain_issue_or_chat(db, req)
    assert res2.cached is True

    # 3. Autofix generation
    fix_req = AIFixRequest(issueId=issue.id, createPR=True)
    fix_res = AIService.generate_autofix(db, fix_req)
    assert fix_res.issueId == issue.id
    assert "patchText" in fix_res.model_dump()
    assert fix_res.prUrl is not None

    db.close()
