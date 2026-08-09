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

export const SnackMessage = {
  success: {
    addCommentMessage: "Successfully added the comment",
    fetchCommentsMessage: "Successfully fetched comments",

    addLeadMessage: "Successfully added the Lead",
    updateLeadMessage: "Successfully updated the Lead",
    deleteLeadMessage: "Successfully deleted the Lead",
    fetchLeadsMessage: "Successfully fetched the Leads",

    addOrganizationMessage: "Successfully added the Organization",
    updateOrganizationMessage: "Successfully updated the Organization",
    syncOrganizationMessage: "Successfully synced the Organization",
    deleteOrganizationMessage: "Successfully deleted the Organization",
    fetchOrganizationsMessage: "Successfully fetched the Organizations",

    addRepositoryRequests: "Successfully added the Repository Request",
    approveRepositoryRequest: "Successfully approved the Repository Request",
    fetchRepositoryRequestsMessage: "Successfully fetched the Repository Requests",
    rejectRepositoryRequest: "Successfully rejected the Repository Request",
    updateRepositoryRequest: "Successfully updated the Repository Request",

    fetchEmployees: "Successfully fetched the Employees",

    fetchPrivileges: "Successfully fetched Privileges",

    addTopicMessage: "Successfully added the Topic",
    updateTopicMessage: "Successfully updated the Topic",
    deleteTopicMessage: "Successfully deleted the Topic",
    fetchTopicsMessage: "Successfully fetched the Topics",

    fetchTeamsMessage: "Successfully fetched the Teams",

    fetchDefaultTeamsMessage: "Successfully fetched the Default Teams",
    addDefaultTeamMessage: "Successfully added the Default Team",
    updateDefaultTeamMessage: "Successfully updated the Default Team",
    deleteDefaultTeamMessage: "Successfully deleted the Default Team",

    syncedOrganizationMessage:
      "Visibility has been updated to Public due to Free plan restrictions.",

    setDefaultRepositoryAccessMessage: "Default repository access granted successfully.",
  },
  error: {
    addCommentMessage: "Unable to add the comment",
    fetchCommentsMessage: "failed to fetch comments",

    addLeadMessage: "Unable to add the Lead",
    updateLeadMessage: "Unable to update the Lead",
    deleteLeadMessage: "Unable to delete the Lead",
    fetchLeadsMessage: "Unable to retrieve list of Leads",

    addOrganizationMessage: "Unable to add the Organization",
    updateOrganizationMessage: "Unable to update the Organization",
    syncOrganizationMessage: "Unable to sync the Organization",
    deleteOrganizationMessage: "Unable to delete the Organization",
    fetchOrganizationsMessage: "Unable to retrieve list of Organizations",

    fetchOrganizationMessage: "Unable to retrieve Organization",

    addRepositoryRequests: "Unable to add the Repository Request",
    approveRepositoryRequest: "Unable to approve the Repository Request",
    fetchRepositoryRequestsMessage: "Unable to retrieve list of Repository Requests",
    rejectRepositoryRequest: "Unable to delete the Repository Request",
    updateRepositoryRequest: "Unable to update the Repository Request",

    fetchEmployees: "Unable to retrieve list of Employees",

    fetchPrivileges: "Failed to fetch Privileges",
    insufficientPrivileges: "Insufficient Privileges",

    addTopicMessage: "Unable to add the Topic",
    updateTopicMessage: "Unable to update the Topic",
    deleteTopicMessage: "Unable to delete the Topic",
    fetchTopicsMessage: "Unable to retrieve list of Topics",

    fetchTeamsMessage: "Error connecting to GitHub! Unable to retrieve list of Teams",

    fetchDefaultTeamsMessage: "Unable to retrieve list of Default Teams",
    addDefaultTeamMessage: "Unable to add the Default Team",
    updateDefaultTeamMessage: "Unable to update the Default Team",
    deleteDefaultTeamMessage: "Unable to delete the Default Team",

    fetchUserGuideMessage: "Unable to retrieve User Guide documents",
    fetchSecurityDashboardLinksMessage: "Unable to retrieve Security Dashboard links",

    githubConnectMessage: "Connection failed. Please try again.",
    githubUnverifiedMessage: "No verified WSO2 email found on your GitHub account.",
    setDefaultRepositoryAccessMessage: "Unable to grant default repository access. Please try again.",
  },
  warning: {},
};

export const JENKINS_JOB_TYPES = ["product-*", "carbon-*", "identity-*", "apim-*", "esb-*"];

export const BRANCH_PROTECTION_TYPES = {
  Default: "Default",
  Ballerina_library: "Bal Lib Repo",
};

export const APP_DESC = " Internal App Product Template.";

export const redirectUrl = "iapm-marketplace-redirect-url";

export const GITHUB_OAUTH_SCOPES: string[] = ["read:user", "user:email"];

export const RESULT_KEY = "gh_connect_result";
export const GITHUB_OAUTH_STATE_KEY = "gh_oauth_state";
export const STATE_EXPIRY_MS = 5 * 60 * 1000;
export const PENDING_OAUTH_CODE_KEY = "gh_pending_oauth_code";
