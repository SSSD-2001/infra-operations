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
import { Box, Button, CircularProgress, Typography } from "@mui/material";

import { useEffect, useState } from "react";

import { GITHUB_OAUTH_STATE_KEY, STATE_EXPIRY_MS, SnackMessage } from "@config/constant";
import { State } from "@root/src/types/types";
import { connectGitHub } from "@slices/githubOauthAppSlice/githubOauth";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  DEFAULT_GITHUB_OAUTH_RETURN_PATH,
  GitHubConnectResult,
  GitHubOAuthStoredState,
  consumeStoredGitHubConnectResult,
  navigateWithGitHubConnectResult,
  startGitHubOAuth,
} from "@utils/githubOAuth";

export default function GitHubConnect() {
  const githubConnectState = useAppSelector((state) => state.githubConnect);
  const dispatch = useAppDispatch();

  const [storedResult, setStoredResult] = useState<GitHubConnectResult | null>(() =>
    consumeStoredGitHubConnectResult(),
  );

  const handleRedirect = () => {
    setStoredResult(null);
    startGitHubOAuth(DEFAULT_GITHUB_OAUTH_RETURN_PATH);
  };

  // Runs once on mount — reads directly from window.location to avoid React Router reactivity issues.
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const urlState = params.get("state");

      if (!code || !urlState) return;

      // Parse stored state
      const rawStoredState = sessionStorage.getItem(GITHUB_OAUTH_STATE_KEY);
      let storedObj: GitHubOAuthStoredState | null = null;
      try {
        if (rawStoredState) storedObj = JSON.parse(rawStoredState) as GitHubOAuthStoredState;
      } catch {
        // invalid JSON — treat as missing
      }

      // Fall back to the access-requests page if the return path was never recorded.
      const returnPath = storedObj?.returnPath || DEFAULT_GITHUB_OAUTH_RETURN_PATH;

      // Validate expiry
      if (!storedObj || Date.now() - storedObj.createdAt > STATE_EXPIRY_MS) {
        sessionStorage.removeItem(GITHUB_OAUTH_STATE_KEY);
        navigateWithGitHubConnectResult(returnPath, {
          status: "error",
          errorMessage: "Session expired: the connection request took too long. Please try again.",
        });
        return;
      }

      // Validate CSRF
      if (urlState !== storedObj.state) {
        sessionStorage.removeItem(GITHUB_OAUTH_STATE_KEY);
        navigateWithGitHubConnectResult(returnPath, {
          status: "error",
          errorMessage:
            "Security validation failed: authentication state mismatch. Please try again.",
        });
        return;
      }

      // Nonce consumed — remove before dispatching
      sessionStorage.removeItem(GITHUB_OAUTH_STATE_KEY);

      // Await the thunk so we read the settled result, not stale Redux state
      const result = await dispatch(connectGitHub({ code }));

      if (connectGitHub.fulfilled.match(result) && result.payload.status === "verified") {
        navigateWithGitHubConnectResult(returnPath, {
          status: "verified",
          githubUserId: result.payload.githubUserId,
          githubUsername: result.payload.githubUsername,
        });
      } else if (connectGitHub.fulfilled.match(result)) {
        navigateWithGitHubConnectResult(returnPath, {
          status: "unverified",
          errorMessage: SnackMessage.error.githubUnverifiedMessage,
        });
      } else {
        navigateWithGitHubConnectResult(returnPath, {
          status: "error",
          errorMessage: SnackMessage.error.githubConnectMessage,
        });
      }
    };

    void handleCallback();
  }, [dispatch]);

  // Show spinner while any async operation is in flight or settling (pre-navigation flash guard)
  if (githubConnectState.state !== State.idle && !storedResult) return <CircularProgress />;

  if (storedResult) {
    if (storedResult.status === "verified") {
      return (
        <Typography color="success.main">Connected as @{storedResult.githubUsername}</Typography>
      );
    }
    return (
      <Box>
        <Typography color="error.main">{storedResult.errorMessage}</Typography>
        <Button onClick={handleRedirect}>Try Again</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2">
        Before connecting, ensure your company email is added and verified on your GitHub account.
      </Typography>
      <Button
        variant="contained"
        color="success"
        onClick={handleRedirect}
        sx={{ mt: 1 }}
      >
        Connect with GitHub
      </Button>
    </Box>
  );
}
