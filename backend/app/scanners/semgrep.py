import os
import json
import logging
from typing import List, Dict, Any
from app.scanners.base import BaseScanner

logger = logging.getLogger(__name__)

class SemgrepScanner(BaseScanner):
    name = "Semgrep"

    def run(self, repo_path: str) -> List[Dict[str, Any]]:
        out_file = os.path.join(repo_path, "semgrep.json")
        cmd = ["semgrep", "scan", "--json", f"--output={out_file}", repo_path]
        
        self.execute_command(cmd, cwd=repo_path)
        
        if os.path.exists(out_file):
            try:
                with open(out_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    os.remove(out_file)
                    return data.get("results", [])
            except Exception as e:
                logger.error(f"Error reading semgrep output: {e}")

        # Fallback static code analyzer if Semgrep CLI is not present
        return self._fallback_semgrep(repo_path)

    def _fallback_semgrep(self, repo_path: str) -> List[Dict[str, Any]]:
        findings = []
        checks = [
            ("eval(", "python.lang.security.audit.eval-detected", "HIGH", "Use of eval() detected. Allows arbitrary code execution."),
            ("exec(", "python.lang.security.audit.exec-detected", "HIGH", "Use of exec() detected. Dynamic code execution risk."),
            ("dangerouslySetInnerHTML", "javascript.react.security.audit.react-dangerouslysetinnerhtml", "MEDIUM", "Raw HTML dangerously rendered without sanitization."),
            ("cors({ origin: '*' })", "javascript.express.security.audit.cors-wildcard", "MEDIUM", "CORS wildcard origin allows unauthorized cross-origin requests."),
            ("SELECT * FROM", "generic.sqli.raw-sql-concat", "HIGH", "Potential SQL injection vulnerability in raw query strings.")
        ]
        
        for root, _, files in os.walk(repo_path):
            if ".git" in root or "node_modules" in root:
                continue
            for file in files:
                if file.endswith((".py", ".js", ".ts", ".jsx", ".tsx", ".sql")):
                    fp = os.path.join(root, file)
                    rel_p = os.path.relpath(fp, repo_path)
                    try:
                        with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                            for idx, line in enumerate(f, 1):
                                for kw, rule_id, sev, desc in checks:
                                    if kw in line:
                                        findings.append({
                                            "check_id": rule_id,
                                            "path": rel_p,
                                            "start": {"line": idx, "col": 1},
                                            "extra": {
                                                "message": desc,
                                                "severity": sev,
                                                "lines": line.strip()
                                            }
                                        })
                    except Exception:
                        pass
        return findings
