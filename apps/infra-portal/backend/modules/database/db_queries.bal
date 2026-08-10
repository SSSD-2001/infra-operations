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

# Query to get a specific repository request by id.
#
# + id - Repository request id
# + return - RepositoryRequest object
isolated function getRepositoryRequestQuery(int id) returns sql:ParameterizedQuery => `
    SELECT 
        rr.id, 
        rr.email, 
        rr.lead_email AS leadEmail, 
        rr.requirement, 
        rr.cc_list AS ccList, 
        rr.repo_name AS repoName, 
        rr.organization_id AS organizationId,
        go.organization_name AS organizationName,
        go.visibility AS organizationVisibility,
        rr.repo_type AS repoType, 
        rr.description, 
        rr.enable_issues AS enableIssues, 
        rr.website_url AS websiteUrl, 
        rr.topics, 
        rr.pr_protection AS prProtection, 
        rr.teams, 
        rr.enable_triage_wso2_all AS enableTriageWso2All, 
        rr.enable_triage_wso2_all_interns AS enableTriageWso2AllInterns, 
        rr.disable_triage_reason AS disableTriageReason, 
        rr.ci_cd_requirement AS cicdRequirement, 
        rr.jenkins_job_type AS jenkinsJobType, 
        rr.jenkins_group_id AS jenkinsGroupId, 
        rr.azure_devops_org AS azureDevopsOrg, 
        rr.azure_devops_project AS azureDevopsProject, 
        rr.timestamp, 
        rr.state, 
        rr.updated_at AS updatedAt
    FROM 
        repository_requests rr
    JOIN 
        github_organizations go ON rr.organization_id = go.organization_id
    WHERE 
        rr.id = ${id};
    `;

# Query to get all repository requests created by a user (member or lead).
#
# + memberEmail - Member email
# + leadEmail - Lead email
# + limit - Limit for the number of records to be returned
# + offset - Offset for the number of records to be returned
# + repoName - Repository name
# + approvalState - Approval state of the repository request
# + return - Repository requests created by the user or sql:Error
isolated function getRepositoryRequestsQuery(string? memberEmail, string? leadEmail, int? 'limit, int? offset,
        string? repoName, RepositoryRequestState? approvalState) returns sql:ParameterizedQuery {

    sql:ParameterizedQuery mainQuery = `
        SELECT 
            rr.id, 
            rr.email, 
            rr.lead_email AS leadEmail, 
            rr.requirement, 
            rr.cc_list AS ccList, 
            rr.repo_name AS repoName, 
            rr.organization_id AS organizationId,
            COALESCE(go.organization_name, 'Deleted_Org') AS organizationName,
            COALESCE(go.visibility, 'Unknown') AS organizationVisibility,
            rr.repo_type AS repoType, 
            rr.description, 
            rr.enable_issues AS enableIssues, 
            rr.website_url AS websiteUrl, 
            rr.topics, 
            rr.pr_protection AS prProtection, 
            rr.teams, 
            rr.enable_triage_wso2_all AS enableTriageWso2All, 
            rr.enable_triage_wso2_all_interns AS enableTriageWso2AllInterns, 
            rr.disable_triage_reason AS disableTriageReason, 
            rr.ci_cd_requirement AS cicdRequirement, 
            rr.jenkins_job_type AS jenkinsJobType, 
            rr.jenkins_group_id AS jenkinsGroupId, 
            rr.azure_devops_org AS azureDevopsOrg, 
            rr.azure_devops_project AS azureDevopsProject, 
            rr.timestamp, 
            rr.state, 
            CAST(COUNT(*) OVER() AS SIGNED) AS totalCount,
            CAST(SUM(CASE WHEN rr.state = ${APPROVED} THEN 1 ELSE 0 END) OVER() AS SIGNED) AS approvedCount,
            CAST(SUM(CASE WHEN rr.state = ${REJECTED} THEN 1 ELSE 0 END) OVER() AS SIGNED) AS rejectedCount,
            CAST(SUM(CASE WHEN rr.state = ${PENDING} THEN 1 ELSE 0 END) OVER() AS SIGNED) AS pendingCount,
            rr.updated_at AS updatedAt
        FROM 
            repository_requests rr
        LEFT JOIN 
            github_organizations go ON rr.organization_id = go.organization_id
        WHERE 
            (rr.email = ${memberEmail} OR ${memberEmail} IS NULL) AND 
            (rr.lead_email = ${leadEmail} OR ${leadEmail} IS NULL)
    `;

    if repoName is string {
        mainQuery = sql:queryConcat(mainQuery, ` AND repo_name LIKE ${"%" + repoName + "%"}`);
    }

    if approvalState is RepositoryRequestState {
        mainQuery = sql:queryConcat(mainQuery, ` AND state = ${approvalState}`);
    }

    mainQuery = sql:queryConcat(mainQuery, ` ORDER BY timestamp DESC`);

    // Add LIMIT and OFFSET as parameterized values
    if 'limit is int {
        mainQuery = sql:queryConcat(mainQuery, ` LIMIT ${'limit}`);
        if offset is int {
            mainQuery = sql:queryConcat(mainQuery, ` OFFSET ${offset}`);
        }
    } else {
        mainQuery = sql:queryConcat(mainQuery, ` LIMIT 100`);
    }

    return mainQuery;
}

