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

import { GithubOAuthConfig } from "@config/config";
import {
  GITHUB_OAUTH_STATE_KEY,
  RESULT_KEY,
  STATE_EXPIRY_MS,
  SnackMessage,
} from "@config/constant";
import { State } from "@root/src/types/types";
import { connectGitHub } from "@slices/githubOauthAppSlice/githubOauth";
import { useAppDispatch, useAppSelector } from "@slices/store";

interface ConnectResult {
  status: "verified" | "unverified" | "error";
  githubUserId?: string;
  githubUsername?: string;
  errorMessage?: string;
}

interface StoredState {
  state: string;
  createdAt: number;
}

const navigateWithResult = (result: ConnectResult) => {
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
  window.location.href = "/github/repository-access-requests";
};

export default function GitHubConnect() {
  const githubConnectState = useAppSelector((state) => state.githubConnect);
  const dispatch = useAppDispatch();

  const [storedResult, setStoredResult] = useState<ConnectResult | null>(() => {
    const raw = sessionStorage.getItem(RESULT_KEY);
    try {
      if (raw) {
        sessionStorage.removeItem(RESULT_KEY);
        return JSON.parse(raw) as ConnectResult;
      }
    } catch {
      sessionStorage.removeItem(RESULT_KEY);
    }
    return null;
  });

  const handleRedirect = () => {
    setStoredResult(null);
    const state = self.crypto.randomUUID();
    const stateObj: StoredState = { state, createdAt: Date.now() };
    sessionStorage.setItem(GITHUB_OAUTH_STATE_KEY, JSON.stringify(stateObj));
    const params = new URLSearchParams({
      client_id: GithubOAuthConfig.clientID,
      scope: (GithubOAuthConfig.scope || []).join(" "),
      state,
      redirect_uri: GithubOAuthConfig.githubAuthRedirectUrl,
    });
    window.location.href = `${GithubOAuthConfig.oauthAuthorizationBaseUrl}?${params.toString()}`;
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
      let storedObj: StoredState | null = null;
      try {
        if (rawStoredState) storedObj = JSON.parse(rawStoredState) as StoredState;
      } catch {
        // invalid JSON — treat as missing
      }

      // Validate expiry
      if (!storedObj || Date.now() - storedObj.createdAt > STATE_EXPIRY_MS) {
        sessionStorage.removeItem(GITHUB_OAUTH_STATE_KEY);
        navigateWithResult({
          status: "error",
          errorMessage: "Session expired: the connection request took too long. Please try again.",
        });
        return;
      }

      // Validate CSRF
      if (urlState !== storedObj.state) {
        sessionStorage.removeItem(GITHUB_OAUTH_STATE_KEY);
        navigateWithResult({
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
        navigateWithResult({
          status: "verified",
          githubUserId: result.payload.githubUserId,
          githubUsername: result.payload.githubUsername,
        });
      } else if (connectGitHub.fulfilled.match(result)) {
        navigateWithResult({
          status: "unverified",
          errorMessage: SnackMessage.error.githubUnverifiedMessage,
        });
      } else {
        navigateWithResult({
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
        Before connecting, ensure your employee email is added and verified on your GitHub account.
      </Typography>
      <Button onClick={handleRedirect}>Connect with GitHub</Button>
    </Box>
  );
}
