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
import ballerinax/mysql;

# [Configurable] database configs.
type DatabaseConfig record {|
    # Database User 
    string user;
    # Database Password
    string password;
    # Database Name
    string database;
    # Database Host
    string host;
    # Database port
    int port;
    # Database connection pool
    sql:ConnectionPool connectionPool;
|};

# Database config record.
type DatabaseClientConfig record {|
    *DatabaseConfig;
    # Additional configurations related to the MySQL database connection
    mysql:Options? options;
|};

# RepositoryRequest record type.
public type RepositoryRequest record {|
    # Repository Request ID
    readonly int id;
    # Email of the requester
    string email;
    # Email of the lead
    string leadEmail;
    # Requirement details
    string requirement;
    # CC List for the request
    string ccList;
    # Repository name
    string repoName;
    # Organization ID
    readonly int organizationId;
    # Organization name
    string organizationName;
    # Organization visibility
    string organizationVisibility;
    # Repository type
    string repoType;
    # Repository description
    string description;
    # Enable issues
    string enableIssues;
    # Website URL
    string? websiteUrl;
    # Topics
    string topics;
    # Pull request protection
    string prProtection;
    # Teams
    string teams;
    # Enable triage for WSO2 All team
    string enableTriageWso2All;
    # Enable triage for WSO2 All Interns team
    string enableTriageWso2AllInterns;
    # Reason for disabling triage
    string disableTriageReason;
    # CI/CD requirement
    string cicdRequirement;
    # Jenkins job type
    string? jenkinsJobType;
    # Jenkins group ID
    string? jenkinsGroupId;
    # Azure DevOps organization
    string? azureDevopsOrg;
    # Azure DevOps project
    string? azureDevopsProject;
    # Timestamp
    string timestamp;
    # Approval state
    string state;
    # Repository request status
    int totalCount;
    # Repository request status
    int pendingCount;
    # Repository request status
    int approvedCount;
    # Repository request status
    int rejectedCount;
    # Update timestamp
    string? updatedAt;
|};

# RepositoryRequest create record type.
public type RepositoryRequestCreate record {|
    # Email of the requester
    string email;
    # Email of the lead
    string leadEmail;
    # Requirement details
    string requirement;
    # CC List for the request
    string ccList;
    # Repository name
    string repoName;
    # Organization ID
    int organizationId;
    # Repository type
    string repoType;
    # Repository description
    string description;
    # Enable issues
    string enableIssues;
    # Website URL
    string? websiteUrl;
    # Topics
    string topics;
    # Pull request protection
    string prProtection;
    # Teams
    string teams;
    # Enable triage for WSO2 All team
    string enableTriageWso2All;
    # Enable triage for WSO2 All Interns team
    string enableTriageWso2AllInterns;
    # Reason for disabling triage
    string disableTriageReason;
    # CI/CD requirement
    string cicdRequirement;
    # Jenkins job type
    string? jenkinsJobType;
    # Jenkins group ID
    string? jenkinsGroupId;
    # Azure DevOps organization
    string? azureDevopsOrg;
    # Azure DevOps project
    string? azureDevopsProject;
|};

# RepositoryRequest update record type.
public type RepositoryRequestUpdate record {|
    # Repository Request ID
    int id;
    # Email of the requester
    string? email = ();
    # Email of the lead
    string? lead_email = ();
    # Requirement details
    string? requirement = ();
    # CC List for the request
    string? ccList = ();
    # Repository name
    string? repoName = ();
    # Organization ID
    int? organizationId = ();
    # Organization name
    string? organizationName = ();
    # Repository type
    string? repoType = ();
    # Repository description
    string? description = ();
    # Enable issues
    string? enableIssues = ();
    # Website URL
    string? websiteUrl = ();
    # Topics
    string? topics = ();
    # Pull request protection
    string? prProtection = ();
    # Teams
    string? teams = ();
    # Enable triage for WSO2 All team
    string? enableTriageWso2All = ();
    # Enable triage for WSO2 All Interns team
    string? enableTriageWso2AllInterns = ();
    # Reason for disabling triage
    string? disableTriageReason = ();
    # CI/CD requirement
    string? cicdRequirement = ();
    # Jenkins job type
    string? jenkinsJobType = ();
    # Jenkins group ID
    string? jenkinsGroupId = ();
    # Azure DevOps organization
    string? azureDevopsOrg = ();
    # Azure DevOps project
    string? azureDevopsProject = ();
    # Approval state
    string? state = ();
|};

