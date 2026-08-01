from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.jwt_auth import get_current_user
from app.models.models import User
from app.schemas.schemas import AttackGraphResponse
from app.services.attack_graph_service import AttackGraphService

router = APIRouter(prefix="/attack-graph", tags=["AttackGraph Service"])

@router.get("/{repo_id}", response_model=AttackGraphResponse)
def get_attack_graph(
    repo_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve generated attack graph (nodes & edges) for a scanned repository."""
    graph = AttackGraphService.get_attack_graph_for_repo(db, repo_id)
    return graph
