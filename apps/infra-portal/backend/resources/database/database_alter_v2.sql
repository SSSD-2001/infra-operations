USE `infra_portal_db`;

CREATE TABLE IF NOT EXISTS organizations_default_repositories (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    org_name VARCHAR(255) NOT NULL,
    team_slug VARCHAR(255) NOT NULL,
    access_type ENUM('PERMANENT','CS','INTERN') NOT NULL,
    UNIQUE KEY unique_org_team_access (org_name, team_slug, access_type)
);

CREATE TABLE IF NOT EXISTS user_default_repository_access (
    employee_id VARCHAR(255) NOT NULL UNIQUE,
    granted BOOLEAN NOT NULL DEFAULT FALSE
);