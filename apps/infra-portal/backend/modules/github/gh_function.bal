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

import ballerina/http;
import ballerina/io;
import ballerina/lang.array;
import ballerina/lang.value;

# Checks whether the organization can be accessed.
#
# + orgName - Name of the organization
# + return - Plan name if organization exists or an error
public isolated function verifyOrganization(string orgName) returns string|error {
    http:Client githubClient = check createGithubClient();
    GitHubOrganization orgResponse = check githubClient->/orgs/[orgName];
    if orgResponse.login == orgName {
        GitHubPlan? plan = orgResponse.plan;
        if plan is GitHubPlan {
            return plan.name; // Organization exists with a plan
        }
    }
    return error("Organization does not exist: " + orgName);
}

# Checks whether the read-only team exists in the organization.
#
# + orgName - Name of the organization
# + return - true if the read-only team exists, false otherwise or an error
public isolated function verifyReadOnlyTeam(string orgName) returns boolean|error {
    http:Client githubClient = check createGithubClient();
    GitHubTeam[] teamResponse = check githubClient->/orgs/[orgName]/teams/[WSO2_ALL_TEAM_SLUG]/teams;
    return teamResponse.some(team => team.slug == READONLY_TEAM_SLUG);
}

# Get the list of internal commiter teams in a GitHub organization.
#
# + orgName - Organization name
# + return - List of teams or error
public isolated function getInternalCommitterTeams(string orgName) returns string[]|error {
    http:Client githubClient = check createGithubClient();
    GitHubTeam[] allTeams = [];
    int page = 1;

    while true {
        GitHubTeam[] pageTeams = check githubClient->/orgs/[orgName]/teams/[INTERNAL_COMMITTER_TEAM_SLUG]/teams(
            perPage = DEFAULT_LIMIT, page = page
        );
        allTeams.push(...pageTeams);
        if pageTeams.length() < DEFAULT_LIMIT {
            break;
        }
        page += 1;
    }

    return from var team in allTeams
        where team.slug.includes(INTERNAL_COMMITTER_FORMAT)
        select team.slug;
}

# Get the list of external committer teams in a GitHub organization.
#
# + orgName - Organization name

# + return - List of teams or error
public isolated function getExternalCommitterTeams(string orgName) returns string[]|error {
    http:Client githubClient = check createGithubClient();
    GitHubTeam[]|error teamsResponse = githubClient->/orgs/[orgName]/teams/[EXTERNAL_COMMITTER_TEAM_SLUG]/teams;
    if teamsResponse is error {
        if teamsResponse is http:ApplicationResponseError {
            if teamsResponse.detail().statusCode == 404 {
                // No external committer team found
                return [];
            }
            return teamsResponse;
        }
        return teamsResponse;
    }
    return from var team in teamsResponse
        where team.slug.includes(EXTERNAL_COMMITTER_FORMAT)
        select team.slug;
}

# Create a repository in GitHub and add requested parameters.
#
# + input - Create repository input
# + return - http response
public isolated function createRepository(CreateRepoInput input) returns GitHubOperationResult {

    http:Client|error githubClient = createGithubClient();
    if githubClient is error {
        return {
            operation: CREATE_GITHUB_CLIENT,
            status: FAILURE,
            errorMessage: githubClient.message()
        };
    }
    CreateRepoInput {orgName, repoName, autoInit, isPrivate, repoDescription, repoHomepage,
    enableIssues, enableWiki, licenseTemplate, gitignoreTemplate} = input;
    RepositoryInput repositoryInput = {
        orgName,
        repoName,
        autoInit,
        isPrivate,
        repoDescription,
        repoHomepage: repoHomepage is string ? repoHomepage : "",
        enableIssues,
        enableWiki,
        licenseTemplate,
        gitignoreTemplate
    };
    ReleaseResponse|error response = githubClient->/orgs/[orgName]/repos.post(repositoryInput);
    if response is error {
        return {
            operation: CREATE_REPO,
            status: FAILURE,
            errorMessage: response.message()
        };
    }
    return {
        operation: CREATE_REPO,
        status: SUCCESS,
        errorMessage: "None"
    };
}

