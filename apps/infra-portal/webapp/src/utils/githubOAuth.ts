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
import { GithubOAuthConfig } from "@config/config";
import type { NavigateFunction } from "react-router-dom";

import { GITHUB_OAUTH_STATE_KEY, RESULT_KEY, PENDING_OAUTH_CODE_KEY } from "@config/constant";

export const stashPendingOAuthCode = (code: string): void => {
  sessionStorage.setItem(PENDING_OAUTH_CODE_KEY, code);
};

export const consumePendingOAuthCode = (): string | null => {
  const code = sessionStorage.getItem(PENDING_OAUTH_CODE_KEY);
  if (code) sessionStorage.removeItem(PENDING_OAUTH_CODE_KEY);
  return code;
};

export const DEFAULT_GITHUB_OAUTH_RETURN_PATH = "/";
export interface GitHubOAuthStoredState {
  state: string;
  createdAt: number;
  returnPath: string;
}

export interface GitHubConnectResult {
  status: "verified" | "unverified" | "error";
  githubUserId?: string;
  githubUsername?: string;
  errorMessage?: string;
}

export const navigateWithGitHubConnectResult = (
  returnPath: string,
  result: GitHubConnectResult,
  navigate: NavigateFunction,
): void => {
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
  navigate(returnPath, { replace: true });
};

export interface GitHubConnectionStatus {
  isConnected: boolean;
  githubUsername?: string;
}

/** Derives connected state and username from a stored OAuth result, JWT claim, and user-info username. */
export const resolveGitHubConnectionStatus = (
  storedResult: GitHubConnectResult | null | undefined,
  options?: {
    jwtGithubUserId?: string | null;
    githubUsername?: string | null;
  } | null,
): GitHubConnectionStatus => {
  const isConnected =
    storedResult?.status === "verified" || Boolean(options?.jwtGithubUserId);
  const githubUsername =
    (storedResult?.status === "verified" ? storedResult.githubUsername : undefined) ??
    options?.githubUsername ??
    undefined;
  return { isConnected, githubUsername: githubUsername ?? undefined };
};

export const startGitHubOAuth = (returnPath: string = DEFAULT_GITHUB_OAUTH_RETURN_PATH): void => {
  const state = self.crypto.randomUUID();
  const stateObj: GitHubOAuthStoredState = { state, createdAt: Date.now(), returnPath };
  sessionStorage.setItem(GITHUB_OAUTH_STATE_KEY, JSON.stringify(stateObj));

  const params = new URLSearchParams({
    client_id: GithubOAuthConfig.clientID,
    scope: (GithubOAuthConfig.scope || []).join(" "),
    state,
    redirect_uri: GithubOAuthConfig.githubAuthRedirectUrl,
        prompt: "select_account",
  });
  window.location.href = `${GithubOAuthConfig.oauthAuthorizationBaseUrl}?${params.toString()}`;
};

export const consumeStoredGitHubConnectResult = (): GitHubConnectResult | null => {
  const raw = sessionStorage.getItem(RESULT_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(RESULT_KEY);
  try {
    return JSON.parse(raw) as GitHubConnectResult;
  } catch {
    return null;
  }
};
