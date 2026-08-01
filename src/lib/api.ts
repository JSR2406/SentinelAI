/**
 * SentinelAI FastAPI Backend API Client
 * Provides full connectivity between Frontend UI and Backend Microservices Gateway.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface Repository {
  id: string;
  name: string;
  url: string;
  branch: string;
  createdAt: string;
}

export interface ScanStatusResponse {
  scanId: string;
  status: "PENDING" | "CLONING" | "SCANNING" | "PROCESSING" | "GRAPHING" | "AI_ANALYSIS" | "COMPLETED" | "FAILED";
  score?: number;
  completedAt?: string;
  errorMessage?: string;
}

export interface AttackNode {
  id: string;
  label: string;
  type: string;
  severity?: string;
  metadata?: Record<string, any>;
}

export interface AttackEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  description: string;
  exploitVector?: string;
}

export interface AttackGraphResponse {
  repoId: string;
  nodes: AttackNode[];
  edges: AttackEdge[];
}

export interface AIChatResponse {
  scanId: string;
  issueId?: string;
  explanation: string;
  cached: boolean;
}

export interface AIFixResponse {
  issueId: string;
  patchText: string;
  prUrl?: string;
  status: string;
}

export interface SecurityReportResponse {
  scanId: string;
  repoName: string;
  status: string;
  summary: {
    totalFindings: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    riskScore: number;
  };
  issues: Array<{
    id: string;
    tool: string;
    filePath: string;
    line: number;
    col: number;
    type: string;
    severity: string;
    title: string;
    description: string;
    recommendation: string;
  }>;
}

class SentinelAPIClient {
  private getHeaders(token?: string): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  /** Add GitHub repository */
  async addRepository(data: { name: string; url: string; branch?: string }, token?: string): Promise<Repository> {
    const res = await fetch(`${API_BASE_URL}/api/v1/repos`, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to add repository" }));
      throw new Error(err.detail || "Failed to add repository");
    }
    return res.json();
  }

  /** List user repositories */
  async getRepositories(token?: string): Promise<{ total: number; repositories: Repository[] }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/repos`, {
      headers: this.getHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to fetch repositories");
    return res.json();
  }

  /** Delete repository */
  async deleteRepository(repoId: string, token?: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/v1/repos/${repoId}`, {
      method: "DELETE",
      headers: this.getHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to delete repository");
    return true;
  }

  /** Trigger security scan */
  async triggerScan(repoId: string, token?: string): Promise<{ scanId: string; status: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/scan`, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify({ repoId }),
    });
    if (!res.ok) throw new Error("Failed to queue scan job");
    return res.json();
  }

  /** Check scan status */
  async getScanStatus(scanId: string, token?: string): Promise<ScanStatusResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/scan/${scanId}`, {
      headers: this.getHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to fetch scan status");
    return res.json();
  }

  /** Get Attack Graph JSON */
  async getAttackGraph(repoId: string, token?: string): Promise<AttackGraphResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/attack-graph/${repoId}`, {
      headers: this.getHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to fetch attack graph");
    return res.json();
  }

  /** AI Copilot Chat */
  async chatAICopilot(req: { scanId: string; issueId?: string; message: string }, token?: string): Promise<AIChatResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error("AI Copilot request failed");
    return res.json();
  }

  /** Generate AI Autofix Patch */
  async generateAutofix(req: { issueId: string; createPR?: boolean }, token?: string): Promise<AIFixResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/autofix`, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error("Failed to generate AI fix");
    return res.json();
  }

  /** Get Security Scan Report */
  async getReport(scanId: string, token?: string): Promise<SecurityReportResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/report/${scanId}`, {
      headers: this.getHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to fetch report");
    return res.json();
  }

  /** Get GitHub OAuth Login URL */
  async getGitHubLoginUrl(): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/auth/github/login`);
    if (!res.ok) throw new Error("Failed to fetch GitHub login URL");
    const data = await res.json();
    return data.login_url;
  }
}

export const apiClient = new SentinelAPIClient();
