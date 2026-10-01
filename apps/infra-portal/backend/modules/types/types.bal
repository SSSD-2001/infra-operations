# Status stored in user_default_repository_access.status.
public enum DefaultAccessStatus {
    NOT_GRANTED = "not_granted",
    GRANTING = "granting",
    GRANTED = "granted"
}

# Employment type stored in organizations_default_repositories.employment_type.
# Values match the HR entity employment type.
public enum EmploymentType {
    PERMANENT,
    INTERNSHIP
}
