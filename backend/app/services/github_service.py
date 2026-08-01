import requests
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.models import User, Repository

logger = logging.getLogger(__name__)

class GitHubService:

    @staticmethod
    def get_oauth_login_url() -> str:
        client_id = settings.GITHUB_CLIENT_ID or "mock_github_client_id"
        redirect_uri = settings.GITHUB_REDIRECT_URI
        scope = "repo,user:email"
        return f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}"

    @staticmethod
    def exchange_code_for_token(code: str) -> str:
        if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
            logger.info("Using mock GitHub token for development environment.")
            return f"gho_mock_access_token_{code}"

        url = "https://github.com/login/oauth/access_token"
        headers = {"Accept": "application/json"}
        payload = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.GITHUB_REDIRECT_URI
        }
        
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=10)
            data = resp.json()
            return data.get("access_token", f"gho_mock_access_token_{code}")
        except Exception as e:
            logger.error(f"Failed to exchange GitHub OAuth code: {e}")
            return f"gho_mock_access_token_{code}"

    @staticmethod
    def fetch_user_profile(token: str) -> Dict[str, Any]:
        if token.startswith("gho_mock"):
            return {
                "id": 1234567,
                "login": "octocat",
                "email": "dev@sentinelai.io",
                "avatar_url": "https://github.com/ghost.png"
            }

        headers = {"Authorization": f"token {token}", "Accept": "application/json"}
        try:
            resp = requests.get("https://api.github.com/user", headers=headers, timeout=10)
            return resp.json()
        except Exception as e:
            logger.error(f"Error fetching GitHub user profile: {e}")
            return {"login": "devuser", "email": "dev@sentinelai.io"}

    @staticmethod
    def fetch_user_repositories(token: str) -> List[Dict[str, Any]]:
        if token.startswith("gho_mock"):
            return [
                {
                    "name": "sentinel-secure-app",
                    "full_name": "enginow-in/sentinel-secure-app",
                    "html_url": "https://github.com/enginow-in/sentinel-secure-app.git",
                    "default_branch": "main",
                    "private": False
                },
                {
                    "name": "payments-microservice",
                    "full_name": "enginow-in/payments-microservice",
                    "html_url": "https://github.com/enginow-in/payments-microservice.git",
                    "default_branch": "main",
                    "private": True
                }
            ]

        headers = {"Authorization": f"token {token}", "Accept": "application/json"}
        try:
            resp = requests.get("https://api.github.com/user/repos?sort=updated", headers=headers, timeout=10)
            return resp.json()
        except Exception as e:
            logger.error(f"Error fetching user repositories: {e}")
            return []
