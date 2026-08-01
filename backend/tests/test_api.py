import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "HEALTHY"

def test_create_list_delete_repo():
    # 1. Create Repository
    payload = {
        "name": "test-sec-repo",
        "url": "https://github.com/enginow-in/test-sec-repo.git",
        "branch": "main"
    }
    headers = {"Authorization": "Bearer test-jwt-token"}
    res = client.post("/api/v1/repos", json=payload, headers=headers)
    assert res.status_code == 201
    repo_data = res.json()
    assert repo_data["name"] == "test-sec-repo"
    repo_id = repo_data["id"]

    # 2. List Repositories
    res_list = client.get("/api/v1/repos", headers=headers)
    assert res_list.status_code == 200
    assert res_list.json()["total"] >= 1

    # 3. Delete Repository
    res_del = client.delete(f"/api/v1/repos/{repo_id}", headers=headers)
    assert res_del.status_code == 200

def test_scan_and_report_flow():
    headers = {"Authorization": "Bearer test-jwt-token"}
    
    # Create repo
    repo_res = client.post("/api/v1/repos", json={
        "name": "demo-vulnerable-app",
        "url": "https://github.com/myorg/demo-vulnerable-app.git",
        "branch": "main"
    }, headers=headers)
    repo_id = repo_res.json()["id"]

    # Trigger Scan
    scan_res = client.post("/api/v1/scan", json={"repoId": repo_id}, headers=headers)
    assert scan_res.status_code == 202
    scan_id = scan_res.json()["scanId"]

    # Check status
    status_res = client.get(f"/api/v1/scan/{scan_id}", headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["scanId"] == scan_id

    # Check Attack Graph
    graph_res = client.get(f"/api/v1/attack-graph/{repo_id}", headers=headers)
    assert graph_res.status_code == 200
    assert "nodes" in graph_res.json()

    # Check Report
    report_res = client.get(f"/api/v1/report/{scan_id}", headers=headers)
    assert report_res.status_code == 200
    assert report_res.json()["scanId"] == scan_id

def test_ai_chat_and_autofix():
    headers = {"Authorization": "Bearer test-jwt-token"}
    
    # AI Chat
    chat_res = client.post("/api/v1/chat", json={
        "scanId": "scan-123",
        "message": "Explain how to remediate hardcoded API keys."
    }, headers=headers)
    assert chat_res.status_code == 200
    assert "SentinelAI" in chat_res.json()["explanation"] or "explanation" in chat_res.json()

def test_github_oauth_endpoints():
    res_login = client.get("/auth/github/login")
    assert res_login.status_code == 200
    assert "login_url" in res_login.json()