# Query to get repository requests by organization id.
#
# + organizationId - Organization id
# + state - Repository request state
# + return - Query to get repository requests by organization id
isolated function getRepositoryRequestsIdsByOrganizationIdQuery(int organizationId, string? state) returns
    sql:ParameterizedQuery => `
    
    SELECT 
        rr.id
    FROM 
        repository_requests rr
    WHERE 
        rr.organization_id = ${organizationId} AND rr.state = ${state};
`;

# Query to get repository requests by lead email.
#
# + leadEmail - Lead email
# + state - Repository request state
# + return - Query to get repository requests by lead email
isolated function getRepositoryRequestsIdsByLeadQuery(string leadEmail, string? state)
    returns sql:ParameterizedQuery => `

    SELECT 
        rr.id
    FROM 
        repository_requests rr
    WHERE 
        rr.lead_email = ${leadEmail} AND rr.state = ${state};
`;

# Query to insert a new repository request.
#
# + payload - RepositoryRequestCreate object
# + return - Query to insert a new repository request
isolated function insertRepositoryRequestQuery(RepositoryRequestCreate payload) returns sql:ParameterizedQuery => `
    INSERT INTO repository_requests (
        email, 
        lead_email, 
        requirement, 
        cc_list,
        repo_name, 
        organization_id, 
        repo_type, 
        description, 
        enable_issues, 
        website_url, 
        topics, 
        pr_protection, 
        teams, 
        enable_triage_wso2_all, 
        enable_triage_wso2_all_interns, 
        disable_triage_reason,
        ci_cd_requirement, 
        jenkins_job_type, 
        jenkins_group_id, 
        azure_devops_org, 
        azure_devops_project,
        state
    )
    VALUES (
        ${payload.email}, 
        ${payload.leadEmail}, 
        ${payload.requirement}, 
        ${payload.ccList},
        ${payload.repoName}, 
        ${payload.organizationId}, 
        ${payload.repoType}, 
        ${payload.description}, 
        ${payload.enableIssues}, 
        ${payload.websiteUrl}, 
        ${payload.topics},
        ${payload.prProtection}, 
        ${payload.teams}, 
        ${payload.enableTriageWso2All}, 
        ${payload.enableTriageWso2AllInterns}, 
        ${payload.disableTriageReason},
        ${payload.cicdRequirement}, 
        ${payload.jenkinsJobType}, 
        ${payload.jenkinsGroupId}, 
        ${payload.azureDevopsOrg}, 
        ${payload.azureDevopsProject},
        ${PENDING}
    );
`;

# Query to delete a repository request by id.
#
# + requestId - Repository request id
# + return - sql:ParameterizedQuery
isolated function rejectRepositoryRequestQuery(int requestId) returns sql:ParameterizedQuery => `
    UPDATE 
        repository_requests
    SET
        state = ${REJECTED}
    WHERE 
        id = ${requestId};
    `;

