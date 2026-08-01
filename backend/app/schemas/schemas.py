from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- User & Auth Schemas ---
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Repository Schemas ---
class RepoCreate(BaseModel):
    name: str = Field(..., example="my-secure-repo")
    url: str = Field(..., example="https://github.com/myorg/my-secure-repo.git")
    branch: str = Field(default="main", example="main")
    token: Optional[str] = Field(None, example="ghp_xxx")

class RepoResponse(BaseModel):
    id: str
    user_id: str
    name: str
    url: str
    branch: str
    created_at: datetime

    class Config:
        from_attributes = True

class RepoListResponse(BaseModel):
    total: int
    repositories: List[RepoResponse]

# --- Issue Schemas ---
class IssueResponse(BaseModel):
    id: str
    scan_id: str
    tool: str
    file_path: Optional[str] = None
    line: Optional[int] = None
    col: Optional[int] = None
    type: Optional[str] = None
    severity: str
    title: str
    description: Optional[str] = None
    recommendation: Optional[str] = None
    raw_output: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class SeverityCounts(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0

# --- Scan Schemas ---
class ScanCreate(BaseModel):
    repoId: str = Field(..., description="ID of the repository to scan")

class ScanResponse(BaseModel):
    scanId: str
    repoId: str
    status: str
    score: float
    started_at: datetime

class ScanStatusResponse(BaseModel):
    scanId: str
    repoId: str
    status: str
    score: float
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

# --- Attack Graph Schemas ---
class AttackNodeSchema(BaseModel):
    id: str
    label: str
    type: str # ENTRY_POINT, VULNERABILITY, ASSET, SENSITIVE_DATA, EXPLOIT_STEP
    severity: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(None, alias="metadata_json")

    class Config:
        from_attributes = True
        populate_by_name = True

class AttackEdgeSchema(BaseModel):
    id: str
    fromNodeId: str = Field(..., alias="from_node_id")
    toNodeId: str = Field(..., alias="to_node_id")
    description: Optional[str] = None
    exploitVector: Optional[str] = Field(None, alias="exploit_vector")

    class Config:
        from_attributes = True
        populate_by_name = True

class AttackGraphResponse(BaseModel):
    repoId: str
    scanId: Optional[str] = None
    nodes: List[AttackNodeSchema]
    edges: List[AttackEdgeSchema]

# --- AI Service Schemas ---
class ChatMessage(BaseModel):
    role: str # user, assistant, system
    content: str

class AIChatRequest(BaseModel):
    scanId: str
    issueId: Optional[str] = None
    message: str
    history: Optional[List[ChatMessage]] = []

class AIChatResponse(BaseModel):
    explanation: str
    recommendations: List[str] = []
    cached: bool = False

class AIFixRequest(BaseModel):
    issueId: str
    createPR: bool = False

class AIFixResponse(BaseModel):
    fixId: str
    issueId: str
    patchText: str
    prUrl: Optional[str] = None
    explanation: str

# --- Report Service Schemas ---
class ReportSummary(BaseModel):
    totalFindings: int
    severityCounts: SeverityCounts
    scannersRun: List[str]
    riskScore: float

class ReportResponse(BaseModel):
    scanId: str
    repoId: str
    repoName: str
    repoUrl: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    summary: ReportSummary
    findings: List[IssueResponse]
    attackGraph: AttackGraphResponse
    recommendations: List[str]

# --- Notification Schemas ---
class NotificationTestRequest(BaseModel):
    channel: str = Field(..., example="slack") # slack, email, webhook
    target: str = Field(..., example="https://hooks.slack.com/services/...")
    scanId: Optional[str] = None

class NotificationResponse(BaseModel):
    status: str
    message: str

# --- GitHub Auth Schemas ---
class GitHubCallbackRequest(BaseModel):
    code: str
