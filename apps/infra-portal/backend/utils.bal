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

import infra_portal.authorization;
import infra_portal.database as db;
import infra_portal.github as gh;
import infra_portal.scim;

import ballerina/log;

# Create a new GitHub repository and add requested parameters.
#
# + repoRequest - Repository request object
# + return - Array of GitHub operation results list
public isolated function createGitHubRepository(db:RepositoryRequest repoRequest) returns gh:GitHubOperationResult[] {

    gh:Team[]|error formattedTeams = formatTeams(
            repoRequest.organizationId,
            repoRequest.organizationName,
            repoRequest.organizationVisibility,
            repoRequest.enableTriageWso2All,
            repoRequest.enableTriageWso2AllInterns,
            re `,`.split(repoRequest.teams)
    );

    if formattedTeams is error {
        return [
            {
                operation: gh:FORMAT_TEAMS,
                status: gh:FAILURE,
                errorMessage: formattedTeams.message()
            }
        ];
    }
    gh:GitHubOperationResult[] gitopresults = [];
    string orgName = repoRequest.organizationName;
    string repoName = repoRequest.repoName;
    gh:CreateRepoInput createRepoInput = {
        orgName: repoRequest.organizationName,
        repoName: repoRequest.repoName,
        autoInit: true,
        isPrivate: repoRequest.repoType == "Public" ? false : true,
        repoDescription: repoRequest.description,
        repoHomepage: repoRequest.websiteUrl,
        enableIssues: repoRequest.enableIssues == "Yes" ? true : false
    };

    gh:AddGitTopicsInput addTopicsInput = {
        orgName: repoRequest.organizationName,
        repoName: repoRequest.repoName,
        topics: re `,`.split(repoRequest.topics)
    };

    gh:AddTeamInput addTeamInput = {
        orgName: repoRequest.organizationName,
        repoName: repoRequest.repoName,
        teams: formattedTeams
    };

    gh:AddBranchProtectionInput addBranchProtectionInput = {
        orgName: repoRequest.organizationName,
        repoName: repoRequest.repoName,
        branchProtectionType: repoRequest.prProtection
    };

    gh:GitHubOperationResult createRepoResult = gh:createRepository(createRepoInput);
    gitopresults.push(createRepoResult);
    if createRepoResult.status is gh:FAILURE {
        return gitopresults;
    }
    gh:GitHubOperationResult addTopicsResult = gh:addTopics(addTopicsInput);
    gitopresults.push(addTopicsResult);
    gh:GitHubOperationResult labelError = gh:addLabels(orgName, repoName);
    gitopresults.push(labelError);
    gh:GitHubOperationResult issueTemplateError = gh:addIssueTemplate(orgName, repoName);
    gitopresults.push(issueTemplateError);
    gh:GitHubOperationResult issuePrTemplateError = gh:addPRTemplate(orgName, repoName);
    gitopresults.push(issuePrTemplateError);
    gh:GitHubOperationResult branchProtectionError = gh:addBranchProtection(addBranchProtectionInput);
    gitopresults.push(branchProtectionError);
    gh:GitHubOperationResult teamError = gh:addTeams(addTeamInput);
    gitopresults.push(teamError);

    return gitopresults;
}

# returns a map of key-value pairs from the repository request object.
#
# + repoRequest - repository request object
# + return - key-value pairs
public isolated function createKeyValuePair(db:RepositoryRequest repoRequest) returns map<string> {
    map<string> keyValPairs = {
        "id": repoRequest.id.toString(),
        "email": repoRequest.email,
        "lead_email": repoRequest.leadEmail,
        "ccList": repoRequest.ccList,
        "requirement": repoRequest.requirement,
        "repoName": repoRequest.repoName,
        "organization": repoRequest.organizationName,
        "repoType": repoRequest.repoType,
        "description": repoRequest.description,
        "enableIssues": repoRequest.enableIssues.toString(),
        "websiteUrl": repoRequest.websiteUrl is string ? repoRequest.websiteUrl.toString() : "N/A",
        "topics": repoRequest.topics,
        "prProtection": repoRequest.prProtection,
        "teams": repoRequest.teams,
        "enableTriageWso2All": repoRequest.enableTriageWso2All,
        "enableTriageWso2AllInterns": repoRequest.enableTriageWso2AllInterns,
        "disableTriageReason": repoRequest.disableTriageReason,
        "cicdRequirement": repoRequest.cicdRequirement,
        "jenkinsJobType": repoRequest.jenkinsJobType is string ? repoRequest.jenkinsJobType.toString() : "N/A",
        "jenkinsGroupId": repoRequest.jenkinsGroupId is string ? repoRequest.jenkinsGroupId.toString() : "N/A",
        "azureDevopsOrg": repoRequest.azureDevopsOrg is string ? repoRequest.azureDevopsOrg.toString() : "N/A",
        "azureDevopsProject": repoRequest.azureDevopsProject is string ?
            repoRequest.azureDevopsProject.toString() : "N/A",
        "timestamp": repoRequest.timestamp.toString()
    };
    return keyValPairs;
}

