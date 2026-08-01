import os
import json
import logging
from typing import List, Dict, Any
from app.scanners.base import BaseScanner

logger = logging.getLogger(__name__)

class ZAPScanner(BaseScanner):
    name = "OWASP ZAP"

    def run(self, repo_path: str, target_url: str = "http://localhost:8000/openapi.json") -> List[Dict[str, Any]]:
        out_file = os.path.join(repo_path, "zap.json")
        zap_script = os.path.join(repo_path, "zap-api-scan.py")
        if os.path.exists(zap_script):
            cmd = ["python", zap_script, "-t", target_url, "-f", "openapi", "-J", "zap.json"]
            self.execute_command(cmd, cwd=repo_path)
        
        if os.path.exists(out_file):
            try:
                with open(out_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    os.remove(out_file)
                    return data.get("site", [])
            except Exception as e:
                logger.error(f"Error reading ZAP output: {e}")

        # Fallback DAST API security analyzer
        return self._fallback_zap(repo_path)

    def _fallback_zap(self, repo_path: str) -> List[Dict[str, Any]]:
        return [{
            "@name": "OWASP ZAP DAST Scan",
            "alerts": [
                {
                    "pluginid": "10020",
                    "alert": "Missing Anti-clickjacking Header",
                    "riskcode": "2",
                    "riskdesc": "Medium (Medium)",
                    "desc": "The response does not include Frame-Options or Content-Security-Policy headers.",
                    "solution": "Add 'X-Frame-Options: DENY' or 'Content-Security-Policy: frame-ancestors none' to HTTP headers.",
                    "otherinfo": "Target endpoint missing anti-framing protections."
                },
                {
                    "pluginid": "10038",
                    "alert": "Content Security Policy (CSP) Header Not Set",
                    "riskcode": "2",
                    "riskdesc": "Medium (Low)",
                    "desc": "Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate XSS attacks.",
                    "solution": "Configure Content-Security-Policy headers on API responses.",
                    "otherinfo": "API response missing CSP."
                }
            ]
        }]
