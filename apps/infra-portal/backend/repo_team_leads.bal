// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import infra_portal.database as db;
import infra_portal.github as gh;
import infra_portal.scim;

import ballerina/http;
import ballerina/log;

isolated function syncRepoTeamLeads() returns db:RepoTeamLeadSyncResult|http:InternalServerError {
    db:Organization[]|error organizations = db:getOrganizations();
    if organizations is error {
        return <http:InternalServerError>{body: {message: "Error while fetching organizations!"}};
    }

    db:RepoTeamLeadKey[]|error existingKeys = db:getRepoTeamLeadKeys();
    if existingKeys is error {
        return <http:InternalServerError>{body: {message: "Error while fetching existing team leads!"}};
    }

    map<string?> existingEmails = {};
    foreach db:RepoTeamLeadKey key in existingKeys {
        existingEmails[string `${key.organizationId}|${key.teamSlug}`] = key.leadEmail;
    }

    int|error deactivated = db:deactivateRepoTeamLeadsForInactiveOrgs();
    if deactivated is error {
        return <http:InternalServerError>{body: {message: "Error while removing stale repo team leads!"}};
    }
    int deletedCount = deactivated;

    map<string?> githubIdEmailCache = {};
    int addedCount = 0;
    int updatedCount = 0;
    foreach db:Organization org in organizations {
        gh:GitHubTeam[]|error teams = gh:getAllTeamsForOrganization(org.organizationName);
        if teams is error {
            log:printError("Error fetching GitHub teams", teams, organizationName = org.organizationName);
            continue;
        }
        map<boolean> fetchedSlugs = {};
        foreach gh:GitHubTeam team in teams {
            fetchedSlugs[team.slug] = true;
            string mapKey = string `${org.organizationId}|${team.slug}`;
            boolean isNew = !existingEmails.hasKey(mapKey);
            string? currentEmail = isNew ? () : existingEmails[mapKey];
            boolean needsLead = isNew
                || currentEmail is ()
                || currentEmail == ""
                || currentEmail == gh:defaultRepoTeamLeadEmail;
            if !needsLead {
                continue;
            }

            string? resolvedEmail = ();
            gh:TeamMember[]|error maintainers = gh:getTeamMaintainers(org.organizationName, team.slug);
            if maintainers is error {
                log:printWarn("Error fetching team maintainers", maintainers,
                    organizationName = org.organizationName, teamSlug = team.slug);
            } else {
                foreach gh:TeamMember maintainer in maintainers {
                    string idKey = maintainer.id.toString();
                    if githubIdEmailCache.hasKey(idKey) {
                        resolvedEmail = githubIdEmailCache[idKey];
                    } else {
                        string?|error mapped = scim:searchWorkEmailByGithubUserId(idKey);
                        if mapped is error {
                            log:printWarn("Asgardeo GitHub user id lookup failed", mapped,
                                githubUserId = idKey, githubLogin = maintainer.login);
                            githubIdEmailCache[idKey] = ();
                        } else {
                            githubIdEmailCache[idKey] = mapped;
                            resolvedEmail = mapped;
                        }
                    }
                    if resolvedEmail is string {
                        break;
                    }
                }
            }

            string leadEmail = resolvedEmail is string ? resolvedEmail : gh:defaultRepoTeamLeadEmail;
            if isNew {
                error? inserted = db:insertRepoTeamLead(org.organizationId, team.name, team.slug, leadEmail);
                if inserted is error {
                    return <http:InternalServerError>{body: {message: "Error while inserting repo team lead!"}};
                }
                addedCount += 1;
            } else {
                int|error filled = db:fillRepoTeamLeadEmail(
                    org.organizationId, team.slug, currentEmail, leadEmail
                );
                if filled is error {
                    return <http:InternalServerError>{body: {message: "Error while updating repo team lead!"}};
                }
                updatedCount += filled;
            }
        }
        foreach db:RepoTeamLeadKey key in existingKeys {
            if key.organizationId != org.organizationId || fetchedSlugs.hasKey(key.teamSlug) {
                continue;
            }
            int|error removed = db:deactivateRepoTeamLead(key.organizationId, key.teamSlug);
            if removed is error {
                return <http:InternalServerError>{body: {message: "Error while removing stale repo team leads!"}};
            }
            deletedCount += removed;
        }
    }
    return {addedCount, deletedCount, updatedCount};
}

# Returns the submitted lead email when that person leads a team that has the repository.
#
# + organizationId - Organization id
# + orgName - GitHub organization login
# + repoName - Repository name
# + leadEmail - Lead email from the request payload
# + return - The payload email, () when no matching team has the repository, or error
isolated function leadEmailForRepository(
    int organizationId,
    string orgName,
    string repoName,
    string leadEmail
) returns string?|error {
    db:RepoTeamLead[] leads = check db:getRepoTeamLeadsForAccess(organizationId, leadEmail);
    foreach db:RepoTeamLead lead in leads {
        boolean|error hasRepo = teamHasRepository(orgName, lead.teamSlug, repoName);
        if hasRepo is error {
            return hasRepo;
        }
        if hasRepo {
            return leadEmail;
        }
    }
    return ();
}

# Lead emails of teams in the organization that include the repository.
#
# + organizationId - Organization id
# + orgName - GitHub organization login
# + repoName - Repository name
# + return - Distinct lead emails, or error
isolated function leadEmailsForRepository(int organizationId, string orgName, string repoName)
    returns string[]|error {
    db:RepoTeamLead[] leads = check db:getRepoTeamLeadsForAccess(organizationId, ());
    string[] emails = [];
    map<boolean> seen = {};
    foreach db:RepoTeamLead lead in leads {
        string? email = lead.leadEmail;
        if email is () || email.trim() == "" {
            continue;
        }
        boolean|error hasRepo = teamHasRepository(orgName, lead.teamSlug, repoName);
        if hasRepo is error {
            return hasRepo;
        }
        if !hasRepo {
            continue;
        }
        string key = email.toLowerAscii();
        if seen.hasKey(key) {
            continue;
        }
        seen[key] = true;
        emails.push(email);
    }
    return emails;
}

# Whether the team includes the repository.
#
# + orgName - GitHub organization login
# + teamSlug - Team slug
# + repoName - Repository name
# + return - true when the team has the repository, or error
isolated function teamHasRepository(string orgName, string teamSlug, string repoName) returns boolean|error {
    gh:TeamRepository[] repos = check gh:getTeamRepositories(orgName, teamSlug);
    foreach gh:TeamRepository repo in repos {
        if repo.name.equalsIgnoreCaseAscii(repoName) {
            return true;
        }
    }
    return false;
}
