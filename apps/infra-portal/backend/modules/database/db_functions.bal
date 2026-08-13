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

import ballerina/sql;

# Get a specific repository request by id.
#
# + id - Repository request id
# + return - RepositoryRequest or error
public isolated function getRepositoryRequest(int id) returns RepositoryRequest|error? {
    RepositoryRequest result = check databaseClient->queryRow(getRepositoryRequestQuery(id));
    return result;
}

# Get all repository requests created by a user (member or lead).
#
# + filter - Filter object for repository requests
# + return - Repository requests created by the user or error
public isolated function getRepositoryRequests(RepositoryRequestFilter filter) returns RepositoryRequest[]|error {

    stream<RepositoryRequest, error?> resultStream = databaseClient->query(getRepositoryRequestsQuery(filter.memberEmail,
        filter.leadEmail, filter.'limit, filter.offset, filter.repoName, filter.approvalState));

    return from RepositoryRequest repositoryRequest in resultStream
        select repositoryRequest;
}

# Insert a new repository request into the database.
#
# + payload - Repository request payload
# + return - Newly inserted RepositoryRequest object or error
public isolated function insertRepositoryRequest(RepositoryRequestCreate payload) returns RepositoryRequest|error {
    sql:ExecutionResult result = check databaseClient->execute(insertRepositoryRequestQuery(payload));
    int|string? lastInsertId = result.lastInsertId;
    if lastInsertId is string? {
        return error("Failed to retrieve last insert ID");
    }
    return databaseClient->queryRow(getRepositoryRequestQuery(lastInsertId));
}

# Reject a repository request.
#
# + requestId - Repository request ID
# + return - ExecutionResult or error
public isolated function rejectRepositoryRequest(int requestId) returns error? {
    _ = check databaseClient->execute(rejectRepositoryRequestQuery(requestId));
}

# Update a repository request in the database.
#
# + requestId - Repository request ID  
# + payload - Repository request payload
# + return - ExecutionResult or error
public isolated function updateRepositoryRequest(int requestId, RepositoryRequestUpdate payload) returns error? {
    _ = check databaseClient->execute(updateRepositoryRequestQuery(requestId, payload));
}

# Approve a repository request in the database.
#
# + requestId - Repository request ID
# + return - ExecutionResult or error
public isolated function approveRepositoryRequest(int requestId) returns error? {
    _ = check databaseClient->execute(approveRepositoryRequestQuery(requestId));
}

# Add a comment to a repository request.
#
# + requestId - Repository request id
# + authorEmail - Email of the comment author
# + commentText - The comment text
# + return - ExecutionResult or error
public isolated function addRepositoryRequestComment(int requestId, string authorEmail, string commentText) 
    returns error? {

    _ = check databaseClient->execute(addRepositoryRequestCommentQuery(requestId, authorEmail, commentText));
}

# Get all comments for a repository request.
#
# + requestId - Repository request id
# + return - Array of RepositoryRequestComment or error
public isolated function getRepositoryRequestComments(int requestId) returns RepositoryRequestComment[]|error {
    sql:ParameterizedQuery query = getRepositoryRequestCommentsQuery(requestId);
    stream<RepositoryRequestComment, error?> resultStream = databaseClient->query(query);
    return from RepositoryRequestComment comment in resultStream
        select comment;
}

# Get topics.
#
# + return - List of topic names or error
public isolated function getTopics() returns Topic[]|error {
    stream<Topic, error?> resultStream = databaseClient->query(getTopicsQuery());
    return from Topic topic in resultStream
        select topic;
}

# Upsert a topic by name. If the topic does not exist, it creates a new one. 
# If it exists, it updates the topic to active.
#
# + topicName - Name of the topic to upsert
# + return - Error if the operation fails, otherwise null.
public isolated function upsertTopic(string topicName) returns error? {
    Topic|error existingTopic = databaseClient->queryRow(getTopicByNameQuery(topicName));
    if existingTopic is error {
        if existingTopic is sql:NoRowsError {
            _ = check databaseClient->execute(addTopicQuery(topicName));
        } else {
            return existingTopic;
        }
    } else {
        _ = check databaseClient->execute(updateTopicQuery(existingTopic.topicId, topicName));
    }
}

# Update a topic.
# 
# + topicId - ID of the topic to be updated
# + topicName - New name for the topic
# + return - Error or null if successful
public isolated function updateTopic(int topicId, string topicName) returns error? {
    Topic|error existingTopic = databaseClient->queryRow(getTopicByIdQuery(topicId));
    if existingTopic is error {
        return existingTopic;
    }
    _ = check databaseClient->execute(updateTopicQuery(topicId, topicName));
}

# Delete a topic.
#
# + id - ID of the topic to be deleted
# + return - Error or null if successful
public isolated function deleteTopic(int id) returns error? {
    _ = check databaseClient->execute(deleteTopicQuery(id));
}

# Get team leads.
#
# + return - List of leads
public isolated function getLeads() returns TeamLead[]|error {
    stream<TeamLead, error?> resultStream = databaseClient->query(getLeadsQuery());
    return from TeamLead teamLead in resultStream
        select teamLead;
}

# Update a lead.
#
# + leadId - ID of the lead to be updated
# + leadEmail - New email for the lead
# + teamName - New team name for the lead
# + return - Error or null if successful
public isolated function updateLead(int leadId, string leadEmail, string teamName) returns error? {
    TeamLead|error existingLead = databaseClient->queryRow(getTeamLeadQuery(leadId, ()));
    if existingLead is error {
        return existingLead;
    }
    _ = check databaseClient->execute(updateTeamLeadQuery(leadId, leadEmail, teamName));
}

# Upsert a lead. If the lead does not exist, it creates a new one.
# If it exists, it updates the lead to active.
#
# + leadEmail - New leads email
# + teamName - New leads team
# + return - Execution result or error
public isolated function upsertLead(string leadEmail, string teamName) returns error? {
    TeamLead|error existingLead = databaseClient->queryRow(getTeamLeadQuery((), leadEmail));
    if existingLead is error { 
        if existingLead is sql:NoRowsError {
            _ = check databaseClient->execute(addLeadQuery(leadEmail, teamName));
        } else {
            return existingLead;
        }
    } else {
        _ = check databaseClient->execute(updateTeamLeadQuery(existingLead.leadId, leadEmail, teamName));
    }
}

# Delete a lead.
#
# + leadId - ID of the lead to be deleted
# + return - Execution result or error
public isolated function deleteLead(int leadId) returns InvalidOperationError|error? {
    int[] pendingRequestIds = check getPendingRequestsByLeadId(leadId);
    if pendingRequestIds == [] {
        _ = check databaseClient->execute(deleteLeadQuery(leadId));
        return;
    }
    string customError = 
        string `Delete Lead Failed: Requests with IDs ${
            formatToCommaSeparatedString(pendingRequestIds)} are still pending.`;
            
    return error InvalidOperationError(customError);
}

# Get organizations.
#
# + return - List of leads
public isolated function getOrganizations() returns Organization[]|error {
    stream<Organization, error?> resultStream = databaseClient->query(getOrganizationsQuery());
    return from Organization organization in resultStream
        select organization;
}

# Get a specific organization by ID.
#
# + organizationId - ID of the organization
# + return - Organization or error
public isolated function getOrganizationById(int organizationId) returns Organization|error {
    return databaseClient->queryRow(getOrganizationByIdQuery(organizationId));
}

# Upsert an organization. If the organization does not exist, it creates a new one.
# If it exists, it updates the organization to active.
# Sets the visibility to 'Public' if the organization plan is 'free'.
# 
# + name - Organization name
# + visibility - Visibility of the organization (public or private)
# + plan - Organization plan
# + enableIssues - Whether issue enable perms are granted for the organization
# + teamIds - Array of team IDs to be added as default teams
# + return - Execution result or error
public isolated function upsertOrganization(string name, string visibility, string plan, boolean enableIssues, 
    int[] teamIds) returns error? {

    Organization|error organizationResult = databaseClient->queryRow(getOrganizationByNameQuery(name));
    if organizationResult is error {
        if organizationResult is sql:NoRowsError {
            sql:ExecutionResult result = check databaseClient->execute(
                addOrganizationQuery(name, visibility, plan, enableIssues)
            );

            int|string? lastInsertId = result.lastInsertId;
            if lastInsertId is string? {
                return error("Failed to retrieve last insert ID");
            }
            _ = check batchExecuteAddOrganizationDefaultTeams(lastInsertId, teamIds);
        } else {
            return organizationResult;
        }
    } else {
        string organizationPlan = organizationResult.organizationPlan;
        string targetVisibility = organizationPlan.toLowerAscii() == ORGANIZATION_FREE_PLAN ? PUBLIC_REPO_VISIBILITY : visibility;
        _ = check databaseClient->execute(updateOrganizationQuery(organizationResult.organizationId,
            name, targetVisibility, plan, enableIssues));
        _ = check batchExecuteAddOrganizationDefaultTeams(organizationResult.organizationId, teamIds);
    }
}

# Sync an organization's plan with the provided plan.
#
# + organizationName - Name of the organization
# + plan - New plan for the organization
# + return - Execution result or error
public isolated function syncOrganizationPlan(string organizationName, string plan) returns error? {
    _ = check databaseClient->execute(syncOrganizationPlanQuery(organizationName, plan));
}

# Delete an organization.
#
# + organizationId - Id of the organization to be deleted
# + return - Execution result or error
public isolated function deleteOrganization(int organizationId) returns InvalidOperationError|error? {
    int[] pendingRequestIds = check getPendingRequestsByOrganizationId(organizationId);
    if pendingRequestIds == [] {
        _ = check databaseClient->execute(deleteOrganizationQuery(organizationId));
        _ = check databaseClient->execute(deleteOrganizationDefaultTeamQuery(organizationId));
        return;
    }
    string customError = string `Delete Organization Failed: Requests with IDs ${
        formatToCommaSeparatedString(pendingRequestIds)} are still pending.`;

    return error InvalidOperationError(customError);
}

# Get all default teams for a given organization.
#
# + organizationId - Organization id
# + return - Array of DefaultTeam or error
public isolated function getDefaultTeamsForOrganization(int organizationId) returns Team[]|error {
    sql:ParameterizedQuery query = getDefaultTeamsForOrganizationQuery(organizationId);
    stream<Team, error?> resultStream = databaseClient->query(query);
    return from Team team in resultStream
        select team;
}

# Get all default teams.
#
# + return - Array of DefaultTeam or error
public isolated function getDefaultTeams() returns DefaultTeam[]|error {
    sql:ParameterizedQuery query = getDefaultTeamsQuery();
    stream<DefaultTeam, error?> resultStream = databaseClient->query(query);
    return from DefaultTeam team in resultStream
        select team;
}

# Get a specific default team by ID.
#
# + teamId - ID of the default team
# + return - DefaultTeam or error
public isolated function getDefaultTeamById(int teamId) returns DefaultTeam|error {
    return databaseClient->queryRow(getDefaultTeamByIdQuery(teamId));
}

# Update a default team.
#
# + teamId - ID of the default team
# + teamName - New name for the default team
# + permissionLevel - New permission level for the default team
# + return - Execution result or error
public isolated function updateDefaultTeam(int teamId, string teamName, string permissionLevel) returns error? {
    DefaultTeam|error existingTeam = databaseClient->queryRow(getDefaultTeamByIdQuery(teamId));
    if existingTeam is error {
        return existingTeam;
    }
    _ = check databaseClient->execute(updateDefaultTeamQuery(teamId, teamName, permissionLevel));
}

# Upsert a default team. If the default team does not exist, it creates a new one.
# If it exists, it updates the default team to active.
#
# + teamName - Name of the default team to be added
# + permissionLevel - Permission level for the team (e.g., 'pull', 'triage', 'push')
# + return - Execution result or error
public isolated function upsertDefaultTeam(string teamName, string permissionLevel) returns error? {
    DefaultTeam|error existingTeam = databaseClient->queryRow(getDefaultTeamByNameQuery(teamName));
    if existingTeam is error {
        if existingTeam is sql:NoRowsError {
            _ = check databaseClient->execute(addDefaultTeamQuery(teamName, permissionLevel));
        } else {
            return existingTeam;
        }
    } else {
        _ = check databaseClient->execute(updateDefaultTeamQuery(existingTeam.teamId, teamName, permissionLevel));
    }
}

# Delete a default team.
#
# + teamId - Id of the default team to be deleted
# + return - Execution result or error
public isolated function deleteDefaultTeam(int teamId) returns error? {
    _ = check databaseClient->execute(deleteDefaultTeamQuery(teamId));
}

# Get all pending repository requests for a specific organization.
#
# + organizationId - ID of the organization
# + return - Array of pending repository request IDs or error
isolated function getPendingRequestsByOrganizationId(int organizationId) returns int[]|error {
    stream<record {| int id; |}, error?> resultStream = 
        databaseClient->query(getRepositoryRequestsIdsByOrganizationIdQuery(organizationId, PENDING));

    return from record {| int id; |} result in resultStream
        select result.id;
}

# Get all pending repository requests for a specific lead.
#
# + leadId - ID of the lead
# + return - Array of pending repository request IDs or error
isolated function getPendingRequestsByLeadId(int leadId) returns int[]|error {
    TeamLead leadResult = check databaseClient->queryRow(getTeamLeadQuery(leadId, ()));
    string leadEmail = leadResult.leadEmail;
    stream<record {| int id; |}, error?> resultStream = 
        databaseClient->query(getRepositoryRequestsIdsByLeadQuery(leadEmail, PENDING));

    return from record {| int id; |} result in resultStream
        select result.id;
}

# Batch execute adding default teams to an organization.
#
# + organizationId - ID of the organization
# + teamIds - Array of team IDs to be added
# + return - Array of execution results or error
isolated function batchExecuteAddOrganizationDefaultTeams(int organizationId, int[] teamIds)
    returns sql:ExecutionResult[]|error {
        
    sql:ParameterizedQuery[] batch = from int teamId in teamIds
        select addOrganizationDefaultTeamQuery(organizationId, teamId);
    return databaseClient->batchExecute(batch);
}

# Insert or update user default repository access.
#
# + employeeId - HR employee id
# + status - Status of the default access (not_granted, granting, granted)
# + return - Error if the DB write fails
public isolated function upsertUserDefaultRepositoryAccess(string employeeId, string status)
    returns error? {
    _ = check databaseClient->execute(upsertUserDefaultRepositoryAccessQuery(employeeId, status));
}

# Get user default repository access by employee id.
#
# + employeeId - HR employee id
# + return - Access row, () if missing, or error
public isolated function getUserDefaultRepositoryAccess(string employeeId)
    returns UserDefaultRepositoryAccess|error? {
    UserDefaultRepositoryAccess|error row =
        databaseClient->queryRow(getUserDefaultRepositoryAccessQuery(employeeId));
    if row is sql:NoRowsError {
        return ();
    }
    return row;
}

# Get default org/team mappings for an access type.
#
# + accessType - PERMANENT, CS, or INTERN
# + return - Rows or error
public isolated function getOrganizationDefaultRepositoriesByAccessType(string accessType)
    returns OrganizationDefaultRepository[]|error {
    stream<OrganizationDefaultRepository, error?> resultStream =
        databaseClient->query(getOrganizationDefaultRepositoriesByAccessTypeQuery(accessType));
    return from OrganizationDefaultRepository row in resultStream
        select row;
}