# Query to update a repository request by id.
#
# + requestId - Repository request id
# + payload - RepositoryRequestUpdate object
# + return - sql:ParameterizedQuery
isolated function updateRepositoryRequestQuery(int requestId, RepositoryRequestUpdate payload)
    returns sql:ParameterizedQuery => `

    UPDATE 
        repository_requests
    SET
        lead_email = COALESCE(${payload.lead_email}, lead_email),
        requirement = COALESCE(${payload.requirement}, requirement),
        cc_list = COALESCE(${payload.ccList}, cc_list),
        repo_name = COALESCE(${payload.repoName}, repo_name),
        organization_id = COALESCE(${payload.organizationId}, organization_id),
        repo_type = COALESCE(${payload.repoType}, repo_type),
        description = COALESCE(${payload.description}, description),
        enable_issues = COALESCE(${payload.enableIssues}, enable_issues),
        website_url = COALESCE(${payload.websiteUrl}, website_url),
        topics = COALESCE(${payload.topics}, topics),
        pr_protection = COALESCE(${payload.prProtection}, pr_protection),
        teams = COALESCE(${payload.teams}, teams),
        enable_triage_wso2_all = COALESCE(${payload.enableTriageWso2All}, enable_triage_wso2_all),
        enable_triage_wso2_all_interns = COALESCE(${payload.enableTriageWso2AllInterns}, 
        enable_triage_wso2_all_interns),
        disable_triage_reason = COALESCE(${payload.disableTriageReason}, disable_triage_reason),
        ci_cd_requirement = COALESCE(${payload.cicdRequirement}, ci_cd_requirement),
        jenkins_job_type = COALESCE(${payload.jenkinsJobType}, jenkins_job_type),
        jenkins_group_id = COALESCE(${payload.jenkinsGroupId}, jenkins_group_id),
        azure_devops_org = COALESCE(${payload.azureDevopsOrg}, azure_devops_org),
        azure_devops_project = COALESCE(${payload.azureDevopsProject}, azure_devops_project)
    WHERE 
        id = ${requestId};
    `;

# Query to approve a repository request.
#
# + requestId - Repository request id
# + return - sql:ParameterizedQuery
isolated function approveRepositoryRequestQuery(int requestId) returns sql:ParameterizedQuery => `
    UPDATE 
        repository_requests
    SET
        state = ${APPROVED} 
    WHERE 
        id = ${requestId};
    `;

# Query to get all comments for a repository request.
#
# + requestId - Repository request id
# + return - Query to get all comments for a repository request
isolated function getRepositoryRequestCommentsQuery(int requestId) returns sql:ParameterizedQuery => `
    SELECT 
        comment_id,
        request_id,
        author_email,
        comment_text,
        created_at
    FROM 
        repository_request_comments
    WHERE 
        request_id = ${requestId}
    ORDER BY 
        created_at ASC
    `;

# Query to add a new comment to a repository request.
#
# + requestId - Repository request id
# + authorEmail - Email of the comment author
# + commentText - The comment text
# + return - Query to add a new comment to a repository request
isolated function addRepositoryRequestCommentQuery(int requestId, string authorEmail, string commentText)
    returns sql:ParameterizedQuery => `

    INSERT INTO repository_request_comments (
        request_id,
        author_email,
        comment_text
    )
    VALUES (
        ${requestId},
        ${authorEmail},
        ${commentText}
    )
    `;

# Query to get all topics.
#
# + return - List of topics
isolated function getTopicsQuery() returns sql:ParameterizedQuery => `
    SELECT 
        topic_id,
        topic_name
    FROM 
        github_topics
    WHERE
        active = true;
    `;

# Query to get a topic by name.
#
# + topicName - Topic name
# + return - Query to get a topic by name
isolated function getTopicByNameQuery(string topicName) returns sql:ParameterizedQuery => `
    SELECT 
        topic_id,
        topic_name
    FROM 
        github_topics
    WHERE
        topic_name = ${topicName}
    `;

# Query to get a topic by id.
#
# + topicId - Topic id
# + return - Query to get a topic by id
isolated function getTopicByIdQuery(int topicId) returns sql:ParameterizedQuery => `
    SELECT 
        topic_id,
        topic_name
    FROM 
        github_topics
    WHERE
        topic_id = ${topicId}
    `;

