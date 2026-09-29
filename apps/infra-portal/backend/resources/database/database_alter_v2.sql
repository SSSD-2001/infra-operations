USE `infra_portal_db`;

CREATE TABLE IF NOT EXISTS organizations_default_repositories (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    org_name VARCHAR(255) NOT NULL,
    team_slug VARCHAR(255) NOT NULL,
    access_type ENUM('PERMANENT','CS','INTERN') NOT NULL,
    UNIQUE KEY unique_org_team_access (org_name, team_slug, access_type)
);

CREATE TABLE IF NOT EXISTS user_default_repository_access (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    employee_id VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('not_granted', 'granting', 'granted') NOT NULL DEFAULT 'not_granted'
);

-- Default org/team access granted per employment type. IGNORE keeps re-runs safe.
INSERT IGNORE INTO organizations_default_repositories (org_name, team_slug, access_type)
VALUES
  ("wso2-support", "wso2-support-readonly", "PERMANENT"),
  ("wso2", "wso2-readonly", "PERMANENT"),
  ("wso2-extensions", "wso2-readonly", "PERMANENT"),
  ("wso2-cs", "cs-team", "CS"),
  ("wso2-enterprise", "customer-success-team", "CS"),
  ("wso2", "wso2-all-interns", "INTERN"),
  ("wso2-extensions", "wso2-all-interns", "INTERN"),
  ("wso2-enterprise", "wso2-all-interns", "INTERN"),
  ("ballerina-platform", "wso2-all-interns", "INTERN");

CREATE TABLE IF NOT EXISTS access_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    github_username VARCHAR(255) NOT NULL,
    lead_email VARCHAR(255) NOT NULL,
    cc_list TEXT NOT NULL,
    organization_id INT NOT NULL,
    org_name VARCHAR(255) NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    permission ENUM('pull', 'triage', 'push') NOT NULL,
    justification TEXT NOT NULL,
    state ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    reviewer_email VARCHAR(255) NULL,
    review_comment TEXT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    pending_key CHAR(1) GENERATED ALWAYS AS (IF(state = 'Pending', 'Y', NULL)) STORED,
    UNIQUE KEY unique_pending_access_request (email, org_name, repo_name, pending_key)
);

CREATE TABLE IF NOT EXISTS repo_team_leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    team_slug VARCHAR(255) NOT NULL,
    lead_email VARCHAR(255) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (organization_id) REFERENCES github_organizations(organization_id) ON DELETE CASCADE,
    UNIQUE KEY unique_org_team (organization_id, team_slug)
);