# API Call to add topics to a repository.
#
# + topicsInput - Input object containing organization name, repository name, and list of topics
# + return - Status of the operation
public isolated function addTopics(AddGitTopicsInput topicsInput) returns GitHubOperationResult {

    http:Client|error githubClient = createGithubClient();
    if githubClient is error {
        return {
            operation: CREATE_GITHUB_CLIENT,
            status: FAILURE,
            errorMessage: githubClient.message()
        };
    }
    AddGitTopicsResponse|error response =
        githubClient->/orgs/[topicsInput.orgName]/repos/[topicsInput.orgName]/[topicsInput.repoName]/topics.post(
        topicsInput
    );

    if response is error {
        return {
            operation: ADD_TOPICS,
            status: FAILURE,
            errorMessage: response.message()
        };
    }
    return {
        operation: ADD_TOPICS,
        status: SUCCESS,
        errorMessage: "None"
    };
}

# API Call to add labels to a repository.
#
# + orgName - Organization name
# + repoName - Repository name

# + return - Status of the operation
public isolated function addLabels(string orgName, string repoName)
    returns GitHubOperationResult {

    http:Client|error githubClient = createGithubClient();
    if githubClient is error {
        return {
            operation: CREATE_GITHUB_CLIENT,
            status: FAILURE,
            errorMessage: githubClient.message()
        };
    }
    string filePath = resourcePath + "labels.json";
    json|error labelsJson = io:fileReadJson(filePath);
    if labelsJson is error {
        return {
            operation: ADD_LABELS,
            status: FAILURE,
            errorMessage: labelsJson.message()
        };
    }
    LabelData[]|error labelList = value:fromJsonWithType(labelsJson);
    if labelList is error {
        return {
            operation: ADD_LABELS,
            status: FAILURE,
            errorMessage: labelList.message()
        };
    }
    int labelCount = labelList.length();
    AddLabelsInput labelsInput = {
        orgName,
        repoName,
        labels: labelList
    };
    GitLabelResult|error response = githubClient->/orgs/[orgName]/repos/[orgName]/[repoName]/labels.post(labelsInput);
    if response is error {
        return {
            operation: ADD_LABELS,
            status: FAILURE,
            errorMessage: response.message()
        };
    }
    string[] successLabels = response.successLabels;
    string[] failedLabels = response.failedLabels;
    if failedLabels.length() == 0 {
        return {
            operation: ADD_LABELS,
            status: SUCCESS,
            errorMessage: "None"
        };
    } else if successLabels.length() < labelCount && failedLabels.length() < labelCount {
        return {
            operation: ADD_LABELS,
            status: PARTIAL_FAILURE,
            errorMessage: string `Failed to add the following labels: ${failedLabels.toString()}`
        };
    } else {
        return {
            operation: ADD_LABELS,
            status: FAILURE,
            errorMessage: string `Failed to add all labels: ${failedLabels.toString()}`
        };
    }
}

# API Call to add issue template to a repository.
#
# + orgName - Organization name
# + repoName - Repository name
# + return - Status of the operation
public isolated function addIssueTemplate(string orgName, string repoName)
    returns GitHubOperationResult {

    http:Client|error githubClient = createGithubClient();
    if githubClient is error {
        return {
            operation: CREATE_GITHUB_CLIENT,
            status: FAILURE,
            errorMessage: githubClient.message()
        };
    }
    string filePath = resourcePath + "issue_template.md";
    string|error issueTemplate = io:fileReadString(filePath);
    if issueTemplate is error {
        return {
            operation: ADD_ISSUE_TEMPLATE,
            status: FAILURE,
            errorMessage: issueTemplate.message()
        };
    }
    string encodedIssueTemplate = array:toBase64(issueTemplate.toBytes());
    string owner = orgName;
    CommitFileInput input = {
        owner,
        repoName,
        path: "issue_template.md",
        message: "Add Issue Template",
        branch: "main",
        encodedContent: encodedIssueTemplate
    };
    CommitResponse|error result = githubClient->/orgs/[orgName]/repos/[orgName]/[repoName]/contents.put(input);
    if result is error {
        return {
            operation: ADD_ISSUE_TEMPLATE,
            status: FAILURE,
            errorMessage: result.message()
        };
    }
    return {
        operation: ADD_ISSUE_TEMPLATE,
        status: SUCCESS,
        errorMessage: ""
    };
}

