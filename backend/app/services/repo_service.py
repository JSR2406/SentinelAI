import re
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Repository, User
from app.schemas.schemas import RepoCreate

GIT_URL_REGEX = re.compile(
    r"^(https?://|git@|git://)[\w\.\-]+(/|:)[\w\.\-]+/[\w\.\-]+(\.git)?/?$"
)

class RepoService:
    @staticmethod
    def validate_repo_url(url: str) -> bool:
        """Validates standard Git repository URLs or local directory paths."""
        if not url or len(url.strip()) == 0:
            return False
        clean_url = url.strip()
        import os
        if os.path.exists(clean_url) or clean_url.startswith("file://"):
            return True
        return bool(GIT_URL_REGEX.match(clean_url))

    @staticmethod
    def create_repo(db: Session, user: User, repo_in: RepoCreate) -> Repository:
        if not RepoService.validate_repo_url(repo_in.url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Git repository URL. Must be a valid HTTP(S) or SSH git repository URL."
            )
            
        repo = Repository(
            user_id=user.id,
            name=repo_in.name,
            url=repo_in.url,
            branch=repo_in.branch,
            token=repo_in.token
        )
        db.add(repo)
        db.commit()
        db.refresh(repo)
        return repo

    @staticmethod
    def get_user_repos(db: Session, user: User) -> List[Repository]:
        return db.query(Repository).filter(Repository.user_id == user.id).all()

    @staticmethod
    def get_repo_by_id(db: Session, repo_id: str) -> Optional[Repository]:
        return db.query(Repository).filter(Repository.id == repo_id).first()

    @staticmethod
    def delete_repo(db: Session, user: User, repo_id: str) -> bool:
        repo = db.query(Repository).filter(
            Repository.id == repo_id,
            Repository.user_id == user.id
        ).first()
        if not repo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found or access unauthorized"
            )
        db.delete(repo)
        db.commit()
        return True
