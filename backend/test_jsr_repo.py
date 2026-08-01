import os
import time
import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db
from app.models.models import User, Repository, Scan, Issue, AttackNode, AttackEdge
from app.worker.tasks import run_full_scan_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("JSRRepoTest")

def test_jsr2406_market_research_agent():
    target_url = "https://github.com/JSR2406/Market-Research-Agent-.git"
    repo_name = "Market-Research-Agent-"

    print("\n" + "="*70)
    print(f"[TEST] TESTING REAL GITHUB REPO: {target_url}")
    print("="*70 + "\n")

    init_db()
    db: Session = SessionLocal()

    # Create test user
    user = db.query(User).filter(User.email == "jsr_tester@sentinel.ai").first()
    if not user:
        user = User(id="jsr_user_01", email="jsr_tester@sentinel.ai")
        db.add(user)
        db.commit()

    # Create Repo record
    repo = Repository(user_id=user.id, name=repo_name, url=target_url, branch="main")
    db.add(repo)
    db.commit()

    # Create Scan record
    scan = Scan(repo_id=repo.id, status="PENDING")
    db.add(scan)
    db.commit()

    print(f"[STATUS] Triggered Scan ID: {scan.id} for {repo_name}")

    # Execute scan pipeline
    t_start = time.time()
    run_full_scan_pipeline(scan.id)
    t_end = time.time()

    # Refresh scan record
    db.refresh(scan)
    issues = db.query(Issue).filter(Issue.scan_id == scan.id).all()
    nodes = db.query(AttackNode).filter(AttackNode.scan_id == scan.id).all()
    edges = db.query(AttackEdge).filter(AttackEdge.scan_id == scan.id).all()

    print("\n" + "="*70)
    print(f"[SUCCESS] COMPLETED END-TO-END SCAN FOR REPO: {repo_name}")
    print("="*70)
    print(f"Scan Duration       : {round(t_end - t_start, 2)}s")
    print(f"Final Scan Status   : {scan.status}")
    print(f"Security Risk Score : {scan.score:.1f} / 100.0")
    print(f"Total Issues Found  : {len(issues)}")
    print(f"Attack Nodes Built  : {len(nodes)}")
    print(f"Attack Edges Built  : {len(edges)}")
    print("="*70 + "\n")

    # Clean up test records
    db.delete(scan)
    db.delete(repo)
    db.commit()
    db.close()

if __name__ == "__main__":
    test_jsr2406_market_research_agent()
