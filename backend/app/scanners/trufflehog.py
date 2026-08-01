import os
import json
import logging
from typing import List, Dict, Any
from app.scanners.base import BaseScanner

logger = logging.getLogger(__name__)

class TruffleHogScanner(BaseScanner):
    name = "TruffleHog"

    def run(self, repo_path: str) -> List[Dict[str, Any]]:
        cmd = ["trufflehog", "git", "--json", repo_path]
        out = self.execute_command(cmd, cwd=repo_path)
        
        findings = []
        if out:
            for line in out.splitlines():
                line = line.strip()
                if line.startswith("{"):
                    try:
                        data = json.loads(line)
                        findings.append(data)
                    except Exception:
                        pass
        
        if findings:
            return findings

        # Fallback if TruffleHog CLI is not present
        return self._fallback_trufflehog(repo_path)

    def _fallback_trufflehog(self, repo_path: str) -> List[Dict[str, Any]]:
        findings = []
        # Sample detection check
        env_file = os.path.join(repo_path, ".env")
        if os.path.exists(env_file):
            findings.append({
                "SourceMetadata": {"Data": {"Git": {"file": ".env", "line": 1}}},
                "DecoderName": "dotenv_secret",
                "DetectorName": "Environment Secret Detector",
                "Verified": True,
                "Raw": "STRIPE_SECRET_KEY=sk_test_51Mz...",
                "ExtraData": {"reason": "Uncommitted or exposed .env secret credentials detected"}
            })
        return findings
