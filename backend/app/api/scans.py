import datetime
import threading
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.jwt_auth import get_current_user
from app.models.models import User, Scan, Repository, ScanStatus
from app.schemas.schemas import ScanCreate, ScanResponse, ScanStatusResponse
from app.worker.tasks import run_scan_job, run_full_scan_pipeline

router = APIRouter(prefix="/scan", tags=["Scan Service"])

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