# Filters for the repository request list.
public type RepositoryRequestFilter record {|
    # Repository name
    string? repoName = ();
    # Member email
    string? memberEmail = ();
    # Lead email
    string? leadEmail = ();
    # Approval state 
    RepositoryRequestState? approvalState = ();
    # Number of records per page
    int? 'limit = ();
    # Starting point for pagination
    int? offset = ();
|};

# Record to represent an organization.
public type Organization record {|
    # Organization ID
    readonly int organizationId;
    # Organization name
    string organizationName;
    # Visibility
    string organizationVisibility;
    # Organization plan
    string organizationPlan;
    # Whether issues are allowed(1) or not(0) for the organization
    int enableIssues;
    # Active or not
    int active;
    # Default team names
    string? defaultTeams;
    # Default team IDs
    string? teamIds;
|};

# Record to represent a topic.
public type Topic record {|
    # Topics ID
    @sql:Column {name: "topic_id"}
    readonly int topicId;
    # Topic name
    @sql:Column {name: "topic_name"}
    string topicName;
|};

# Record to represent a team lead.
public type TeamLead record {|
    # Topics ID
    @sql:Column {name: "id"}
    readonly int leadId;
    # Lead Email
    @sql:Column {name: "lead_email"}
    string leadEmail;
    # Team name
    @sql:Column {name: "team"}
    string teamName;
    # Active or not
    @sql:Column {name: "active"}
    int active;
|};

# Record to represent a repository request comment.
public type RepositoryRequestComment record {|
    # Comment ID
    @sql:Column {name: "comment_id"}
    int commentId;
    # Repository request ID
    @sql:Column {name: "request_id"}
    int requestId;
    # Author email
    @sql:Column {name: "author_email"}
    string authorEmail;
    # Comment text
    @sql:Column {name: "comment_text"}
    string commentText;
    # Created at timestamp
    @sql:Column {name: "created_at"}
    string createdAt;
|};

# Record to represent a default team.
public type DefaultTeam record {|
    # Team ID
    @sql:Column {name: "team_id"}
    int teamId;
    # Team name
    @sql:Column {name: "team_name"}
    string teamName;
    # Permission level
    @sql:Column {name: "permission_level"}
    string permissionLevel;
|};

# Enum to represent the state of a repository request.
public enum RepositoryRequestState {
    PENDING = "Pending",
    APPROVED = "Approved",
    REJECTED = "Rejected"
}

# Invalid operation error
public type InvalidOperationError distinct error;

# Record to represent a team to be added to a repository.
public type Team record {
    # The ID of the team to add to the repository
    int teamId;
    # The name of the team to add to the repository
    string teamName;
    # The slug of the team to add to the repository
    string permission;
};

# Record for user default repository access tracking.
public type UserDefaultRepositoryAccess record {|
    # HR employee id
    @sql:Column {name: "employee_id"}
    string employeeId;
    # Whether default access was granted
    boolean granted;
|};

# Row from organizations_default_repositories.
public type OrganizationDefaultRepository record {|
    # GitHub organization login
    @sql:Column {name: "org_name"}
    string orgName;
    # Team slug in the organization
    @sql:Column {name: "team_slug"}
    string teamSlug;
    # Access category: PERMANENT, CS, or INTERN
    @sql:Column {name: "access_type"}
    string accessType;
|};