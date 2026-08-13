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
import { BaseURLAuthClientConfig } from "@asgardeo/auth-react";

import { GITHUB_OAUTH_SCOPES } from "./constant";

declare global {
  interface Window {
    config: {
      APP_NAME: string;
      APP_DOMAIN: string;
      ASGARDEO_BASE_URL: string;
      ASGARDEO_CLIENT_ID: string;
      ASGARDEO_REVOKE_ENDPOINT: string;
      AUTH_SIGN_IN_REDIRECT_URL: string;
      AUTH_SIGN_OUT_REDIRECT_URL: string;
      REACT_APP_BACKEND_BASE_URL: string;
      GITHUB_OAUTH_CLIENT_ID: string;
      GITHUB_OAUTH_REDIRECT_URL: string;
      GITHUB_OAUTH_AUTHORIZE_URL: string;
    };
  }
}

interface GitHubOAuthConfig {
  clientID: string;
  oauthAuthorizationBaseUrl: string;
  githubAuthRedirectUrl: string;
  scope: string[];
}

export const AsgardeoConfig: BaseURLAuthClientConfig = {
  scope: ["openid", "profile", "email", "groups"],
  baseUrl: window.config?.ASGARDEO_BASE_URL ?? "",
  clientID: window.config?.ASGARDEO_CLIENT_ID ?? "",
  signInRedirectURL: window.config?.AUTH_SIGN_IN_REDIRECT_URL ?? "",
  signOutRedirectURL: window.config?.AUTH_SIGN_OUT_REDIRECT_URL ?? "",
};

export const GithubOAuthConfig: GitHubOAuthConfig = {
  scope: GITHUB_OAUTH_SCOPES,
  oauthAuthorizationBaseUrl: window.config?.GITHUB_OAUTH_AUTHORIZE_URL ?? "",
  clientID: window.config?.GITHUB_OAUTH_CLIENT_ID ?? "",
  githubAuthRedirectUrl: window.config?.GITHUB_OAUTH_REDIRECT_URL ?? "",
};

export const APP_NAME = window.config?.APP_NAME ?? "";
export const APP_DOMAIN = window.config?.APP_DOMAIN ?? "";
export const ServiceBaseUrl = window.config?.REACT_APP_BACKEND_BASE_URL ?? "";

// Repository creation request form limits and feature flags
export const GITHUB_REPO_NAME_MAX = 100;
export const GITHUB_DESCRIPTION_MAX = 350;
export const GITHUB_TOPIC_MAX_COUNT = 20;
export const GITHUB_TOPIC_MAX_LENGTH = 50;
export const ALLOWED_URL_PROTOCOLS = ["http:", "https:"];
// CI/CD step is gated until the feature ships.
export const CICD_CONFIGURATION_ENABLE = false;

export const AppConfig = {
  serviceUrls: {
    userInfo: ServiceBaseUrl + "/user-info",
    employees: ServiceBaseUrl + "/employees",
    repositoryRequests: ServiceBaseUrl + "/repository-requests",
    teams: ServiceBaseUrl + "/teams",
    topics: ServiceBaseUrl + "/topics",
    leads: ServiceBaseUrl + "/leads",
    organizations: ServiceBaseUrl + "/organizations",
    comments: (requestId: number) => `${ServiceBaseUrl}/repository-requests/${requestId}/comments`,
    defaultTeams: ServiceBaseUrl + "/default-teams",

    githubVerifyAndPersistUser: ServiceBaseUrl + "/github/verify-and-persist-user",
    setDefaultRepositoryAccess: ServiceBaseUrl + "/set-default-repository-access",
    defaultRepositoryAccess: ServiceBaseUrl + "/default-repository-access",

    securityDashboardLinks: ServiceBaseUrl + "/security-dashboard-links",
  },
  markdownUrls: {
    overview: "/doc/userGuide/Overview.md",
    submitRequest: "/doc/userGuide/SubmitRequest.md",
    requestHistory: "/doc/userGuide/RequestHistory.md",
    adminGuide: "/doc/userGuide/AdminGuide.md",
    additionalDetails: "/doc/userGuide/AdditionalDetails.md",
    troubleshoot: "/doc/userGuide/Troubleshoot.md",
  },
};
