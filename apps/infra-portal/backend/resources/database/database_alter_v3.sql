USE `infra_portal_db`;

ALTER TABLE user_default_repository_access
    DROP PRIMARY KEY,
    ADD COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST,
    ADD COLUMN status ENUM('not_granted', 'granting', 'granted') NOT NULL DEFAULT 'not_granted',
    ADD UNIQUE KEY unique_employee_id (employee_id);

UPDATE user_default_repository_access
SET status = CASE WHEN granted = TRUE THEN 'granted' ELSE 'not_granted' END;

ALTER TABLE user_default_repository_access
    DROP COLUMN granted;