# Query to add a new topic.
#
# + topic - New topic
# + return - Query to add a new topic
isolated function addTopicQuery(string topic) returns sql:ParameterizedQuery => `
    INSERT INTO github_topics (
        topic_name
    ) 
    VALUES (
        ${topic}
    )
    `;

# Query to update a topic.
#
# + topicId - Topic id
# + topicName - Topic name
# + return - Query to update a topic
isolated function updateTopicQuery(int topicId, string topicName) returns sql:ParameterizedQuery => `
    UPDATE 
        github_topics
    SET 
        topic_name = ${topicName},
        active = true
    WHERE 
        topic_id = ${topicId};
    `;

# Query to delete a topic by id.
#
# + topicId - Topic id
# + return - Query to delete a topic by id
isolated function deleteTopicQuery(int topicId) returns sql:ParameterizedQuery => `
    UPDATE 
        github_topics
    SET 
        active = false
    WHERE 
        topic_id = ${topicId};
    `;

# Query to get all leads.
#
# + return - List of leads
# + return - Query to get all leads
isolated function getLeadsQuery() returns sql:ParameterizedQuery => `
    SELECT 
        id,
        lead_email,
        team
    FROM 
        team_leads
    WHERE
        active = true;
    `;

# Query to get a lead by email.
#
# + Id - Lead id
# + leadEmail - Lead email
# + return - Query to get a lead by email
isolated function getTeamLeadQuery(int? Id, string? leadEmail) returns sql:ParameterizedQuery => `
    SELECT 
        id,
        lead_email,
        team
    FROM 
        team_leads
    WHERE
        id = ${Id} OR lead_email = ${leadEmail}
    `;

# Query to add a new lead.
#
# + leadEmail - New lead email
# + teamName - New lead team
# + return - Query to add a new lead
isolated function addLeadQuery(string leadEmail, string teamName) returns sql:ParameterizedQuery => `
    INSERT INTO team_leads (
       lead_email,
       team
    ) 
    VALUES (
        ${leadEmail},
        ${teamName}
    )
    `;

# Query to delete a lead by id.
#
# + leadId - Lead id
# + return - Query to delete a lead by id
isolated function deleteLeadQuery(int leadId) returns sql:ParameterizedQuery => `
    UPDATE 
        team_leads
    SET 
        active = false
    WHERE 
        id = ${leadId};
    `;

# Query to update a lead.
#
# + leadId - Lead id
# + leadEmail - Lead email
# + teamName - Team name
# + return - Query to update a lead
isolated function updateTeamLeadQuery(int leadId, string leadEmail, string teamName)
    returns sql:ParameterizedQuery => `

    UPDATE 
        team_leads
    SET 
        lead_email = ${leadEmail},
        team = ${teamName},
        active = true
    WHERE 
        id = ${leadId};
    `;

# Query to get all organizations.
#
# + return - List of organizations
isolated function getOrganizationsQuery() returns sql:ParameterizedQuery => `
    SELECT 
        o.organization_id AS organizationId,
        o.organization_name AS organizationName,
        o.visibility AS organizationVisibility,
        o.plan AS organizationPlan,
        o.enable_issues AS enableIssues,
        GROUP_CONCAT(dt.team_name) AS defaultTeams
    FROM 
        github_organizations o
    LEFT JOIN 
        organization_default_teams odt ON o.organization_id = odt.organization_id
    LEFT JOIN 
        default_teams dt ON odt.team_id = dt.team_id
    WHERE
        o.active = true
    GROUP BY 
        o.organization_id, o.organization_name, o.visibility, o.plan, o.enable_issues;
    `;

# Query to get an organization by name.
#
# + organizationName - Organization name
# + return - Query to get an organization by name
isolated function getOrganizationByNameQuery(string organizationName) returns sql:ParameterizedQuery => `
    SELECT 
        organization_id AS organizationId,
        organization_name AS organizationName,
        visibility AS organizationVisibility,
        plan AS organizationPlan,
        enable_issues AS enableIssues,
        active AS active
    FROM 
        github_organizations
    WHERE 
        organization_name = ${organizationName}
    `;

