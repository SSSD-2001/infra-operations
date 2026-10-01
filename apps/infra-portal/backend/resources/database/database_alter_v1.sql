USE `infra_portal_db`;

-- 1) github_organizations: Plan of the organization, whether issues are enabled, and soft-delete flag
ALTER TABLE github_organizations
    ADD COLUMN `plan` ENUM('Free','Team','Enterprise') NOT NULL DEFAULT 'Free' AFTER `visibility`,
    ADD COLUMN `enable_issues` BOOLEAN NOT NULL DEFAULT TRUE AFTER `plan`,
    ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT TRUE AFTER `enable_issues`;

-- 2) default_teams: Soft-delete flag
ALTER TABLE default_teams
    ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT TRUE AFTER `permission_level`;

-- 3) team_leads: Soft-delete flag
ALTER TABLE team_leads
    ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT TRUE AFTER `team`;

-- 4) github_topics: Soft-delete flag
ALTER TABLE github_topics
    ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT TRUE AFTER `topic_name`;
