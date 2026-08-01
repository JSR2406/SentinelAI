import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Repository, Scan, Issue, AttackNode, AttackEdge, NodeType, IssueSeverity
from app.schemas.schemas import AttackGraphResponse, AttackNodeSchema, AttackEdgeSchema

class AttackGraphService:

    @staticmethod
    def generate_graph_for_scan(db: Session, scan_id: str) -> None:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return

        repo_id = scan.repo_id

        # Clean existing nodes and edges for this scan
        db.query(AttackEdge).filter(AttackEdge.scan_id == scan_id).delete()
        db.query(AttackNode).filter(AttackNode.scan_id == scan_id).delete()
        db.commit()

        issues = db.query(Issue).filter(Issue.scan_id == scan_id).all()

        nodes: List[AttackNode] = []
        edges: List[AttackEdge] = []

        # 1. Target Asset Node (Root asset being protected)
        asset_node = AttackNode(
            id=str(uuid.uuid4()),
            repo_id=repo_id,
            scan_id=scan_id,
            label="Production Database & Cloud Infrastructure",
            type=NodeType.ASSET.value,
            severity="CRITICAL",
            metadata_json={"asset_type": "Database / Cloud Infrastructure"}
        )
        nodes.append(asset_node)

        entry_nodes = []
        vuln_nodes = []
        secret_nodes = []

        # Categorize issues into graph nodes
        for issue in issues:
            n_id = str(uuid.uuid4())
            if issue.tool in ["OWASP ZAP", "DAST"]:
                node = AttackNode(
                    id=n_id,
                    repo_id=repo_id,
                    scan_id=scan_id,
                    label=f"Entry Point: {issue.title}",
                    type=NodeType.ENTRY_POINT.value,
                    severity=issue.severity,
                    metadata_json={"file": issue.file_path, "tool": issue.tool}
                )
                entry_nodes.append(node)
            elif issue.tool in ["Gitleaks", "TruffleHog"]:
                node = AttackNode(
                    id=n_id,
                    repo_id=repo_id,
                    scan_id=scan_id,
                    label=f"Exposed Credential: {issue.title}",
                    type=NodeType.SENSITIVE_DATA.value,
                    severity=issue.severity,
                    metadata_json={"file": issue.file_path, "line": issue.line}
                )
                secret_nodes.append(node)
            else: # Semgrep, Trivy
                node = AttackNode(
                    id=n_id,
                    repo_id=repo_id,
                    scan_id=scan_id,
                    label=f"Code Flaw: {issue.title}",
                    type=NodeType.VULNERABILITY.value,
                    severity=issue.severity,
                    metadata_json={"file": issue.file_path, "line": issue.line, "tool": issue.tool}
                )
                vuln_nodes.append(node)
            
            nodes.append(node)

        # Default fallback entry point if no ZAP findings
        if not entry_nodes:
            default_entry = AttackNode(
                id=str(uuid.uuid4()),
                repo_id=repo_id,
                scan_id=scan_id,
                label="Public Web Endpoint / HTTP Gateway",
                type=NodeType.ENTRY_POINT.value,
                severity="INFO",
                metadata_json={"route": "/api/v1"}
            )
            nodes.append(default_entry)
            entry_nodes.append(default_entry)

        db.add_all(nodes)
        db.commit()

        # Construct Exploit Edges between nodes
        for entry in entry_nodes:
            for vuln in vuln_nodes:
                edges.append(AttackEdge(
                    id=str(uuid.uuid4()),
                    scan_id=scan_id,
                    from_node_id=entry.id,
                    to_node_id=vuln.id,
                    description="Attacker sends malicious payload via un-sanitized endpoint parameter",
                    exploit_vector="HTTP Request Injection"
                ))

        for vuln in vuln_nodes:
            for secret in secret_nodes:
                edges.append(AttackEdge(
                    id=str(uuid.uuid4()),
                    scan_id=scan_id,
                    from_node_id=vuln.id,
                    to_node_id=secret.id,
                    description="Attacker leverages code execution to read hardcoded environment secrets",
                    exploit_vector="Local File Inclusion / Memory Inspection"
                ))

        for secret in secret_nodes:
            edges.append(AttackEdge(
                id=str(uuid.uuid4()),
                scan_id=scan_id,
                from_node_id=secret.id,
                to_node_id=asset_node.id,
                description="Attacker uses leaked API key/token to gain administrative access to Cloud Database",
                exploit_vector="Direct Privilege Escalation"
            ))

        if not secret_nodes and vuln_nodes:
            for vuln in vuln_nodes:
                edges.append(AttackEdge(
                    id=str(uuid.uuid4()),
                    scan_id=scan_id,
                    from_node_id=vuln.id,
                    to_node_id=asset_node.id,
                    description="Unpatched vulnerability permits compromise of host server",
                    exploit_vector="Remote Code Execution (RCE)"
                ))

        db.add_all(edges)
        db.commit()

    @staticmethod
    def get_attack_graph_for_repo(db: Session, repo_id: str) -> AttackGraphResponse:
        # Get latest completed scan for repository
        scan = db.query(Scan).filter(
            Scan.repo_id == repo_id
        ).order_by(Scan.started_at.desc()).first()

        if not scan:
            return AttackGraphResponse(repoId=repo_id, scanId=None, nodes=[], edges=[])

        nodes = db.query(AttackNode).filter(AttackNode.scan_id == scan.id).all()
        edges = db.query(AttackEdge).filter(AttackEdge.scan_id == scan.id).all()

        return AttackGraphResponse(
            repoId=repo_id,
            scanId=scan.id,
            nodes=[AttackNodeSchema.model_validate(n) for n in nodes],
            edges=[AttackEdgeSchema.model_validate(e) for e in edges]
        )