# Query to get an organization by id.
#
# + organizationId - Organization id
# + return - Query to get an organization by id
isolated function getOrganizationByIdQuery(int organizationId) returns sql:ParameterizedQuery => `
    SELECT 
        o.organization_id AS organizationId,
        o.organization_name AS organizationName,
        o.visibility AS organizationVisibility,
        o.plan AS organizationPlan,
        o.enable_issues AS enableIssues,
        GROUP_CONCAT(dt.team_name) AS defaultTeams,
        GROUP_CONCAT(dt.team_id) AS teamIds
    FROM 
        github_organizations o
    LEFT JOIN 
        organization_default_teams odt ON o.organization_id = odt.organization_id
    LEFT JOIN 
        default_teams dt ON odt.team_id = dt.team_id
    WHERE
        o.organization_id = ${organizationId}
    `;

# Query to add a new organization.
#
# + organizationName - Organization name
# + organizationVisibility - Visibility of the organization (public or private)
# + organizationPlan - Organization plan
# + enableIssues - Whether issues are allowed(1) or not(0) for the organization
# + return - Query to add a new organization
isolated function addOrganizationQuery(string organizationName, string organizationVisibility, string organizationPlan,
        boolean enableIssues) returns sql:ParameterizedQuery => `

    INSERT INTO github_organizations (
        organization_name,
        visibility,
        plan,
        enable_issues
    ) 
    VALUES (
        ${organizationName},
        ${organizationVisibility},
        ${organizationPlan},
        ${enableIssues}
    )
    `;

# Query to update an organization.
#
# + organizationId - Organization id
# + organizationName - Organization name
# + organizationVisibility - Visibility of the organization (public or private)
# + organizationPlan - Organization plan
# + enableIssues - Whether issues are allowed(1) or not(0) for the organization
# + return - Query to update an organization
isolated function updateOrganizationQuery(int organizationId, string organizationName, string organizationVisibility,
        string organizationPlan, boolean enableIssues) returns sql:ParameterizedQuery => `

    UPDATE 
        github_organizations
    SET 
        organization_name = ${organizationName},
        visibility = ${organizationVisibility},
        plan = ${organizationPlan},
        enable_issues = ${enableIssues},
        active = true
    WHERE 
        organization_id = ${organizationId};
    `;

# Query to sync an organization's plan.
#
# + organizationName - Organization name
# + plan - Organization plan
# + return - Query to sync an organization's plan
isolated function syncOrganizationPlanQuery(string organizationName, string plan) returns sql:ParameterizedQuery => `
    UPDATE 
        github_organizations
    SET 
        plan = ${plan}
    WHERE 
        organization_name = ${organizationName};
    `;

# Query to delete an organization by id.
#
# + organizationId - Organization id
# + return - Query to delete an organization by id
isolated function deleteOrganizationQuery(int organizationId) returns sql:ParameterizedQuery => `
    UPDATE 
        github_organizations g
    SET 
        g.active = FALSE
    WHERE 
        g.organization_id = ${organizationId}
        AND 
            g.active = TRUE
    `;

# Query to get all default teams for a given organization.
#
# + organizationId - Organization id
# + return - Query to get all default teams for a given organization
isolated function getDefaultTeamsForOrganizationQuery(int organizationId) returns sql:ParameterizedQuery => `
    SELECT 
        dt.team_id AS teamId,
        dt.team_name AS teamName,
        dt.permission_level AS permission
    FROM 
        organization_default_teams odt
    JOIN 
        default_teams dt ON odt.team_id = dt.team_id
    WHERE 
        odt.organization_id = ${organizationId}
    ORDER BY 
        dt.team_name ASC
    `;

# Query to add a default team for an organization.
#
# + organizationId - Organization id
# + teamId - Team id
# + return - Query to add a default team for an organization
isolated function addOrganizationDefaultTeamQuery(int organizationId, int teamId) returns sql:ParameterizedQuery => `
    INSERT INTO organization_default_teams (
        organization_id,
        team_id
    ) VALUES (
        ${organizationId},
        ${teamId}
    ) ON DUPLICATE KEY UPDATE team_id = VALUES(team_id);
    `;