# API Call to add pull request template to a repository.
#
# + orgName - Organization name
# + repoName - Repository name
# + return - Status of the operation
public isolated function addPRTemplate(string orgName, string repoName)
    returns GitHubOperationResult {

    http:Client|error githubClient = createGithubClient();
    if githubClient is error {
        return {
            operation: CREATE_GITHUB_CLIENT,
            status: FAILURE,
            errorMessage: githubClient.message()
        };
    }
    string filePath = resourcePath + "pull_request_template.md";
    string|error prTemplate = io:fileReadString(filePath);
    if prTemplate is error {
        return {
            operation: ADD_PULL_REQUEST_TEMPLATE,
            status: FAILURE,
            errorMessage: prTemplate.message()
        };
    }
    string encodedPrTemplate = array:toBase64(prTemplate.toBytes());
    string owner = orgName;
    CommitFileInput input = {
        owner,
        repoName,
        path: "pull_request_template.md",
        message: "Add Pull Request Template",
        branch: "main",
        encodedContent: encodedPrTemplate
    };
    CommitResponse|error response = githubClient->/orgs/[orgName]/repos/[orgName]/[repoName]/contents.put(input);
    if response is error {
        return {
            operation: ADD_PULL_REQUEST_TEMPLATE,
            status: FAILURE,
            errorMessage: response.message()
        };
    }
    return {
        operation: ADD_PULL_REQUEST_TEMPLATE,
        status: SUCCESS,
        errorMessage: ""
    };
}

# API Call to add branch protection to a repository.
#
# + branchProtectionInput - Input object containing organization name, repository name, and branch protection type
# + return - Status of the operation
public isolated function addBranchProtection(AddBranchProtectionInput branchProtectionInput)
    returns GitHubOperationResult {

    http:Client|error githubClient = createGithubClient();
    if githubClient is error {
        return {
            operation: CREATE_GITHUB_CLIENT,
            status: FAILURE,
            errorMessage: githubClient.message()
        };
    }
    AddBranchProtectionInput {orgName, repoName, branchProtectionType} = branchProtectionInput;
    string branchProtectionTypeEnum = branchProtectionMap[branchProtectionType] ?: "DEFAULT";
    BranchProtectionResponse|error response =
        githubClient->/orgs/[orgName]/repos/[orgName]/[repoName]/branches/main/protection.put({
        orgName,
        repoName,
        branchProtectionType: branchProtectionTypeEnum
    });

    if response is error {
        return {
            operation: ADD_BRANCH_PROTECTION,
            status: FAILURE,
            errorMessage: response.message()
        };
    }
    return {
        operation: ADD_BRANCH_PROTECTION,
        status: SUCCESS,
        errorMessage: ""
    };
}

# API Call to add teams to a repository.
#
# + teamsInput - Input object containing organization name, repository name, and list of teams
# + return - Status of the operation
public isolated function addTeams(AddTeamInput teamsInput)
    returns GitHubOperationResult {

    http:Client|error githubClient = createGithubClient();
    if githubClient is error {
        return {
            operation: CREATE_GITHUB_CLIENT,
            status: FAILURE,
            errorMessage: githubClient.message()
        };
    }
    AddTeamInput {orgName, repoName, teams} = teamsInput;
    int teamCount = teams.length();
    AddTeamsResult|error response = githubClient->/orgs/[orgName]/teams/repos/[orgName]/[repoName].put(teamsInput);
    if response is error {
        return {
            operation: ADD_TEAMS,
            status: FAILURE,
            errorMessage: response.message()
        };
    }
    string[] teamResultsRaw = response.failedTeams;
    if teamResultsRaw.length() == 0 {
        return {
            operation: ADD_TEAMS,
            status: SUCCESS,
            errorMessage: "None"
        };
    }
    if teamResultsRaw.length() == teamCount {
        return {
            operation: ADD_TEAMS,
            status: FAILURE,
            errorMessage: "Failed to add all teams: " + teamResultsRaw.toString()
        };
    }
    return {
        operation: ADD_TEAMS,
        status: PARTIAL_FAILURE,
        errorMessage: string `Failed to add the following teams: ${teamResultsRaw.toString()}`
    };
}

