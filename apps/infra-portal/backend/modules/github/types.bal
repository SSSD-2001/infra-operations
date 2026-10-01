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
import ballerina/data.jsondata;

# [Configurable] OAuth2 entity application configuration.
type Oauth2Config record {|
    # OAuth2 token endpoint
    string tokenUrl;
    # OAuth2 client ID
    string clientId;
    # OAuth2 client secret
    string clientSecret;
    # OAuth2 scopes
    string scopes;
|};

# Retry config for the REST client.
public type RestRetryConfig record {|
    # Retry count
    int count = RETRY_COUNT;
    # Retry interval
    decimal interval = RETRY_INTERVAL;
    # Retry backOff factor
    float backOffFactor = RETRY_BACKOFF_FACTOR;
    # Retry max interval
    decimal maxWaitInterval = RETRY_MAX_INTERVAL;
|};

# GitHub OAuth application configuration.
type GitHubOauthAppConfig record {|
    # GitHub OAuth application client ID
    string clientId;
    # GitHub OAuth application client secret
    string clientSecret;
    # GitHub OAuth application callback URL
    string redirectUri;
    # GitHub OAuth application token URL
    string githubTokenUrl;
    # GitHub API base URL
    string githubApiBaseUrl;
|};

type TokenExchangeRequest record {|
    # The authorization code received from GitHub after user authorization
    string code;
    # The client ID of the GitHub OAuth application
    @jsondata:Name {
        value: "client_id"
    }
    string clientId;
    # The client secret of the GitHub OAuth application
    @jsondata:Name {
        value: "client_secret"
    }
    string clientSecret;
    # The redirect URI registered with the GitHub OAuth application
    @jsondata:Name {
        value: "redirect_uri"
    }
    string redirectUri;
|};

# Record to represent the response from GitHub when exchanging an authorization code for an access token.
type TokenResponse record {|
    # The access token issued by GitHub
    @jsondata:Name {
        value: "access_token"
    }
    string accessToken;
    # The type of the token (e.g., "bearer")
    @jsondata:Name {
        value: "token_type"
    }
    string tokenType;
    # The scope of the access token
    string scope;
|};

# Record to represent a GitHub team.
public type GitHubTeam record {|
    # Team slug
    string slug;
    json...;
|};

# Record to represent the data field in the response.
public type GitHubTeamsData record {|
    # List of GitHub teams
    GitHubTeam[] gitChildTeams;
|};

# Record to represent the full response.
public type GitHubTeamsResponse record {|
    # Data field containing the list of GitHub teams
    GitHubTeamsData data;
|};

# Record to represent Organization plan.
public type GitHubPlan record {|
    # The name of the plan
    string name;
    # The maximum number of seats in the plan
    int? seats = ();
    # The number of private repositories in the plan
    int? privateRepoCount = ();
    # The space in the plan
    int? space = ();
    # The unit of the plan
    string? unit = ();
    json...;
|};

# Record to represent a GitHub team.
public type GitHubOrganization record {|
    # The unique ID of the organization
    int? id;
    # The node ID of the organization
    string? nodeId;
    # The API URL of the organization
    string? htmlUrl;
    # The login name of the organization
    string login;
    # The name of the organization
    string? name;
    # The description of the organization
    string? description;
    # The email of the organization
    string? email;
    # The number of public repositories in the organization
    int? publicRepos;
    # The total number of private repositories in the organization
    int? totalPrivateRepos;
    # The creation date of the organization in ISO 8601 format
    string? createdAt;
    # The last updated date of the organization in ISO 8601 format
    string? updatedAt;
    # The plan type of the organization (e.g., "free", "pro", "enterprise")
    GitHubPlan? plan;
    json...;
|};

# Record to represent the data field in the response.
public type GitHubOrganizationData record {|
    # List of GitHub teams
    GitHubOrganization gitOrganization;
    json...;
|};

# Record to represent the full response.
public type GitHubOrganizationResponse record {|
    # Data field containing the list of GitHub teams
    GitHubOrganizationData data;
    json...;
|};

# Record to represent github label data.
public type LabelData record {
    # Label ID
    string name;
    # Label color
    string color;
    # Label description
    string description;
};

