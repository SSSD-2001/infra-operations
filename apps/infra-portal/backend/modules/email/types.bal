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

# Auth2 client auth configurations.
public type Oauth2Config record {|
    # Token URL
    string tokenUrl;
    # Client ID
    string clientId;
    # Client Secret
    string clientSecret;
|};

# Record to represent the payload for sending an email.
public type EmailPayload record {
    # Recipient email(s) as string array
    string[] to;
    # Sender email
    string 'from;
    # Email subject
    string subject;
    # Email template
    string template;
    # CC'ed recipient email(s) as string array
    string[] cc;
    # BCC'd recipient email(s)
    string[] bcc?;
};

# Record type for email details.
public type EmailDetails record {|
    # Email of the requestor
    string userEmail;
    # Email of the lead
    string leadEmail;
    # CC'ed recipient email(s) as string
    string ccList;
    # Unique identifier for the email
    string id;
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

# Record type for email data used in the update request alert.
public type UpdateRequestEmailData record {|
    # Repository Request ID
    string id;
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
    string organizationId;
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
    string websiteUrl;
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
    string jenkinsJobType;
    # Jenkins group ID
    string jenkinsGroupId;
    # Azure DevOps organization
    string azureDevopsOrg;
    # Azure DevOps project
    string azureDevopsProject;
    # Timestamp
    string timestamp;
    # Approval state
    string state;
    # Repository request status
    string totalCount;
    # Repository request status
    string pendingCount;
    # Repository request status
    string approvedCount;
    # Repository request status
    string rejectedCount;
    # Update timestamp
    string updatedAt;
|};

# Record type for email data used in the approve request alert.
public type RejectRequestEmailData record {|
    *RepositoryRequest;
|};

# Record type for email data used in the approve request alert.
public type ApproveRequestEmailData record {|
    *RepositoryRequest;
|};

# Comment Input.
public type Comment record {
    # Email of the author
    string authorEmail;
    # Comment text
    string commentText;
};

# Record to represent the result of a GitHub operation.
public type GitHubOperationResult record {|
    # Name of the operation (e.g., ADD_TOPICS, ADD_LABELS)
    GitHubOperation operation;
    # Status of the operation (e.g., Sucess, Failure)
    GitHubOperationStatus status;
    # Optional error message if the operation failed
    string errorMessage = "None";
|};

# Enum to represent GitHub operations.
public enum GitHubOperation {
    CREATE_GITHUB_CLIENT,
    FORMAT_TEAMS,
    CREATE_REPO,
    ADD_TOPICS,
    ADD_LABELS,
    ADD_ISSUE_TEMPLATE,
    ADD_PULL_REQUEST_TEMPLATE,
    ADD_BRANCH_PROTECTION,
    ADD_TEAMS,
    ADD_OR_UPDATE_TEAM_MEMBERS
}

# Enum to represent the status of a GitHub operation.
public enum GitHubOperationStatus {
    SUCCESS,
    FAILURE,
    PARTIAL_FAILURE
}
