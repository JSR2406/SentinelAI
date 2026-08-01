from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.jwt_auth import get_current_user
from app.models.models import User
from app.schemas.schemas import AIChatRequest, AIChatResponse, AIFixRequest, AIFixResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="", tags=["AI Copilot Service"])

@router.post("/chat", response_model=AIChatResponse)
def ai_chat_explanation(
    req: AIChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat with AI Copilot to explain security findings and remediation options."""
    return AIService.explain_issue_or_chat(db, req)

@router.post("/autofix", response_model=AIFixResponse)
def ai_generate_autofix(
    req: AIFixRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate automated git code fix patch and optionally create a Pull Request."""
    return AIService.generate_autofix(db, req)