# Result of adding labels.
public type GitLabelResult record {|
    # List of successfully added labels
    string[] successLabels;
    # List of labels that failed to be added
    string[] failedLabels;
|};

# Input for adding labels.
public type AddLabelsInput record {
    # The organization name. The name is not case sensitive.
    string orgName;
    # The name of the repository without the .git extension. The name is not case sensitive.
    string repoName;
    # The labels to add to the repository
    LabelData[] labels;
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

# Record to represent repository creation input.
public type CreateRepoInput record {
    # The organization name. The name is not case sensitive.
    string orgName;
    # Repository name
    string repoName;
    # Pass true to create an initial commit with empty README
    boolean autoInit = true;
    # Pass true to create a private repository
    boolean isPrivate;
    # Repository description
    string repoDescription;
    # Repository homepage
    string repoHomepage?;
    # Pass true to enable issues
    boolean enableIssues;
    # Pass true to enable wiki
    boolean enableWiki = false;
    # license template
    string licenseTemplate = "apache-2.0";
    # gitignore template
    string gitignoreTemplate = "Java";
};

# Create repository input.
public type RepositoryInput record {|
    # The organization name. The name is not case sensitive.
    string orgName;
    # Repository name
    string repoName;
    # Pass true to create an initial commit with empty README
    boolean autoInit = false;
    # Pass true to create a private repository
    boolean isPrivate?;
    # Repository description
    string repoDescription?;
    # Repository homepage
    string repoHomepage?;
    # Pass true to enable issues
    boolean enableIssues?;
    # Pass true to enable wiki
    boolean enableWiki?;
    # license template
    string licenseTemplate?;
    # gitignore template
    string gitignoreTemplate?;
|};

# Common Response of a created entity.
public type IdResponse record {|
    # ID
    int id;
    json...;
|};

# Response of a created release.
public type ReleaseResponse record {|
    *IdResponse;
    json...;
|};

# Record to represent topics input.
public type AddGitTopicsInput record {|
    # The organization name. The name is not case sensitive.
    string orgName;
    # The name of the repository without the .git extension. The name is not case sensitive.
    string repoName;
    # The topics to add to the repository
    string[] topics;
|};

# Response of adding topics.
public type AddGitTopicsResponse record {|
    # The topics of the repository
    string[] names;
|};

# Commit file input.
public type CommitFileInput record {|
    # The account owner of the repository. The name is not case sensitive.
    string owner;
    # The name of the repository without the .git extension. The name is not case sensitive.
    string repoName;
    # File path
    string path;
    # Commit message
    string message;
    # Branch name
    string? branch;
    # Content of the file (base64 encoded)
    string encodedContent;
|};

# Response of a file commit.
public type CommitResponse record {|
    # File content
    Content content;
    json...;
|};

# Content of the committed file.
public type Content record {|
    # URL of the file
    string url;
    json...;
|};

# Record to represent branch protection input.
public type AddBranchProtectionInput record {
    # The organization name. The name is not case sensitive.
    string orgName;
    # The name of the repository without the .git extension. The name is not case sensitive.
    string repoName;
    # The type of branch protection rules to be applied
    string branchProtectionType;
};

# Response of adding branch protection rules.
public type BranchProtectionResponse record {|
    # The name of the branch
    string url;
    json...;
|};

# Record to represent team input.
public type AddTeamInput record {
    # The organization name. The name is not case sensitive.
    string orgName;
    # The name of the repository without the .git extension. The name is not case sensitive.
    string repoName;
    # The name of the team to add to the repository
    Team[] teams;
};

# Record to represent a team.
public type Team record {
    # The slug of the team
    string slug;
    # The permission level for the team (e.g., "admin", "push", "pull")
    string permission;
};

# Structure to store GitHub team addition results.
public type AddTeamsResult record {|
    # List of successfully added teams
    string[] successTeams;
    # List of teams that failed to be added
    string[] failedTeams;
|};

# Member permission levels.
public enum MemberRole {
    MEMBER = "member",
    MAINTAINER = "maintainer"
};

# Role filter for listing team members.  
public enum MemberRoleFilter {
    ALL_ROLES = "all",
    MEMBER = "member",
    MAINTAINER = "maintainer"
};

# Member state enumeration.
public enum MemberState {
    ACTIVE = "active",
    PENDING = "pending"
};

# Record to represent the input for adding or updating team members.
public type OrganizationAndTeam record {
    # Organization name
    string orgName;
    # Team slug
    string teamSlug;
};

# Team membership response for users.
public type MembershipResponse record {|
    # The state of the membership.
    MemberState state;
    # The role of the member.
    MemberRole role;
    # The URL of the membership.
    string url;
|};

# Record to represent a GitHub user.
public type AddOrUpdateTeamMemberInformationInput record {|
    # The organization name.
    string orgName;
    # The slug of the team.
    string teamSlug;
    # The username of the member to be added or updated.
    string userName;
    # The role of the member in the team (e.g., "member", "maintainer").
    MemberRole role;
|};

# Record to represent a successful membership addition or update.
public type SuccessfulMembershipResponse record {|
    *AddOrUpdateTeamMemberInformationInput;
    # The response from the GitHub API after adding or updating the team member's information.
    MembershipResponse membershipResponse;
|};

# Record to represent a failed membership addition or update.
public type FailedMembershipResponse record {|
    *AddOrUpdateTeamMemberInformationInput;
    # Error message describing the failure
    string errorMessage;
|};

# Record to represent the response of adding or updating team members, including both successful and failed operations.
public type AddOrUpdateTeamMemberResponse record {|
    # List of successful membership additions or updates.
    SuccessfulMembershipResponse[] successfulMemberships;
    # List of failed membership additions or updates.
    FailedMembershipResponse[] failedMemberships;
|};

# Map for branch protection types.
public const map<string> branchProtectionMap = {
    "Default": "DEFAULT",
    "Bal Lib Repo": "BALLERINA_LIBRARY"
};

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

# Enum for team formats.
public enum TeamFormats {
    # Internal Committer Team format
    INTERNAL_COMMITTER_FORMAT = "-internal-committers",
    # External Committer Team format
    EXTERNAL_COMMITTER_FORMAT = "-external-committers",
    # Readonly Team format
    READONLY_FORMAT = "-readonly"
};

# Enum to represent the status of a GitHub operation.
public enum GitHubOperationStatus {
    SUCCESS,
    FAILURE,
    PARTIAL_FAILURE
}

# Fine-grained access token information.
public type FineGrainedAccessToken record {
    # PAT request id
    int id;
    # Github Owner
    record {
        # Login of the token owner
        string login;
    } owner;
    # ID of the token
    int token_id;
    # Token name
    string token_name;
    # Whether the token is expired
    boolean token_expired;
    # Expiration time of the token
    string? token_expires_at;
    # Permissions associated with the token
    json permissions;
};

# Failed response record for GitHub API errors.
public type FailedResponse record {
    # Login associated with the failed request
    string login;
    # Error message describing the failure
    string errorMessage;
};

# Fine-grained access token response.
public type FineGrainedAccessTokenResponse record {
    # List of successful token response record for GitHub API calls
    record {
        # Login associated with the successful request
        string login;
        # List of fine-grained access tokens retrieved for the login
        FineGrainedAccessToken[] tokens;
    }[] successfulResponses;
    # List of failed responses containing error details for each login that encountered an error
    FailedResponse[] failedResponses;
};

# Email address associated with the authenticated user.
public type EmailAddress record {
    # Email address
    string email;
    # Whether the email is primary
    boolean primary;
    # Whether the email is verified
    boolean verified;
    # Visibility of the email address (public/private)
    string? visibility;
};

# GitHub account plan details.
public type GitHubUserPlan record {
    # Number of collaborators allowed under the plan
    int collaborators;
    # Plan name (e.g., "free", "pro", "team")
    string name;
    # Disk space quota in kilobytes
    int space;
    # Number of private repositories allowed under the plan
    int private_repos;

};

# Authenticated GitHub user.
public type GitHubUser record {
    # GitHub username
    @jsondata:Name {value: "login"}
    string login;
    # Unique numeric user ID
    int id;
    # Global node ID used in GraphQL API
    @jsondata:Name {value: "node_id"}
    string nodeId;
    # URL of the user's avatar image
    @jsondata:Name {value: "avatar_url"}
    string avatarUrl;
    # Gravatar ID, null if not set
    @jsondata:Name {value: "gravatar_id"}
    string? gravatarId;
    # API URL for this user resource
    string url;
    # URL of the user's GitHub profile page
    @jsondata:Name {value: "html_url"}
    string htmlUrl;
    # API URL to list the user's followers
    @jsondata:Name {value: "followers_url"}
    string followersUrl;
    # API URL template for users this user is following
    @jsondata:Name {value: "following_url"}
    string followingUrl;
    # API URL template for the user's gists
    @jsondata:Name {value: "gists_url"}
    string gistsUrl;
    # API URL template for the user's starred repositories
    @jsondata:Name {value: "starred_url"}
    string starredUrl;
    # API URL to list the user's subscriptions (watched repositories)
    @jsondata:Name {value: "subscriptions_url"}
    string subscriptionsUrl;
    # API URL to list the user's organization memberships
    @jsondata:Name {value: "organizations_url"}
    string organizationsUrl;
    # API URL to list the user's repositories
    @jsondata:Name {value: "repos_url"}
    string reposUrl;
    # API URL template for events performed by the user
    @jsondata:Name {value: "events_url"}
    string eventsUrl;
    # API URL to list events received by the user
    @jsondata:Name {value: "received_events_url"}
    string receivedEventsUrl;
    # Account type (e.g., "User", "Organization")
    @jsondata:Name {value: "type"}
    string accountType;
    # Whether the user is a GitHub site administrator
    @jsondata:Name {value: "site_admin"}
    boolean siteAdmin;
    # Display name, null if not set
    string? name;
    # Company name, null if not set
    string? company;
    # Blog or website URL, null if not set
    string? blog;
    # Geographic location, null if not set
    string? location;
    # Publicly visible email address, null if not set
    string? email;
    # Whether the user is open to being hired, null if not set
    boolean? hireable;
    # Profile biography, null if not set
    string? bio;
    # Number of public repositories
    @jsondata:Name {value: "public_repos"}
    int publicRepos;
    # Number of public gists
    @jsondata:Name {value: "public_gists"}
    int publicGists;
    # Number of followers
    int followers;
    # Number of users this user is following
    int following;
    # Account creation timestamp (ISO 8601)
    @jsondata:Name {value: "created_at"}
    string createdAt;
    # Last profile update timestamp (ISO 8601)
    @jsondata:Name {value: "updated_at"}
    string updatedAt;
    # How the user is being viewed (e.g., "public", "private")
    @jsondata:Name {value: "user_view_type"}
    string? userViewType?;
    # Notification email address, null if not set
    @jsondata:Name {value: "notification_email"}
    string? notificationEmail?;
    # Twitter/X username, null if not set
    @jsondata:Name {value: "twitter_username"}
    string? twitterUsername?;
    # Subscription plan details
    GitHubUserPlan? plan?;
    # Number of private gists (private user only)
    @jsondata:Name {value: "private_gists"}
    int? privateGists?;
    # Total number of private repositories (private user only)
    @jsondata:Name {value: "total_private_repos"}
    int? totalPrivateRepos?;
    # Number of private repositories owned by the user (private user only)
    @jsondata:Name {value: "owned_private_repos"}
    int? ownedPrivateRepos?;
    # Disk usage in kilobytes (private user only)
    @jsondata:Name {value: "disk_usage"}
    int? diskUsage?;
    # Number of collaborators on private repositories (private user only)
    int? collaborators?;
    # Whether two-factor authentication is enabled (private user only)
    @jsondata:Name {value: "two_factor_authentication"}
    boolean? twoFactorAuthentication?;
    # Whether the user has a GitHub Business+ plan (private user only)
    @jsondata:Name {value: "business_plus"}
    boolean? businessPlus?;
    # LDAP distinguished name for enterprise-managed users (private user only)
    @jsondata:Name {value: "ldap_dn"}
    string? ldapDn?;
};

# Record to represent the payload for verifying an email.
public type VerifyEmailPayload record {
    # Authentication code sent by GitHub.
    string code;
    # Email address of the user to be verified.
    string email;
};

# Record to represent the response of email verification.
public type EmailVerificationResponse record {|
    # Status of the email verification.
    string status;
    # GitHub user ID null if verification failed.
    string? githubUserId = ();
    # GitHub username null if verification failed.
    string? githubUsername = ();
|};
