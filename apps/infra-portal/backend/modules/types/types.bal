# Status stored in user_default_repository_access.status.
public enum DefaultAccessStatus {
    NOT_GRANTED = "not_granted",
    GRANTING = "granting",
    GRANTED = "granted"
}

# Access category stored in organizations_default_repositories.access_type.
public enum RepoAccessType {
    PERMANENT = "PERMANENT",
    CS = "CS",
    INTERN = "INTERN"
}