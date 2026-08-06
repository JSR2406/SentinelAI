import requests
import time

base = "http://localhost:8000"

# 1. Get/create Market-Research-Agent repo
repos = requests.get(f"{base}/api/v1/repos").json()["repositories"]
repo = next((r for r in repos if "Market-Research" in r["name"]), None)
if not repo:
    repo = requests.post(f"{base}/api/v1/repos", json={
        "name": "Market-Research-Agent-",
        "url": "https://github.com/JSR2406/Market-Research-Agent-",
        "branch": "main"
    }).json()
print(f"Using repo: {repo['name']} ({repo['id'][:8]})")

# 2. Trigger scan
scan_resp = requests.post(f"{base}/api/v1/scan", json={"repoId": repo["id"]})
print(f"POST /scan: {scan_resp.status_code}")
scan_data = scan_resp.json()
scan_id = scan_data["scanId"]
print(f"Scan triggered: {scan_id[:8]}... | Status: {scan_data['status']}")

# 3. Poll until complete
for i in range(30):
    time.sleep(2)
    st = requests.get(f"{base}/api/v1/scan/{scan_id}").json()
    print(f"  [{i*2}s] {st['status']} | Score: {st['score']}")
    if st["status"] in ("COMPLETED", "FAILED"):
        print(f"  Error: {st.get('error_message')}")
        break

# 4. Test AI chat (will use OpenRouter)
print("\n--- Testing OpenRouter AI Chat ---")
chat = requests.post(f"{base}/api/v1/chat", json={
    "scanId": scan_id,
    "message": "What are the top 3 security risks found in this scan? Be specific."
})
print(f"HTTP {chat.status_code}")
if chat.ok:
    resp = chat.json()
    print(resp["explanation"][:800])
    print(f"Recommendations: {resp.get('recommendations', [])}")
    print(f"Cached: {resp.get('cached')}")
else:
    print(chat.text[:400])

# 5. Get full report
print("\n--- Security Report ---")
report = requests.get(f"{base}/api/v1/report/{scan_id}")
if report.ok:
    r = report.json()
    print(f"Repo: {r['repoName']}")
    print(f"Risk Score: {r['summary']['riskScore']}")
    print(f"Total Findings: {r['summary']['totalFindings']}")
    print(f"Critical: {r['summary']['severityCounts']['critical']}")
    print(f"High: {r['summary']['severityCounts']['high']}")
    print(f"Medium: {r['summary']['severityCounts']['medium']}")
    print(f"Scanners: {r['summary']['scannersRun']}")
else:
    print(report.text[:300])
