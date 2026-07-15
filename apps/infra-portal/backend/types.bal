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
import infra_portal.database;

# Represents the response structure for security dashboard links.
public type SecurityDashboardLinks record {|
    # Link to device compliance dashboard
    string deviceComplianceLink;
    # Link to software compliance dashboard
    string softwareComplianceLink;
    # Link to security score dashboard
    string securityScoreLink;
|};

# Represents the payload for verifying an email.
type VerifyEmailPayload record {
    # Authentication code sent by GitHub.
    string code;
};

# Represents the response structure for retrieving user information.
public type UserInfoResponse record {|
    # Id of the employee
    string employeeId;
    # Email of the employee
    string workEmail;
    # First name of the employee
    string firstName;
    # Last name of the employee
    string lastName;
    # Job role
    string jobRole;
    # Thumbnail of the employee
    string? employeeThumbnail;
    # Department
    string? department;
    # Team of the employee
    string? team;
    # Employment type of the employee
    string? employmentType;
    # User Privileges
    int[] privileges;
    # GitHub user ID if the employee has linked their GitHub account
    string? githubUserId = ();
    # GitHub username if the employee has linked their GitHub account
    string? githubUsername = ();
|};

# Repository Request List.
public type RepositoryRequestsListResponse record {
    # Number of total records
    int totalCount;
    # Number of records per page
    int pendingCount;
    # Number of records per page
    int approvedCount;
    # Number of records per page
    int rejectedCount;
    # List of Repository requests
    database:RepositoryRequest[] repositoryRequests;
};

# Repository Request
public type RepositoryRequest record {
    # Repository request
    database:RepositoryRequest repositoryRequest;
};

# Topic
public type Topic record {
    # Topic ID
    int? topicId = ();
    # Topic name
    string topicName;
};

# Organization
public type Organization record {
    # Organization ID
    int? organizationId = ();
    # Organization name
    string organizationName;
    # Visibility
    string organizationVisibility;
    # Whether issues are allowed or not for the organization
    boolean enableIssues;
    # Default Teams IDs
    int[] teamIds;
};

# TeamLead
public type TeamLead record {|
    # Lead ID
    int? leadId = ();
    # Lead Email
    string leadEmail;
    # Team name
    string teamName;
|};

# TeamLead
public type DefaultTeam record {|
    # Team ID
    int? teamId = ();
    # Team name
    string teamName;
    # Pemission Level
    string permissionLevel;
|};

# Enum for team formats.
public enum TeamFormats {
    # Internal Committer Team format
    INTERNAL_COMMITTER_FORMAT = "-internal-committers",
    # External Committer Team format
    EXTERNAL_COMMITTER_FORMAT = "-external-committers",
    # Readonly Team format
    READONLY_FORMAT = "-readonly"
};

# Committer Teams Record.
public type CommitterTeams record {
    # List of Internal Committer Teams
    string[] internalCommitterTeams;
    # List of External Committer Teams
    string[] externalCommitterTeams;
};

# Comment Input.
public type Comment record {
    # Email of the author
    string authorEmail;
    # Comment text
    string commentText;
};
