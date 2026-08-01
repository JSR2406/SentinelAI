import uuid
import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
import enum
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ScanStatus(str, enum.Enum):
    PENDING = "PENDING"
    CLONING = "CLONING"
    SCANNING = "SCANNING"
    PROCESSING = "PROCESSING"
    GRAPHING = "GRAPHING"
    AI_ANALYSIS = "AI_ANALYSIS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class IssueSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class NodeType(str, enum.Enum):
    ENTRY_POINT = "ENTRY_POINT"
    VULNERABILITY = "VULNERABILITY"
    ASSET = "ASSET"
    SENSITIVE_DATA = "SENSITIVE_DATA"
    EXPLOIT_STEP = "EXPLOIT_STEP"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    github_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    repositories = relationship("Repository", back_populates="owner", cascade="all, delete-orphan")

class Repository(Base):
    __tablename__ = "repositories"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    branch = Column(String, default="main")
    token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="repositories")
    scans = relationship("Scan", back_populates="repository", cascade="all, delete-orphan")
    attack_nodes = relationship("AttackNode", back_populates="repository", cascade="all, delete-orphan")

class Scan(Base):
    __tablename__ = "scans"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    repo_id = Column(String, ForeignKey("repositories.id"), nullable=False, index=True)
    status = Column(String, default=ScanStatus.PENDING.value, index=True)
    score = Column(Float, default=100.0)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    repository = relationship("Repository", back_populates="scans")
    issues = relationship("Issue", back_populates="scan", cascade="all, delete-orphan")
    attack_nodes = relationship("AttackNode", back_populates="scan", cascade="all, delete-orphan")
    attack_edges = relationship("AttackEdge", back_populates="scan", cascade="all, delete-orphan")
    ai_conversations = relationship("AIConversation", back_populates="scan", cascade="all, delete-orphan")

class Issue(Base):
    __tablename__ = "issues"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False, index=True)
    tool = Column(String, nullable=False, index=True) # Gitleaks, Semgrep, Trivy, ZAP, TruffleHog
    file_path = Column(String, nullable=True)
    line = Column(Integer, nullable=True)
    col = Column(Integer, nullable=True)
    type = Column(String, nullable=True)
    severity = Column(String, default=IssueSeverity.MEDIUM.value, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    raw_output = Column(JSON, nullable=True)

    scan = relationship("Scan", back_populates="issues")
    ai_fixes = relationship("AIFix", back_populates="issue", cascade="all, delete-orphan")
    ai_conversations = relationship("AIConversation", back_populates="issue", cascade="all, delete-orphan")

class AttackNode(Base):
    __tablename__ = "attack_nodes"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    repo_id = Column(String, ForeignKey("repositories.id"), nullable=False, index=True)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False, index=True)
    label = Column(String, nullable=False)
    type = Column(String, default=NodeType.VULNERABILITY.value)
    severity = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True)

    repository = relationship("Repository", back_populates="attack_nodes")
    scan = relationship("Scan", back_populates="attack_nodes")

class AttackEdge(Base):
    __tablename__ = "attack_edges"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False, index=True)
    from_node_id = Column(String, ForeignKey("attack_nodes.id"), nullable=False, index=True)
    to_node_id = Column(String, ForeignKey("attack_nodes.id"), nullable=False, index=True)
    description = Column(Text, nullable=True)
    exploit_vector = Column(String, nullable=True)

    scan = relationship("Scan", back_populates="attack_edges")

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False, index=True)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=True, index=True)
    message_history = Column(JSON, nullable=False, default=list) # [{role, content}, ...]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    scan = relationship("Scan", back_populates="ai_conversations")
    issue = relationship("Issue", back_populates="ai_conversations")

class AIFix(Base):
    __tablename__ = "ai_fixes"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=False, index=True)
    patch_text = Column(Text, nullable=False)
    pr_url = Column(String, nullable=True)
    status = Column(String, default="GENERATED")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    issue = relationship("Issue", back_populates="ai_fixes")
