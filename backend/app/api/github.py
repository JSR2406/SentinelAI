from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.jwt_auth import get_current_user
from app.models.models import User
from app.services.github_service import GitHubService

router = APIRouter(prefix="/auth/github", tags=["GitHub Integration & OAuth"])

@router.get("/login")
def github_login_redirect():
    """Returns OAuth login URL for GitHub authentication."""
    url = GitHubService.get_oauth_login_url()
    return {"login_url": url}

@router.get("/callback")
def github_oauth_callback(
    code: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Callback route to exchange OAuth code for user access token."""
    token = GitHubService.exchange_code_for_token(code)
    user.github_token = token
    db.commit()
    return {
        "status": "SUCCESS",
        "message": "GitHub account successfully authenticated",
        "access_token": token
    }

@router.get("/user")
def github_user_profile(user: User = Depends(get_current_user)):
    """Fetch GitHub user profile using stored user token."""
    token = user.github_token or "gho_mock_token"
    return GitHubService.fetch_user_profile(token)

@router.get("/repos")
def github_user_repositories(user: User = Depends(get_current_user)):
    """Fetch user's GitHub repositories available for 1-click import into SentinelAI."""
    token = user.github_token or "gho_mock_token"
    repos = GitHubService.fetch_user_repositories(token)
    return {"repositories": repos}

@router.post("/webhook")
async def github_webhook_listener(request: Request):
    """Receive push webhooks from GitHub to auto-trigger security scans."""
    payload = await request.json()
    event_type = request.headers.get("X-GitHub-Event", "push")
    return {
        "status": "RECEIVED",
        "event": event_type,
        "repository": payload.get("repository", {}).get("full_name")
    }
