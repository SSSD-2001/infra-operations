USE `infra_portal_db`;

CREATE TABLE IF NOT EXISTS user_default_repository_access (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    employee_id VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('not_granted', 'granting', 'granted') NOT NULL DEFAULT 'not_granted'
);

CREATE TABLE IF NOT EXISTS organizations_default_repositories (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    org_name VARCHAR(50) NOT NULL,
    team_slug VARCHAR(100) NOT NULL,
    employment_type VARCHAR(50) NOT NULL,
    department VARCHAR(50) NULL DEFAULT NULL,
    UNIQUE KEY unique_org_team_employment (org_name, team_slug, employment_type, department)
);

INSERT IGNORE INTO organizations_default_repositories (org_name, team_slug, employment_type, department)
VALUES
  ("wso2", "wso2-readonly", "PERMANENT", NULL),
  ("wso2-extensions", "wso2-readonly", "PERMANENT", NULL),
  ("wso2-support", "wso2-support-readonly", "PERMANENT", NULL),
  ("wso2-cs", "cs-team", "PERMANENT", "CUSTOMER SUCCESS"),
  ("wso2-enterprise", "customer-success-team", "PERMANENT", "CUSTOMER SUCCESS"),
  ("wso2", "wso2-all-interns", "INTERNSHIP", NULL),
  ("wso2-extensions", "wso2-all-interns", "INTERNSHIP", NULL),
  ("wso2-enterprise", "wso2-all-interns", "INTERNSHIP", NULL),
  ("ballerina-platform", "wso2-all-interns", "INTERNSHIP", NULL);

UPDATE organizations_default_repositories
SET employment_type = 'INTERNSHIP'
WHERE employment_type = 'INTERN';
