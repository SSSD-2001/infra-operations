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
import { Box, Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { GITHUB_OAUTH_STATE_KEY, STATE_EXPIRY_MS } from "@config/constant";
import { useAppSelector } from "@slices/store";
import {
  DEFAULT_GITHUB_OAUTH_RETURN_PATH,
  GitHubConnectResult,
  GitHubOAuthStoredState,
  consumeStoredGitHubConnectResult,
  navigateWithGitHubConnectResult,
  resolveGitHubConnectionStatus,
  startGitHubOAuth,
  stashPendingOAuthCode,
} from "@utils/githubOAuth";

export default function GitHubConnect() {
  const userInfo = useAppSelector((state) => state.user.userInfo);
  const jwtGithubUserId = useAppSelector((state) => state.auth.decodedIdToken?.githubUserId);
  const navigate = useNavigate();

  const [storedResult, setStoredResult] = useState<GitHubConnectResult | null>(() =>
    consumeStoredGitHubConnectResult(),
  );

  const handleRedirect = () => {
    setStoredResult(null);
    startGitHubOAuth(DEFAULT_GITHUB_OAUTH_RETURN_PATH);
  };

  useEffect(() => {
    const code =
      sessionStorage.getItem("gh_pending_oauth_code") ||
      new URLSearchParams(window.location.search).get("code");
    const urlState =
      sessionStorage.getItem("gh_oauth_callback_state") ||
      new URLSearchParams(window.location.search).get("state");
  
    // Already handled / nothing to do — still send user home if code is pending
    if (!code) return;
  
    const rawStoredState = sessionStorage.getItem(GITHUB_OAUTH_STATE_KEY);
    let storedObj: GitHubOAuthStoredState | null = null;
    try {
      if (rawStoredState) storedObj = JSON.parse(rawStoredState) as GitHubOAuthStoredState;
    } catch {
      // ignore
    }
  
    const returnPath = storedObj?.returnPath || "/"; // prefer home for this flow
  
    // Validate only when we still have the callback state (first run)
    if (urlState) {
      if (!storedObj || Date.now() - storedObj.createdAt > STATE_EXPIRY_MS) {
        sessionStorage.removeItem(GITHUB_OAUTH_STATE_KEY);
        sessionStorage.removeItem("gh_pending_oauth_code");
        sessionStorage.removeItem("gh_oauth_callback_state");
        navigateWithGitHubConnectResult(
          returnPath,
          {
            status: "error",
            errorMessage: "Session expired: the connection request took too long. Please try again.",
          },
          navigate,
        );
        return;
      }
  
      if (urlState !== storedObj.state) {
        sessionStorage.removeItem(GITHUB_OAUTH_STATE_KEY);
        sessionStorage.removeItem("gh_pending_oauth_code");
        sessionStorage.removeItem("gh_oauth_callback_state");
        navigateWithGitHubConnectResult(
          returnPath,
          {
            status: "error",
            errorMessage:
              "Security validation failed: authentication state mismatch. Please try again.",
          },
          navigate,
        );
        return;
      }
    }
  
    stashPendingOAuthCode(code);
    sessionStorage.removeItem("gh_oauth_callback_state");
    navigate(returnPath, { replace: true });
  }, [navigate]);

  const { isConnected } = resolveGitHubConnectionStatus(storedResult, {
    jwtGithubUserId,
    githubUsername: userInfo?.githubUsername,
  });

  if (storedResult && storedResult.status !== "verified") {
    return (
      <Box>
        <Typography color="error.main">{storedResult.errorMessage}</Typography>
        <Button onClick={handleRedirect}>Try Again</Button>
      </Box>
    );
  }
}