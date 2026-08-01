from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.jwt_auth import get_current_user
from app.models.models import User
from app.schemas.schemas import ReportResponse
from app.services.report_service import ReportService

router = APIRouter(prefix="/report", tags=["Report Service"])

@router.get("/{scan_id}", response_model=ReportResponse)
def get_scan_report(
    scan_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve complete security report, risk score, severity counts, and recommendations."""
    return ReportService.generate_report(db, scan_id)

@router.get("/{scan_id}/html", response_class=HTMLResponse)
def get_scan_report_html(
    scan_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve HTML printable formatted scan report."""
    report = ReportService.generate_report(db, scan_id)
    return ReportService.render_html_report(report)
