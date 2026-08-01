import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def test_real_github_repo_scanning():
    headers = {"Authorization": "Bearer test-jwt-token"}

    # 1. Register a real public GitHub repo
    repo_payload = {
        "name": "Hello-World-Real",
        "url": "https://github.com/octocat/Hello-World.git",
        "branch": "master"
    }
    repo_res = client.post("/api/v1/repos", json=repo_payload, headers=headers)
    assert repo_res.status_code == 201
    repo_id = repo_res.json()["id"]

    # 2. Trigger scan on real repository
    scan_res = client.post("/api/v1/scan", json={"repoId": repo_id}, headers=headers)
    assert scan_res.status_code == 202
    scan_id = scan_res.json()["scanId"]

    # 3. Verify scan status
    status_res = client.get(f"/api/v1/scan/{scan_id}", headers=headers)
    assert status_res.status_code == 200
    scan_status = status_res.json()["status"]
    assert scan_status in ["COMPLETED", "SCANNING", "GRAPHING", "PROCESSING", "AI_ANALYSIS"]

    # 4. Verify report generation for real repo
    report_res = client.get(f"/api/v1/report/{scan_id}", headers=headers)
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert report_data["repoName"] == "Hello-World-Real"
    assert "summary" in report_data
    assert "riskScore" in report_data["summary"]

    # 5. Verify attack graph generation for real repo
    graph_res = client.get(f"/api/v1/attack-graph/{repo_id}", headers=headers)
    assert graph_res.status_code == 200
    graph_data = graph_res.json()
    assert len(graph_data["nodes"]) >= 1

    # 6. Delete repository cleanup
    del_res = client.delete(f"/api/v1/repos/{repo_id}", headers=headers)
    assert del_res.status_code == 200

def test_local_workspace_codebase_scan():
    headers = {"Authorization": "Bearer test-jwt-token"}
    workspace_path = "c:\\Users\\Janmejay Singh\\Downloads\\SentinelAI Landing Page (1)"
    
    # 1. Register local workspace codebase
    repo_payload = {
        "name": "SentinelAI-Local-Workspace",
        "url": workspace_path,
        "branch": "main"
    }
    repo_res = client.post("/api/v1/repos", json=repo_payload, headers=headers)
    assert repo_res.status_code == 201
    repo_id = repo_res.json()["id"]

    # 2. Trigger scan on workspace codebase
    scan_res = client.post("/api/v1/scan", json={"repoId": repo_id}, headers=headers)
    assert scan_res.status_code == 202
    scan_id = scan_res.json()["scanId"]

    # 3. Verify scan report
    report_res = client.get(f"/api/v1/report/{scan_id}", headers=headers)
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert report_data["scanId"] == scan_id
    assert "summary" in report_data

    # Cleanup
    client.delete(f"/api/v1/repos/{repo_id}", headers=headers)
