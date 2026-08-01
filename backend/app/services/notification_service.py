import logging
import requests
from typing import Dict, Any, Optional
from app.schemas.schemas import NotificationResponse

logger = logging.getLogger(__name__)

class NotificationService:

    @staticmethod
    def send_scan_completion_alert(scan_id: str, repo_name: str, score: float, critical_count: int, channel: str = "slack", target: Optional[str] = None) -> NotificationResponse:
        msg = f"🛡️ *SentinelAI Scan Completed*\nRepository: `{repo_name}`\nScan ID: `{scan_id}`\nSecurity Risk Score: *{score}/100*\nCritical Findings: *{critical_count}*"
        
        logger.info(f"Dispatching notification via {channel} to {target or 'default channel'}: {msg}")
        
        if target and target.startswith("http"):
            try:
                requests.post(target, json={"text": msg}, timeout=5)
            except Exception as e:
                logger.warning(f"Failed to post notification to webhook URL ({e})")

        return NotificationResponse(
            status="SUCCESS",
            message=f"Notification dispatched successfully to channel {channel}"
        )
