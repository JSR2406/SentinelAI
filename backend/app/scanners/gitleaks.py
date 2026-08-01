import os
import json
import logging
from typing import List, Dict, Any
from app.scanners.base import BaseScanner

logger = logging.getLogger(__name__)

class GitleaksScanner(BaseScanner):
    name = "Gitleaks"

    def run(self, repo_path: str) -> List[Dict[str, Any]]:
        report_file = os.path.join(repo_path, "gitleaks_report.json")
        cmd = [
            "gitleaks", "detect",
            "--source", repo_path,
            "--format", "json",
            "--report-path", report_file
        ]
        
        out = self.execute_command(cmd, cwd=repo_path)
        
        if os.path.exists(report_file):
            try:
                with open(report_file, "r", encoding="utf-8") as f:
                    findings = json.load(f)
                    os.remove(report_file)
                    return findings if isinstance(findings, list) else []
            except Exception as e:
                logger.error(f"Error reading gitleaks output file: {e}")

        # Fallback parser/scanner if Gitleaks binary not present in local environment
        return self._fallback_detect_secrets(repo_path)

    def _fallback_detect_secrets(self, repo_path: str) -> List[Dict[str, Any]]:
        """Fallback secret pattern scanner for local dev/testing without gitleaks CLI."""
        findings = []
        secret_patterns = [
            ("AWS Access Key", "AKIA[0-9A-Z]{16}", "CRITICAL"),
            ("GitHub Personal Token", "ghp_[a-zA-Z0-9]{36}", "CRITICAL"),
            ("Generic API Secret", "api_key\\s*=\\s*['\"][a-zA-Z0-9_\\-]{20,}['\"]", "HIGH"),
            ("Private RSA Key", "-----BEGIN RSA PRIVATE KEY-----", "CRITICAL")
        ]
        import re
        for root, _, files in os.walk(repo_path):
            if ".git" in root or "node_modules" in root:
                continue
            for file in files:
                if file.endswith((".py", ".js", ".ts", ".env", ".yaml", ".json", ".config")):
                    file_p = os.path.join(root, file)
                    rel_p = os.path.relpath(file_p, repo_path)
                    try:
                        with open(file_p, "r", encoding="utf-8", errors="ignore") as f:
                            for idx, line in enumerate(f, 1):
                                for name, pattern, sev in secret_patterns:
                                    if re.search(pattern, line):
                                        findings.append({
                                            "RuleID": name,
                                            "Description": f"Hardcoded {name} identified in source code",
                                            "StartLine": idx,
                                            "StartColumn": 1,
                                            "File": rel_p,
                                            "Match": line.strip(),
                                            "Secret": "****",
                                            "Severity": sev
                                        })
                    except Exception:
                        pass
        return findings
