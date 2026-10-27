## Infra Portal Backend

### Default repository access

After a user verifies their GitHub account, `PUT /set-default-repository-access` grants default
org/team memberships based on HR employment type, and `GET /default-repository-access` reports the
resulting status and repository list.

The org/team mappings are read at runtime from the `organizations_default_repositories` table via
`db:getOrganizationDefaultRepositories(...)`, which is the single source of truth:

| `employment_type` | `department` | Who it applies to |
| --- | --- | --- |
| `PERMANENT` | empty | Permanent employees |
| `PERMANENT` | `CUSTOMER SUCCESS` | Permanent employees in Customer Success (granted **in addition to** the empty-department rows) |
| `INTERNSHIP` | empty | Interns |

Per-user progress is tracked in `user_default_repository_access.status`, which is one of
`not_granted`, `granting` or `granted`. A grant is only recorded as `granted` when every team
membership succeeds, so partial failures remain retryable.

#### Local and test environments

`resources/database/database.sql` seeds the **production** org/team values. A local or test
database should replace those rows with orgs your GitHub token can actually reach, otherwise every
membership call fails:

```sql
DELETE FROM organizations_default_repositories;

INSERT INTO organizations_default_repositories (org_name, team_slug, employment_type, department)
VALUES
  ("your-test-org", "your-readonly-team", "PERMANENT", ""),
  ("your-cs-test-org", "your-cs-team", "PERMANENT", "CUSTOMER SUCCESS"),
  ("your-test-org", "your-interns-team", "INTERNSHIP", "");
```

The token used for these calls comes from the entity service `gitHubAccessTokens` configuration,
which must include every organization listed in the table. Granting a membership also requires the
token to have owner or team-maintainer rights in that organization; otherwise GitHub returns 403.