# API Call to get fine-grained access tokens of the organization.
#
# + return - List of fine-grained access tokens or error
public isolated function getFinegrainedAccessTokens() returns FineGrainedAccessTokenResponse|error {
    http:Client|error githubClient = createGithubClient();
    if githubClient is error {
        return githubClient;
    }
    return githubClient->/orgs/personal\-access\-tokens.get();
}

# API Call to get the teams of the organization.
#
# + orgName - Organization name
# + perPage - Number of teams to return per page
# + page - Page number of the results
# + return - List of teams or error
public isolated function getTeamsForOrganization(string orgName, int page, int perPage) returns GitHubTeam[]|error {
    http:Client|error githubClient = createGithubClient();
    if githubClient is error {
        return githubClient;
    }
    return githubClient->/orgs/[orgName]/teams.get(perPage = perPage, page = page);
}

# API Call to add or update team membership for multiple users.
#
# + inputs - List of input objects containing organization name, team slug, user name, and role
# + return - List of successful and failed operations
public isolated function addOrUpdateTeamMemberships(AddOrUpdateTeamMemberInformationInput[] inputs)
    returns AddOrUpdateTeamMemberResponse|error {

    http:Client|error githubClient = createGithubClient();
    if githubClient is error {
        return githubClient;
    }

    FailedMembershipResponse[] failedResponses = [];
    SuccessfulMembershipResponse[] successfulResponses = [];

    foreach AddOrUpdateTeamMemberInformationInput input in inputs {
        MembershipResponse|error response = githubClient->/orgs/[input.orgName]/teams/[input.teamSlug]/memberships/[input.userName].put({role: input.role});
        if response is error {
            failedResponses.push({
                ...input,
                errorMessage: response.message()
            });
        } else {
            successfulResponses.push({
                ...input,
                membershipResponse: response
            });
        }
    }
    return {
        successfulMemberships: successfulResponses,
        failedMemberships: failedResponses
    };
}

# API Call to get GitHub user details by account ID.
#
# + githubUserId - GitHub account ID
# + return - GitHub user details or error
public isolated function getUserDetails(string githubUserId) returns GitHubUser|error {
    http:Client|error githubClient = createGithubClient();
    if githubClient is error {
        return githubClient;
    }
    return githubClient->/github/user.get(accountId = githubUserId);
}

# List repositories for a team (paginated, capped).
#
# + orgName - Organization login
# + teamSlug - Team slug
# + maxRepos - Soft cap to avoid huge payloads (e.g. 200)
# + return - Repositories or error
public isolated function getTeamRepositories(string orgName, string teamSlug, int maxRepos = 200)
    returns TeamRepository[]|error {
    http:Client githubClient = check createGithubClient();
    TeamRepository[] allRepos = [];
    int page = 1;
    int perPage = 100;

    while allRepos.length() < maxRepos {
        TeamRepository[]|error pageRepos =
            githubClient->/orgs/[orgName]/teams/[teamSlug]/repos.get(perPage = perPage, page = page);
        if pageRepos is error {
            return pageRepos;
        }
        if pageRepos.length() == 0 {
            break;
        }
        foreach TeamRepository repo in pageRepos {
            allRepos.push(repo);
            if allRepos.length() >= maxRepos {
                break;
            }
        }
        if pageRepos.length() < perPage {
            break;
        }
        page += 1;
    }
    return allRepos;
}