from typing import List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Scan, Repository, Issue, IssueSeverity
from app.schemas.schemas import ReportResponse, ReportSummary, SeverityCounts, IssueResponse, AttackGraphResponse
from app.services.attack_graph_service import AttackGraphService

class ReportService:

    @staticmethod
    def compute_risk_score(issues: List[Issue]) -> float:
        score = 100.0
        for issue in issues:
            sev = str(issue.severity).upper()
            if sev == IssueSeverity.CRITICAL.value:
                score -= 15.0
            elif sev == IssueSeverity.HIGH.value:
                score -= 10.0
            elif sev == IssueSeverity.MEDIUM.value:
                score -= 5.0
            elif sev == IssueSeverity.LOW.value:
                score -= 2.0
        return max(0.0, min(100.0, score))

    @staticmethod
    def generate_report(db: Session, scan_id: str) -> ReportResponse:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scan report not found for ID {scan_id}"
            )

        repo = db.query(Repository).filter(Repository.id == scan.repo_id).first()
        issues = db.query(Issue).filter(Issue.scan_id == scan_id).all()

        counts = SeverityCounts()
        scanners_set = set()

        for issue in issues:
            scanners_set.add(issue.tool)
            sev = str(issue.severity).upper()
            if sev == IssueSeverity.CRITICAL.value:
                counts.critical += 1
            elif sev == IssueSeverity.HIGH.value:
                counts.high += 1
            elif sev == IssueSeverity.MEDIUM.value:
                counts.medium += 1
            elif sev == IssueSeverity.LOW.value:
                counts.low += 1
            else:
                counts.info += 1

        risk_score = ReportService.compute_risk_score(issues)
        scan.score = risk_score
        db.commit()

        summary = ReportSummary(
            totalFindings=len(issues),
            severityCounts=counts,
            scannersRun=list(scanners_set) if scanners_set else ["Gitleaks", "TruffleHog", "Semgrep", "Trivy", "OWASP ZAP"],
            riskScore=risk_score
        )

        attack_graph = AttackGraphService.get_attack_graph_for_repo(db, repo.id if repo else "")

        recommendations = [
            "Revoke and rotate all hardcoded secrets detected by Gitleaks and TruffleHog.",
            "Sanitize dynamic queries to eliminate SQL and command injection risks flagged by Semgrep.",
            "Upgrade vulnerable third-party libraries identified in Trivy SCA scans.",
            "Configure anti-clickjacking and Content Security Policy headers on exposed API endpoints."
        ]

        return ReportResponse(
            scanId=scan.id,
            repoId=scan.repo_id,
            repoName=repo.name if repo else "Unknown Repository",
            repoUrl=repo.url if repo else "",
            status=scan.status,
            started_at=scan.started_at,
            completed_at=scan.completed_at,
            summary=summary,
            findings=[IssueResponse.model_validate(i) for i in issues],
            attackGraph=attack_graph,
            recommendations=recommendations
        )

    @staticmethod
    def render_html_report(report: ReportResponse) -> str:
        """Renders an HTML report template for downloadable scan documentation."""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>SentinelAI Security Scan Report - {report.repoName}</title>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }}
                .card {{ background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #334155; }}
                h1, h2, h3 {{ color: #38bdf8; }}
                .badge {{ display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 0.85rem; }}
                .critical {{ background: #ef4444; color: white; }}
                .high {{ background: #f97316; color: white; }}
                .medium {{ background: #eab308; color: black; }}
                .low {{ background: #3b82f6; color: white; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
                th, td {{ border: 1px solid #334155; padding: 12px; text-align: left; }}
                th {{ background: #0f172a; color: #94a3b8; }}
            </style>
        </head>
        <body>
            <h1>SentinelAI Security Scan Report</h1>
            <div class="card">
                <h2>Repository: {report.repoName}</h2>
                <p><strong>Scan ID:</strong> {report.scanId}</p>
                <p><strong>Security Score:</strong> <span style="font-size: 1.5rem; font-weight: bold; color: {'#22c55e' if report.summary.riskScore > 70 else '#ef4444'};">{report.summary.riskScore}/100</span></p>
                <p><strong>Total Findings:</strong> {report.summary.totalFindings}</p>
            </div>
            
            <div class="card">
                <h2>Findings Summary</h2>
                <table>
                    <thead>
                        <tr><th>Tool</th><th>Title</th><th>Severity</th><th>File</th></tr>
                    </thead>
                    <tbody>
        """
        for item in report.findings:
            sev_cls = item.severity.lower()
            html += f"<tr><td>{item.tool}</td><td>{item.title}</td><td><span class='badge {sev_cls}'>{item.severity}</span></td><td>{item.file_path or 'N/A'}:{item.line or 1}</td></tr>"
        html += """
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        """
        return html
