from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.jwt_auth import get_current_user
from app.models.models import User
from app.schemas.schemas import NotificationTestRequest, NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notification Service"])

@router.post("/test", response_model=NotificationResponse)
def test_notification_alert(
    req: NotificationTestRequest,
    user: User = Depends(get_current_user)
):
    """Test dispatching email or Slack webhook notifications."""
    return NotificationService.send_scan_completion_alert(
        scan_id=req.scanId or "test-scan-001",
        repo_name="SentinelAI-Test-Repo",
        score=85.0,
        critical_count=1,
        channel=req.channel,
        target=req.target
    )
