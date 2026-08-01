# SentinelAI Backend - AI-Powered DevSecOps Security Copilot

Production-grade microservices backend for **SentinelAI**, built with **Python**, **FastAPI**, **PostgreSQL**, **Celery**, **Redis**, **Docker**, and **OpenAI**.

---

## 🚀 Architecture Overview

SentinelAI Backend is designed around an event-driven microservice pattern to perform comprehensive security vulnerability scanning, attack path visualization, and AI-driven code remediations.

```
                  +--------------------------+
                  |    Frontend (Lovable)    |
                  +------------+-------------+
                               |
                        Bearer JWT Auth
                               v
                  +--------------------------+
                  |       API Gateway        |
                  |     (FastAPI :8000)      |
                  +------------+-------------+
                               |
         +---------------------+---------------------+
         |                     |                     |
         v                     v                     v
+------------------+  +------------------+  +------------------+
| Repository Service|  |   Scan Service   |  | AttackGraph Service|
+------------------+  +--------+---------+  +------------------+
                               |
                        Celery / Redis
                               v
                  +--------------------------+
                  |  Worker Queue & Pipeline |
                  | (Gitleaks, TruffleHog,   |
                  | Semgrep, Trivy, ZAP)     |
                  +------------+-------------+
                               |
         +---------------------+---------------------+
         |                     |                     |
         v                     v                     v
+------------------+  +------------------+  +------------------+
|    AI Service    |  |  Report Service  |  | Notification Serv|
| (OpenAI / Patch) |  | (Score/HTML/PDF) |  |  (Slack / Email) |
+------------------+  +------------------+  +------------------+
```

---

## 🧰 Microservices breakdown

1. **API Gateway (`app/main.py`):** Central entry point with CORS, rate limiting (60 req/min), Supabase JWT authentication dependency, and OpenAPI `/docs`.
2. **Repository Service (`app/services/repo_service.py`):** Manage user repositories (`POST /api/v1/repos`, `GET /api/v1/repos`, `DELETE /api/v1/repos/{id}`). URL regex validation for Git HTTP/SSH endpoints.
3. **Scan Service & Celery Worker (`app/worker/tasks.py`):** Queues scan jobs (`POST /api/v1/scan`, `GET /api/v1/scan/{id}`). Executes 6 worker pipeline steps:
   - `clone_repo`
   - `run_scanners`
   - `process_results`
   - `generate_attack_graph`
   - `invoke_ai`
   - `finalize_report`
4. **Scanners Engine (`app/scanners/`):** Orchestrates 5 security tools:
   - **Gitleaks:** Hardcoded credentials & API keys
   - **TruffleHog:** High-entropy secret validation
   - **Semgrep:** SAST static code vulnerability analysis
   - **Trivy:** SCA container & software dependency CVE scanner
   - **OWASP ZAP:** DAST API dynamic security analysis
   Unified schema normalizer maps findings to `issues` database table.
5. **AttackGraph Service (`app/services/attack_graph_service.py`):** Generates node-edge graph JSON (`GET /api/v1/attack-graph/{repoId}`). Links Entry points -> SAST Vulnerabilities -> Leaked Credentials -> High-Value Assets.
6. **AI Service (`app/services/ai_service.py`):**
   - `POST /api/v1/chat`: Vulnerability explanation & remediation assistant with prompt hash caching.
   - `POST /api/v1/autofix`: Automated git code patch generation with option to open GitHub PR.
7. **Report Service (`app/services/report_service.py`):** Calculates security risk score (0-100), severity counts, JSON report (`GET /api/v1/report/{scanId}`), and HTML export (`GET /api/v1/report/{scanId}/html`).
8. **Notification Service (`app/services/notification_service.py`):** Dispatches Slack webhooks / email notifications upon scan completion or critical findings.
9. **GitHub Integration (`app/services/github_service.py`):** OAuth login flow (`/auth/github/login`, `/auth/github/callback`), user profile, repo import, and push webhooks (`/auth/github/webhook`).

---

## 🗄️ Database Schema

PostgreSQL tables defined with foreign keys and index optimizations:
- `users`: User identity & GitHub OAuth access tokens
- `repositories`: Linked Git repositories & target branches
- `scans`: Security scan jobs, status lifecycle, risk scores
- `issues`: Normalized findings across Gitleaks, TruffleHog, Semgrep, Trivy, ZAP
- `attack_nodes`: Attack graph assets, entry points, and vulnerability nodes
- `attack_edges`: Directed attack path exploit vectors between nodes
- `ai_conversations`: Conversation memory & chat history per scan issue
- `ai_fixes`: Unified patch diffs and pull request tracking

Full SQL migration script located at `migrations/schema.sql`.

---

## ⚡ Quick Start & Deployment

### Running locally with Docker Compose

```bash
cd backend
docker-compose up --build -d
```

Services start at:
- **API Gateway & Swagger Docs:** http://localhost:8000/docs
- **PostgreSQL:** `localhost:5432`
- **Redis:** `localhost:6379`

### Running Unit Tests

```bash
cd backend
python -m pytest tests/
```

---

## 📄 API Contracts (OpenAPI)

Interactive API documentation available at `http://localhost:8000/docs`.

Key Endpoints:
- `POST /api/v1/repos` -> Body: `{"name": "string", "url": "string", "branch": "main"}`
- `POST /api/v1/scan` -> Body: `{"repoId": "string"}`
- `GET /api/v1/scan/{id}` -> Returns scan status
- `GET /api/v1/attack-graph/{repoId}` -> Returns nodes & edges
- `POST /api/v1/chat` -> Body: `{"scanId": "string", "issueId": "string", "message": "string"}`
- `POST /api/v1/autofix` -> Body: `{"issueId": "string", "createPR": true}`
- `GET /api/v1/report/{scanId}` -> Returns security report JSON