# Returns a key value pair object containing the status of GitHub operations.
#
# + gitHubOperationResult - Github operation result array
# + return - Key value pair object with operation status
public isolated function getGhStatusReport(gh:GitHubOperationResult[] gitHubOperationResult) returns map<string> {
    map<string> reportMap = {};
    foreach gh:GitHubOperationResult result in gitHubOperationResult {
        reportMap[result.operation] = result.status;
    }
    return reportMap;
}

# Resolves the GitHub account link status for a user.
#
# + userInfo - Authenticated user's JWT payload
# + return - Tuple of GitHub user ID and username; both nil if not linked or the username lookup failed
public isolated function resolveGithubLinkStatus(authorization:CustomJwtPayload userInfo) returns [string?, string?] {
    string? githubUserId = userInfo.githubUserId;
    if githubUserId is () {
        // Falls back to SCIM since the JWT claim may be stale until the next token refresh.
        scim:User[]|error scimUsers = scim:searchUser(userInfo.email);
        if scimUsers is error {
            log:printError("Error while checking GitHub link status via SCIM", scimUsers, email = userInfo.email);
        } else if scimUsers.length() > 0 {
            githubUserId = scimUsers[0].urn\:scim\:schemas\:extension\:custom\:User?.githubUserId;
        }
    }

    if githubUserId is () {
        return [(), ()];
    }

    gh:GitHubUser|error githubUser = gh:getUserDetails(githubUserId);
    if githubUser is error {
        log:printError("Error while fetching GitHub username for user-info", githubUser, email = userInfo.email);
        return [githubUserId, ()];
    }
    return [githubUserId, githubUser.login];
}

# Function to add Default teams to team list.
#
# + orgId - ID of the organization
# + organizationName - Name of the organization
# + orgVisibility - Visibility of the organization (e.g., "Private", "Public")
# + enableTriageWso2All - Whether to enable triage for WSO2 All team
# + enableTriageWso2AllInterns - Whether to enable triage for WSO2 All Interns team
# + teams - List of teams
# + return - Updated list of teams
public isolated function formatTeams(int orgId, string organizationName, string orgVisibility,
        string enableTriageWso2All, string enableTriageWso2AllInterns, string[] teams) returns gh:Team[]|error {

    gh:Team[] formattedteams = [];
    db:Team[] defaultTeamsDbResult = check db:getDefaultTeamsForOrganization(orgId);
    gh:Team[] defaultTeamsResult = from var team in defaultTeamsDbResult
        select {
            slug: team.teamName,
            permission: team.permission
        };

    foreach gh:Team team in defaultTeamsResult {
        if orgVisibility == "Private" && (
            (team.slug == WSO2_ALL_TEAM_SLUG && enableTriageWso2All == "No") ||
            (team.slug == WSO2_ALL_INTERNS_TEAM_SLUG && enableTriageWso2AllInterns == "No")) {
            continue;
        }
        formattedteams.push(team);
    }

    boolean readOnlyTeamExists = check gh:verifyReadOnlyTeam(organizationName);
    string[] externalCommitterTeams = check gh:getExternalCommitterTeams(organizationName);

    gh:Team[] otherTeams = [];
    foreach string team in teams {
        otherTeams.push({
            slug: team,
            permission: "push"
        });
        if team.includes(INTERNAL_COMMITTER_FORMAT) {
            if orgVisibility == "Private" && readOnlyTeamExists {
                otherTeams.push({
                    slug: re `${INTERNAL_COMMITTER_FORMAT}`.replaceAll(team, READONLY_FORMAT),
                    permission: "pull"
                });
            } else if externalCommitterTeams != [] {
                otherTeams.push({
                    slug: re `${INTERNAL_COMMITTER_FORMAT}`.replaceAll(team, EXTERNAL_COMMITTER_FORMAT),
                    permission: "push"
                });
            }
        }
    }
    formattedteams.push(...otherTeams);
    return formattedteams;
}
