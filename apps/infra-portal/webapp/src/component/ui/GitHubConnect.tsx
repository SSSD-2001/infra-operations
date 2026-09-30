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

import {
  GITHUB_OAUTH_STATE_KEY,
  OAUTH_CALLBACK_STATE_KEY,
  PENDING_OAUTH_CODE_KEY,
  STATE_EXPIRY_MS,
} from "@config/constant";
import {
  DEFAULT_GITHUB_OAUTH_RETURN_PATH,
  GitHubConnectResult,
  GitHubOAuthStoredState,
  consumeStoredGitHubConnectResult,
  navigateWithGitHubConnectResult,
  startGitHubOAuth,
  stashPendingOAuthCode,
} from "@utils/githubOAuth";

export default function GitHubConnect() {
  const navigate = useNavigate();

  const [storedResult, setStoredResult] = useState<GitHubConnectResult | null>(null);

  // The read clears session storage, so it must run after render rather than during it.
  useEffect(() => {
    setStoredResult(consumeStoredGitHubConnectResult());
  }, []);

  const handleRedirect = () => {
    setStoredResult(null);
    startGitHubOAuth(DEFAULT_GITHUB_OAUTH_RETURN_PATH);
  };

  useEffect(() => {
    const clearCallbackStorage = () => {
      sessionStorage.removeItem(GITHUB_OAUTH_STATE_KEY);
      sessionStorage.removeItem(PENDING_OAUTH_CODE_KEY);
      sessionStorage.removeItem(OAUTH_CALLBACK_STATE_KEY);
    };

    const params = new URLSearchParams(window.location.search);
    const code = sessionStorage.getItem(PENDING_OAUTH_CODE_KEY) || params.get("code");
    const urlState = sessionStorage.getItem(OAUTH_CALLBACK_STATE_KEY) || params.get("state");

    if (!code) return;

    const rawStoredState = sessionStorage.getItem(GITHUB_OAUTH_STATE_KEY);
    let storedObj: GitHubOAuthStoredState | null = null;
    try {
      if (rawStoredState) storedObj = JSON.parse(rawStoredState) as GitHubOAuthStoredState;
    } catch {
      storedObj = null;
    }

    const returnPath = storedObj?.returnPath || "/";

    // A code without a matching state cannot be trusted, so never exchange it.
    if (!urlState || !storedObj) {
      clearCallbackStorage();
      navigateWithGitHubConnectResult(
        returnPath,
        {
          status: "error",
          errorMessage:
            "Security validation failed: authentication state missing. Please try again.",
        },
        navigate,
      );
      return;
    }

    if (Date.now() - storedObj.createdAt > STATE_EXPIRY_MS) {
      clearCallbackStorage();
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
      clearCallbackStorage();
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

    stashPendingOAuthCode(code);
    sessionStorage.removeItem(OAUTH_CALLBACK_STATE_KEY);
    navigate(returnPath, { replace: true });
  }, [navigate]);

  if (storedResult && storedResult.status !== "verified") {
    return (
      <Box>
        <Typography color="error.main">{storedResult.errorMessage}</Typography>
        <Button onClick={handleRedirect}>Try Again</Button>
      </Box>
    );
  }

  return null;
}