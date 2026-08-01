# SentinelAI — AI-Powered DevSecOps Security Copilot

> Scan any GitHub repository for secrets, code vulnerabilities, dependency CVEs, and dynamic API flaws — powered by AI-driven explanations and automated code fixes.

## Live Demo

- **Frontend:** https://sentinelai-security.vercel.app
- **Backend API Docs:** http://localhost:8001/docs (local) 
- **GitHub Repo:** https://github.com/JSR2406/SentinelAI

## Features

- **5-Scanner Engine** — Gitleaks, TruffleHog, Semgrep, Trivy, OWASP ZAP
- **Attack Graph Visualizer** — Interactive node-edge attack path visualization
- **AI Copilot** — Chat-based vulnerability explanations powered by OpenAI
- **Auto-Fix Patches** — AI-generated code patches and GitHub PR creation
- **Real Repository Testing** — Tested on https://github.com/JSR2406/Market-Research-Agent-
- **Security Risk Score** — 0–100 risk scoring with severity breakdown

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TanStack Router + Vite |
| Backend | Python / FastAPI |
| Auth | Supabase |
| Database | PostgreSQL (SQLite fallback) |
| Task Queue | Celery + Redis |
| Deployment | Vercel (frontend) + Railway (backend) |

## Quick Start

```bash
# Frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8001
```

## Environment Variables

Copy `backend/.env.production.example` → `backend/.env` and fill in:
- `SUPABASE_JWT_SECRET`
- `OPENAI_API_KEY`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `DATABASE_URL` (PostgreSQL)
- `REDIS_URL`