# Query to delete default team for an organization.
#
# + organizationId - Organization id
# + return - Query to delete default team for an organization
isolated function deleteOrganizationDefaultTeamQuery(int organizationId) returns sql:ParameterizedQuery => `
    DELETE FROM 
        organization_default_teams
    WHERE 
        organization_id = ${organizationId};
    `;

# Query to get all default teams.
#
# + return - List of default teams
isolated function getDefaultTeamsQuery() returns sql:ParameterizedQuery => `
    SELECT 
        team_id,
        team_name,
        permission_level
    FROM 
        default_teams
    WHERE
        active = true
    ORDER BY 
        team_name ASC
    `;

# Query to get a default team by id.
#
# + teamId - ID of the default team
# + return - Query to get a default team by id
isolated function getDefaultTeamByIdQuery(int teamId) returns sql:ParameterizedQuery => `
    SELECT
        team_id,
        team_name,
        permission_level
    FROM
        default_teams
    WHERE
        team_id = ${teamId}
    `;

# Query to get a default team by name.
#
# + teamName - Name of the default team
# + return - Query to get a default team by name
isolated function getDefaultTeamByNameQuery(string teamName) returns sql:ParameterizedQuery => `
    SELECT
        team_id,
        team_name,
        permission_level
    FROM
        default_teams
    WHERE
        team_name = ${teamName}
    `;

# Query to add a new default team.
#
# + teamName - Name of the default team
# + permissionLevel - Permission level for the team (e.g., 'pull', 'triage', 'push')
# + return - Query to add a new default team
isolated function addDefaultTeamQuery(string teamName, string permissionLevel) returns sql:ParameterizedQuery => `
    INSERT INTO default_teams (
        team_name,
        permission_level
    )
    VALUES (
        ${teamName},
        ${permissionLevel}
    )
    `;

# Query to update a default team by id.
#
# + teamId - Id of the default team
# + teamName - New name for the team (optional)
# + permissionLevel - New permission level for the team
# + return - Query to update a default team by id
isolated function updateDefaultTeamQuery(int teamId, string? teamName, string permissionLevel)
    returns sql:ParameterizedQuery => `

    UPDATE 
        default_teams
    SET
        team_name = ${teamName},
        permission_level = ${permissionLevel},
        active = true
    WHERE
        team_id = ${teamId}
    `;

# Query to delete a default team by id.
#
# + teamId - Id of the default team
# + return - Query to delete a default team by id
isolated function deleteDefaultTeamQuery(int teamId) returns sql:ParameterizedQuery => `
    UPDATE 
        default_teams
    SET 
        active = false
    WHERE 
        team_id = ${teamId};
    `;

# Upsert user default repository access by employee id.
#
# + employeeId - HR employee id
# + granted - Whether default access was granted
# + return - Parameterized upsert query
isolated function upsertUserDefaultRepositoryAccessQuery(string employeeId, boolean granted)
    returns sql:ParameterizedQuery => `
    INSERT INTO user_default_repository_access (
        employee_id,
        granted
    )
    VALUES (
        ${employeeId},
        ${granted}
    )
    ON DUPLICATE KEY UPDATE
        granted = VALUES(granted)
    `;

# Get user default repository access by employee id.
#
# + employeeId - HR employee id
# + return - Parameterized select query
isolated function getUserDefaultRepositoryAccessQuery(string employeeId)
    returns sql:ParameterizedQuery => `
    SELECT
        employee_id,
        granted
    FROM user_default_repository_access
    WHERE employee_id = ${employeeId}
`;

# Get default org/team rows by access type (PERMANENT | CS | INTERN).
#
# + accessType - Access category filter
# + return - Parameterized select query
isolated function getOrganizationDefaultRepositoriesByAccessTypeQuery(string accessType)
    returns sql:ParameterizedQuery => `
    SELECT
        org_name,
        team_slug,
        access_type
    FROM organizations_default_repositories
    WHERE access_type = ${accessType}
`;