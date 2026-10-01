CREATE SCHEMA `infra_portal_db` ;

USE `infra_portal_db`;

CREATE TABLE IF NOT EXISTS repository_requests  (
    id INT PRIMARY KEY AUTO_INCREMENT, -- Unique identifier for the request
    email VARCHAR(255) NOT NULL, -- Email of the person making the request
    lead_email VARCHAR(255) NOT NULL, -- Email of the team lead
    requirement TEXT NOT NULL, -- Description of the repository requirement
    cc_list TEXT NOT NULL, -- List of emails to be CC'd on the request
    repo_name VARCHAR(255) NOT NULL, -- Name of the repository being requested
    organization_id INT NOT NULL, -- ID of the organization to which the repository belongs
    repo_type ENUM("Private","Public") NOT NULL, -- Type of the repository (Private or Public)
    description TEXT NOT NULL, -- Description of the repository
    enable_issues ENUM("Yes","No") NOT NULL, -- Whether issues are enabled for the repository
    website_url VARCHAR(2083), -- URL for the repository's website
    topics TEXT NOT NULL, -- Comma-separated list of topics for the repository
    pr_protection ENUM('Default','Bal Lib Repo'), -- Type of PR protection
    teams TEXT NOT NULL, -- Comma-separated list of teams to be added to the repository
    enable_triage_wso2_all ENUM("Yes","No","N/A") NOT NULL, -- Whether WSO2 All Interns can triage
    enable_triage_wso2_all_interns ENUM("Yes","No","N/A") NOT NULL, -- Whether WSO2 All Interns can triage
    disable_triage_reason TEXT NOT NULL, -- Reason for disabling triage, if applicable
    ci_cd_requirement ENUM('Not Applicable','Jenkins','Azure') NOT NULL, -- CI/CD requirement for the repository
    jenkins_job_type VARCHAR(255), -- Type of Jenkins job (if applicable)
    jenkins_group_id VARCHAR(255), -- Jenkins group ID (if applicable)
    azure_devops_org VARCHAR(255), -- Azure DevOps organization (if applicable)
    azure_devops_project VARCHAR(255), -- Azure DevOps project (if applicable)
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of the request creation
    state ENUM('Approved','Pending','Rejected') NOT NULL, -- Current state of the request
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Timestamp of the latest update
);

CREATE TABLE IF NOT EXISTS github_organizations(
  organization_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL, -- Unique identifier for the organization
  organization_name VARCHAR(255) NOT NULL, -- Name of the organization
  visibility ENUM('Private','Public') NOT NULL, -- Visibility of the organization (Private or Public)
  plan ENUM('Free','Team','Enterprise') NOT NULL DEFAULT 'Free', -- Plan of the organization (Free, Team, Enterprise)
  enable_issues BOOLEAN NOT NULL DEFAULT TRUE, -- Whether issues are can be enabled for the organization
  active BOOLEAN NOT NULL DEFAULT TRUE -- Whether the organization is active or inactive (if deleted in a soft-delete manner)
);

CREATE TABLE IF NOT EXISTS github_topics(
  topic_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL, -- Unique identifier for the topic
  topic_name VARCHAR(255) NOT NULL UNIQUE, -- Name of the topic
  active BOOLEAN NOT NULL DEFAULT TRUE -- Whether the topic is active or inactive (if deleted in a soft-delete manner)
);

INSERT INTO github_topics (topic_name) 
VALUES
  ("api-management"),
  ("asgardeo"),
  ("identity"),
  ("choreo"),
  ("integration"),
  ("ballerina"),
  ("healthcare"),
  ("open-banking"),
  ("tooling"),
  ("ai"),
  ("common"),
  ("internal-apps");

CREATE TABLE IF NOT EXISTS team_leads (
    id INT AUTO_INCREMENT PRIMARY KEY, -- Unique identifier for the team lead
    lead_email VARCHAR(100), -- Email of the team lead
    team VARCHAR(100) NOT NULL, -- Name of the team
    active BOOLEAN NOT NULL DEFAULT TRUE -- Whether the team is active or inactive (if deleted in a soft-delete manner)
);

CREATE TABLE IF NOT EXISTS repository_request_comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL, -- Unique identifier for the comment
  request_id INT NOT NULL, -- ID of the repository request this comment belongs to
  author_email VARCHAR(255) NOT NULL, -- Email of the person who made the comment
  comment_text TEXT NOT NULL, -- Text of the comment
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of when the comment was created
  FOREIGN KEY (request_id) REFERENCES repository_requests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS default_teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL, -- Unique identifier for the team
    team_name VARCHAR(255) NOT NULL, -- Name of the team
    permission_level ENUM('pull', 'triage', 'push', 'admin') NOT NULL, -- Permission level for the team
    active BOOLEAN NOT NULL DEFAULT TRUE -- Whether the team is active or inactive (if deleted in a soft-delete manner)
);

CREATE TABLE IF NOT EXISTS organization_default_teams (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL, -- Unique identifier for the organization-team mapping
    organization_id INT NOT NULL, -- ID of the organization
    team_id INT NOT NULL, -- ID of the default team
    FOREIGN KEY (organization_id) REFERENCES github_organizations(organization_id) ON DELETE CASCADE, 
    FOREIGN KEY (team_id) REFERENCES default_teams(team_id) ON DELETE CASCADE,
    UNIQUE KEY unique_org_team (organization_id, team_id)
);
