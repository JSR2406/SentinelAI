import logging
from typing import List, Dict, Any
from app.models.models import Issue, IssueSeverity
from app.scanners.gitleaks import GitleaksScanner
from app.scanners.trufflehog import TruffleHogScanner
from app.scanners.semgrep import SemgrepScanner
from app.scanners.trivy import TrivyScanner
from app.scanners.zap import ZAPScanner

logger = logging.getLogger(__name__)

class OutputNormalizer:

    @staticmethod
    def normalize_gitleaks(raw_findings: List[Dict[str, Any]], scan_id: str) -> List[Issue]:
        issues = []
        for raw in raw_findings:
            sev = raw.get("Severity", "CRITICAL").upper()
            if sev not in IssueSeverity.__members__:
                sev = "HIGH"
                
            issues.append(Issue(
                scan_id=scan_id,
                tool="Gitleaks",
                file_path=raw.get("File") or raw.get("file"),
                line=raw.get("StartLine") or raw.get("line"),
                col=raw.get("StartColumn"),
                type="Hardcoded Secret",
                severity=sev,
                title=f"Secret Leaked: {raw.get('RuleID', 'Hardcoded Secret')}",
                description=raw.get("Description") or f"Detected exposed secret: {raw.get('Match', '***')}",
                recommendation="Revoke and rotate the exposed credentials immediately. Store secrets in environment variables or KMS.",
                raw_output=raw
            ))
        return issues

    @staticmethod
    def normalize_trufflehog(raw_findings: List[Dict[str, Any]], scan_id: str) -> List[Issue]:
        issues = []
        for raw in raw_findings:
            meta = raw.get("SourceMetadata", {}).get("Data", {}).get("Git", {})
            file_p = meta.get("file", ".env")
            line_no = meta.get("line", 1)
            detector = raw.get("DetectorName", "TruffleHog Secret Detector")
            
            issues.append(Issue(
                scan_id=scan_id,
                tool="TruffleHog",
                file_path=file_p,
                line=line_no,
                col=1,
                type="Secret / Credential Exposure",
                severity=IssueSeverity.CRITICAL.value,
                title=f"TruffleHog Finding: {detector}",
                description=f"Verified secret finding in repository. Detector: {detector}. Raw match: {raw.get('Raw', '***')}",
                recommendation="Invalidate secret token and remove secret from commit history using BFG Repo-Cleaner or git-filter-repo.",
                raw_output=raw
            ))
        return issues

    @staticmethod
    def normalize_semgrep(raw_findings: List[Dict[str, Any]], scan_id: str) -> List[Issue]:
        issues = []
        for raw in raw_findings:
            extra = raw.get("extra", {})
            sev_str = extra.get("severity", "MEDIUM").upper()
            if sev_str not in IssueSeverity.__members__:
                sev_str = "MEDIUM"
                
            start = raw.get("start", {})
            issues.append(Issue(
                scan_id=scan_id,
                tool="Semgrep",
                file_path=raw.get("path"),
                line=start.get("line"),
                col=start.get("col"),
                type="SAST Code Flaw",
                severity=sev_str,
                title=f"SAST Rule Violation: {raw.get('check_id', 'Code Flaw')}",
                description=extra.get("message") or "Code safety policy violation detected.",
                recommendation="Refactor vulnerable code logic to follow secure coding standards.",
                raw_output=raw
            ))
        return issues

    @staticmethod
    def normalize_trivy(raw_findings: List[Dict[str, Any]], scan_id: str) -> List[Issue]:
        issues = []
        for target in raw_findings:
            target_name = target.get("Target", "dependencies")
            for vuln in target.get("Vulnerabilities", []):
                sev = vuln.get("Severity", "HIGH").upper()
                if sev not in IssueSeverity.__members__:
                    sev = "HIGH"
                
                issues.append(Issue(
                    scan_id=scan_id,
                    tool="Trivy",
                    file_path=target_name,
                    line=1,
                    col=1,
                    type="Vulnerable Dependency",
                    severity=sev,
                    title=f"SCA: {vuln.get('VulnerabilityID', 'CVE')} in {vuln.get('PkgName')}",
                    description=f"Package {vuln.get('PkgName')} version {vuln.get('InstalledVersion')} contains vulnerability. {vuln.get('Title', '')}",
                    recommendation=f"Upgrade {vuln.get('PkgName')} to fixed version {vuln.get('FixedVersion', 'latest')}.",
                    raw_output=vuln
                ))
        return issues

    @staticmethod
    def normalize_zap(raw_findings: List[Dict[str, Any]], scan_id: str) -> List[Issue]:
        issues = []
        for site in raw_findings:
            alerts = site.get("alerts", [])
            for alert in alerts:
                risk = alert.get("riskdesc", "Medium").split(" ")[0].upper()
                if risk not in IssueSeverity.__members__:
                    risk = "MEDIUM"

                issues.append(Issue(
                    scan_id=scan_id,
                    tool="OWASP ZAP",
                    file_path="API Endpoint / HTTP Response",
                    line=1,
                    col=1,
                    type="DAST Dynamic Vulnerability",
                    severity=risk,
                    title=f"DAST Finding: {alert.get('alert')}",
                    description=alert.get("desc"),
                    recommendation=alert.get("solution") or "Update server API header response configurations.",
                    raw_output=alert
                ))
        return issues

def run_all_scanners_and_normalize(repo_path: str, scan_id: str) -> List[Issue]:
    """Runs all 5 scanners (Gitleaks, TruffleHog, Semgrep, Trivy, OWASP ZAP) and normalizes outputs."""
    all_issues: List[Issue] = []
    
    # 1. Gitleaks
    try:
        gitleaks_raw = GitleaksScanner().run(repo_path)
        all_issues.extend(OutputNormalizer.normalize_gitleaks(gitleaks_raw, scan_id))
    except Exception as e:
        logger.error(f"Error running Gitleaks: {e}")

    # 2. TruffleHog
    try:
        trufflehog_raw = TruffleHogScanner().run(repo_path)
        all_issues.extend(OutputNormalizer.normalize_trufflehog(trufflehog_raw, scan_id))
    except Exception as e:
        logger.error(f"Error running TruffleHog: {e}")

    # 3. Semgrep
    try:
        semgrep_raw = SemgrepScanner().run(repo_path)
        all_issues.extend(OutputNormalizer.normalize_semgrep(semgrep_raw, scan_id))
    except Exception as e:
        logger.error(f"Error running Semgrep: {e}")

    # 4. Trivy
    try:
        trivy_raw = TrivyScanner().run(repo_path)
        all_issues.extend(OutputNormalizer.normalize_trivy(trivy_raw, scan_id))
    except Exception as e:
        logger.error(f"Error running Trivy: {e}")

    # 5. OWASP ZAP
    try:
        zap_raw = ZAPScanner().run(repo_path)
        all_issues.extend(OutputNormalizer.normalize_zap(zap_raw, scan_id))
    except Exception as e:
        logger.error(f"Error running OWASP ZAP: {e}")

    return all_issues
