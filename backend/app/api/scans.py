import datetime
import threading
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.auth.jwt_auth import get_current_user
from app.models.models import User, Scan, Repository, ScanStatus, Issue, IssueSeverity
from app.schemas.schemas import ScanCreate, ScanResponse, ScanStatusResponse
from app.worker.tasks import run_scan_job, run_full_scan_pipeline

router = APIRouter(prefix="/scan", tags=["Scan Service"])


class ScanListItem(BaseModel):
    scanId: str
    repoId: str
    repoName: str
    status: str
    score: Optional[float] = None
    started_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    findingsCount: int = 0
    criticalCount: int = 0

    class Config:
        from_attributes = True


class ScanListResponse(BaseModel):
    total: int
    scans: List[ScanListItem]


class DashboardStats(BaseModel):
    repoCount: int
    scanCount: int
    latestScore: float
    critical: int
    high: int
    medium: int
    low: int
    recentScans: List[ScanListItem]


@router.get("", response_model=ScanListResponse, tags=["Scan Service"])
def list_scans(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all scans for the current user across all repositories."""
    user_repos = db.query(Repository).filter(Repository.user_id == user.id).all()
    repo_map = {r.id: r.name for r in user_repos}
    repo_ids = list(repo_map.keys())

    if not repo_ids:
        return ScanListResponse(total=0, scans=[])

    scans = (
        db.query(Scan)
        .filter(Scan.repo_id.in_(repo_ids))
        .order_by(Scan.started_at.desc())
        .limit(50)
        .all()
    )

    items = []
    for scan in scans:
        issue_count = db.query(Issue).filter(Issue.scan_id == scan.id).count()
        critical_count = db.query(Issue).filter(
            Issue.scan_id == scan.id,
            Issue.severity == IssueSeverity.CRITICAL.value
        ).count()
        items.append(ScanListItem(
            scanId=scan.id,
            repoId=scan.repo_id,
            repoName=repo_map.get(scan.repo_id, "Unknown"),
            status=scan.status,
            score=scan.score,
            started_at=scan.started_at,
            completed_at=scan.completed_at,
            findingsCount=issue_count,
            criticalCount=critical_count,
        ))

    return ScanListResponse(total=len(items), scans=items)


@router.get("/dashboard/stats", response_model=DashboardStats, tags=["Dashboard"])
def get_dashboard_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggregated dashboard stats: repo count, scan count, score, severity breakdown."""
    user_repos = db.query(Repository).filter(Repository.user_id == user.id).all()
    repo_map = {r.id: r.name for r in user_repos}
    repo_ids = list(repo_map.keys())

    all_scans = (
        db.query(Scan)
        .filter(Scan.repo_id.in_(repo_ids))
        .order_by(Scan.started_at.desc())
        .all()
    ) if repo_ids else []

    completed_scans = [s for s in all_scans if s.status == ScanStatus.COMPLETED.value]
    latest_score = completed_scans[0].score if completed_scans else 75.0

    # Aggregate severity from last 10 completed scans
    recent_scan_ids = [s.id for s in completed_scans[:10]]
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    if recent_scan_ids:
        for issue in db.query(Issue).filter(Issue.scan_id.in_(recent_scan_ids)).all():
            sev = str(issue.severity).upper()
            if sev == IssueSeverity.CRITICAL.value:
                counts["critical"] += 1
            elif sev == IssueSeverity.HIGH.value:
                counts["high"] += 1
            elif sev == IssueSeverity.MEDIUM.value:
                counts["medium"] += 1
            elif sev == IssueSeverity.LOW.value:
                counts["low"] += 1

    recent_items = []
    for scan in all_scans[:5]:
        ic = db.query(Issue).filter(Issue.scan_id == scan.id).count()
        cc = db.query(Issue).filter(
            Issue.scan_id == scan.id,
            Issue.severity == IssueSeverity.CRITICAL.value
        ).count()
        recent_items.append(ScanListItem(
            scanId=scan.id,
            repoId=scan.repo_id,
            repoName=repo_map.get(scan.repo_id, "Unknown"),
            status=scan.status,
            score=scan.score,
            started_at=scan.started_at,
            completed_at=scan.completed_at,
            findingsCount=ic,
            criticalCount=cc,
        ))

    return DashboardStats(
        repoCount=len(user_repos),
        scanCount=len(all_scans),
        latestScore=round(latest_score, 1),
        critical=counts["critical"],
        high=counts["high"],
        medium=counts["medium"],
        low=counts["low"],
        recentScans=recent_items,
    )


@router.post("", response_model=ScanResponse, status_code=status.HTTP_202_ACCEPTED)
def trigger_scan(
    scan_in: ScanCreate,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Queue a security scan job for a repository."""
    repo = db.query(Repository).filter(
        Repository.id == scan_in.repoId,
        Repository.user_id == user.id
    ).first()

    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository {scan_in.repoId} not found or unauthorized"
        )

    scan = Scan(
        repo_id=repo.id,
        status=ScanStatus.PENDING.value,
        score=100.0,
        started_at=datetime.datetime.utcnow()
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    # Execute scan job in background task
    background_tasks.add_task(run_full_scan_pipeline, scan.id)

    return ScanResponse(
        scanId=scan.id,
        repoId=scan.repo_id,
        status=scan.status,
        score=scan.score,
        started_at=scan.started_at
    )


@router.get("/{scan_id}", response_model=ScanStatusResponse)
def get_scan_status(
    scan_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check status and score of an ongoing or completed security scan job."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan job {scan_id} not found"
        )

    return ScanStatusResponse(
        scanId=scan.id,
        repoId=scan.repo_id,
        status=scan.status,
        score=scan.score,
        started_at=scan.started_at,
        completed_at=scan.completed_at,
        error_message=scan.error_message
    )
