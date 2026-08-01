from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.jwt_auth import get_current_user
from app.models.models import User
from app.schemas.schemas import RepoCreate, RepoResponse, RepoListResponse
from app.services.repo_service import RepoService

router = APIRouter(prefix="/repos", tags=["Repository Service"])

@router.post("", response_model=RepoResponse, status_code=status.HTTP_201_CREATED)
def create_repository(
    repo_in: RepoCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new repository to SentinelAI for security scanning."""
    repo = RepoService.create_repo(db, user, repo_in)
    return repo

@router.get("", response_model=RepoListResponse)
def list_repositories(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all registered repositories for the current user."""
    repos = RepoService.get_user_repos(db, user)
    return RepoListResponse(
        total=len(repos),
        repositories=[RepoResponse.model_validate(r) for r in repos]
    )

@router.delete("/{repo_id}", status_code=status.HTTP_200_OK)
def delete_repository(
    repo_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a repository and all associated scans/findings."""
    RepoService.delete_repo(db, user, repo_id)
    return {"message": "Repository deleted successfully", "id": repo_id}
