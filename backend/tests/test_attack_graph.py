import pytest
from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db
from app.models.models import Repository, Scan, Issue, User
from app.services.attack_graph_service import AttackGraphService

def test_attack_graph_generation():
    init_db()
    db = SessionLocal()
    
    import uuid
    uid = str(uuid.uuid4())[:8]
    user = User(id=f"user_graph_{uid}", email=f"graph_{uid}@test.com")
    db.add(user)
    db.commit()

    repo = Repository(id=f"repo_graph_{uid}", user_id=user.id, name="vulnerable-web-app", url="https://github.com/my/app.git")
    db.add(repo)
    db.commit()

    scan = Scan(id=f"scan_graph_{uid}", repo_id=repo.id, status="COMPLETED")
    db.add(scan)
    db.commit()

    issue_zap = Issue(
        scan_id=scan.id, tool="OWASP ZAP", title="Missing X-Frame-Options",
        severity="MEDIUM", file_path="/api/login", line=1
    )
    issue_semgrep = Issue(
        scan_id=scan.id, tool="Semgrep", title="SQL Injection in auth handler",
        severity="HIGH", file_path="src/auth.py", line=42
    )
    issue_secret = Issue(
        scan_id=scan.id, tool="Gitleaks", title="Exposed AWS Access Key",
        severity="CRITICAL", file_path=".env", line=3
    )
    db.add_all([issue_zap, issue_semgrep, issue_secret])
    db.commit()

    # 2. Generate Attack Graph
    AttackGraphService.generate_graph_for_scan(db, scan.id)

    # 3. Retrieve Graph
    graph_resp = AttackGraphService.get_attack_graph_for_repo(db, repo.id)
    assert graph_resp.repoId == repo.id
    assert len(graph_resp.nodes) >= 3
    assert len(graph_resp.edges) >= 2
    
    db.close()
