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
