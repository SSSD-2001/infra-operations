## Infra Portal Backend

### Default repository access

After a user verifies their GitHub account, `PUT /set-default-repository-access` grants default org/team memberships based on HR employment type. The org/team lists are Ballerina configurables in the `github` module (see `modules/github/constants.bal`).

Built-in defaults are production org/team slugs:

| Configurable | Who it applies to | Default |
| --- | --- | --- |
| `permanentDefaultTeamAccess` | Permanent employees | `wso2-support` → `wso2-support-readonly`, `wso2` → `wso2-readonly`, `wso2-extensions` → `wso2-readonly` |
| `csTeamAccess` | Permanent employees in Customer Success (in addition to permanent defaults) | `wso2-cs` → `cs-team`, `wso2-enterprise` → `customer-success-team` |
| `internsDefaultOrganizations` | Interns | `wso2`, `wso2-extensions`, `wso2-support`, `ballerina-platform` |
| `internsTeamSlug` | Interns (team in each intern org) | `wso2-all-interns` |

#### Override for local/test

Override these under `[infra_portal.github]` in `Config.toml` (same section as other GitHub module settings). Example for local/test orgs:

```toml
[infra_portal.github]
permanentDefaultTeamAccess = [
    {orgName = "your-test-org", teamSlug = "your-readonly-team"}
]
csTeamAccess = [
    {orgName = "your-cs-test-org", teamSlug = "your-cs-team"}
]
internsDefaultOrganizations = ["your-test-org"]
internsTeamSlug = "your-interns-team"
```
