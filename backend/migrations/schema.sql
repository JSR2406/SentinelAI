-- SentinelAI DevSecOps Platform Database Schema Migration SQL

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    github_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS repositories (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    branch VARCHAR(100) DEFAULT 'main',
    token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);

CREATE TABLE IF NOT EXISTS scans (
    id VARCHAR(255) PRIMARY KEY,
    repo_id VARCHAR(255) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    score DOUBLE PRECISION DEFAULT 100.0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_scans_repo_id ON scans(repo_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);

CREATE TABLE IF NOT EXISTS issues (
    id VARCHAR(255) PRIMARY KEY,
    scan_id VARCHAR(255) NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    tool VARCHAR(100) NOT NULL,
    file_path VARCHAR(500),
    line INT,
    col INT,
    type VARCHAR(150),
    severity VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    recommendation TEXT,
    raw_output JSONB
);

CREATE INDEX IF NOT EXISTS idx_issues_scan_id ON issues(scan_id);
CREATE INDEX IF NOT EXISTS idx_issues_tool ON issues(tool);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);

CREATE TABLE IF NOT EXISTS attack_nodes (
    id VARCHAR(255) PRIMARY KEY,
    repo_id VARCHAR(255) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    scan_id VARCHAR(255) NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(50),
    metadata_json JSONB
);

CREATE INDEX IF NOT EXISTS idx_attack_nodes_repo_id ON attack_nodes(repo_id);
CREATE INDEX IF NOT EXISTS idx_attack_nodes_scan_id ON attack_nodes(scan_id);

CREATE TABLE IF NOT EXISTS attack_edges (
    id VARCHAR(255) PRIMARY KEY,
    scan_id VARCHAR(255) NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    from_node_id VARCHAR(255) NOT NULL REFERENCES attack_nodes(id) ON DELETE CASCADE,
    to_node_id VARCHAR(255) NOT NULL REFERENCES attack_nodes(id) ON DELETE CASCADE,
    description TEXT,
    exploit_vector VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_attack_edges_scan_id ON attack_edges(scan_id);
CREATE INDEX IF NOT EXISTS idx_attack_edges_from ON attack_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_attack_edges_to ON attack_edges(to_node_id);

CREATE TABLE IF NOT EXISTS ai_conversations (
    id VARCHAR(255) PRIMARY KEY,
    scan_id VARCHAR(255) NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    issue_id VARCHAR(255) REFERENCES issues(id) ON DELETE CASCADE,
    message_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_scan_id ON ai_conversations(scan_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_issue_id ON ai_conversations(issue_id);

CREATE TABLE IF NOT EXISTS ai_fixes (
    id VARCHAR(255) PRIMARY KEY,
    issue_id VARCHAR(255) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    patch_text TEXT NOT NULL,
    pr_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'GENERATED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_fixes_issue_id ON ai_fixes(issue_id);
