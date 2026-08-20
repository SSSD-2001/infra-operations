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
import { useAuthContext } from "@asgardeo/auth-react";
import { GitHub as GitHubIcon } from "@mui/icons-material";
import { Box, Button, Chip, CircularProgress, Typography, alpha, useTheme } from "@mui/material";
import { useEffect, useState } from "react";

import { GITHUB_OAUTH_STATE_KEY, SnackMessage } from "@config/constant";
import { useConfirmationModalContext } from "@root/src/context";
import { Role, UserState, setUserAuthData } from "@root/src/slices/authSlice/auth";
import { ConfirmationType } from "@root/src/types/types";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import {
  connectGitHub,
  fetchDefaultRepositoryAccess,
  setDefaultRepositoryAccess,
} from "@slices/githubOauthAppSlice/githubOauth";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { getUserInfo } from "@slices/userSlice/user";
import { APIService } from "@utils/apiService";
import {
  consumePendingOAuthCode,
  GitHubConnectResult,
  consumeStoredGitHubConnectResult,
  resolveGitHubConnectionStatus,
  startGitHubOAuth,
} from "@utils/githubOAuth";


interface GreetingProps {
  user: UserState;
  roles: Role[];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Greeting({ user, roles }: GreetingProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const jwtGithubUserId = useAppSelector((state) => state.auth.decodedIdToken?.githubUserId);
  
  const dialogContext = useConfirmationModalContext();
  const handleConnectClick = () => {
    dialogContext.showConfirmation(
      "Connect with GitHub",
      (
        <>
          <Typography component="span" display="block" variant="body2">
            Before connecting,{" "}
            <strong>ensure your company email is added and verified</strong> on
            your GitHub account.
          </Typography>
          <Typography component="span" display="block" variant="body2" sx={{ mt: 1 }}>
            Do not close this tab while the page loads.
          </Typography>
        </>
      ),
      ConfirmationType.accept,
      () => startGitHubOAuth("/"),
      "Continue",
      "Cancel",
    );
  };

  const accent = theme.palette.primary.main;
  const accentBg = alpha(accent, 0.1);

  const { refreshAccessToken, getIDToken, getDecodedIDToken, getBasicUserInfo } = useAuthContext();

  const [connectResult, setConnectResult] = useState<GitHubConnectResult | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [isPostConnectLoading, setIsPostConnectLoading] = useState(false);
  const [localUsername, setLocalUsername] = useState<string | undefined>();
  const [isVerifiedLocally, setIsVerifiedLocally] = useState(false);

  useEffect(() => {
    const code = consumePendingOAuthCode();
    setPendingCode(code);
    setConnectResult(consumeStoredGitHubConnectResult());
    if (code) setIsPostConnectLoading(true);
  }, []);

  useEffect(() => {
    if (!pendingCode) return;

    const run = async () => {
      setIsPostConnectLoading(true);
      try {
        sessionStorage.removeItem(GITHUB_OAUTH_STATE_KEY);
        const result = await dispatch(connectGitHub({ code: pendingCode }));

        if (connectGitHub.fulfilled.match(result) && result.payload.status === "verified") {
          setIsVerifiedLocally(true);
          try {
            await refreshAccessToken();
          } catch (refreshError) {
            console.error("Failed to refresh the access token after GitHub connect", refreshError);
          }
          const [idToken, decodedIdToken, basicUserInfo] = await Promise.all([
            getIDToken(),
            getDecodedIDToken(),
            getBasicUserInfo(),
          ]);
          APIService.updateIdToken(idToken);
          dispatch(setUserAuthData({ userInfo: basicUserInfo, decodedIdToken }));
        
          if (result.payload.githubUsername) {
            setLocalUsername(result.payload.githubUsername);
          }
          setIsVerifiedLocally(true);
          setIsPostConnectLoading(false);
          await dispatch(getUserInfo());
        
          const grantResult = await dispatch(setDefaultRepositoryAccess());
          if (setDefaultRepositoryAccess.fulfilled.match(grantResult)) {
            await dispatch(fetchDefaultRepositoryAccess());
          }
        } else if (connectGitHub.fulfilled.match(result)) {
          dispatch(
            enqueueSnackbarMessage({
              message: SnackMessage.error.githubUnverifiedMessage,
              type: "error",
            }),
          );
        } else if (
          connectGitHub.rejected.match(result) &&
          result.payload === "An unexpected error occurred"
        ) {
          dispatch(
            enqueueSnackbarMessage({
              message: SnackMessage.error.githubConnectMessage,
              type: "error",
            }),
          );
        }
      } finally {
        setIsPostConnectLoading(false);
      }
    };

    void run();
  }, [pendingCode, dispatch]);

  useEffect(() => {
    if (!connectResult || pendingCode) return;
    if (connectResult.status === "verified") {
      setIsPostConnectLoading(true);
      void dispatch(getUserInfo()).finally(() => setIsPostConnectLoading(false));
    } else {
      dispatch(
        enqueueSnackbarMessage({
          message: connectResult.errorMessage || SnackMessage.error.githubConnectMessage,
          type: "error",
        }),
      );
    }
  }, [connectResult, pendingCode, dispatch]);

  const firstName = user.userInfo?.firstName ?? "there";
  const topRole = roles.includes(Role.ADMIN)
    ? Role.ADMIN.toLowerCase()
    : roles.includes(Role.APPROVER)
      ? Role.APPROVER.toLowerCase()
      : Role.EMPLOYEE.toLowerCase();

  const { isConnected: resolvedConnected, githubUsername } = resolveGitHubConnectionStatus(
    connectResult,
    {
      jwtGithubUserId,
      githubUsername: localUsername ?? user.userInfo?.githubUsername,
    },
  );
  const isGithubConnected = resolvedConnected || isVerifiedLocally;

  const chipSx = {
    display: "inline-flex",
    alignItems: "center",
    height: "fit-content",
    width: "fit-content",
    borderRadius: "20px",
    fontSize: 11,
    fontWeight: 500,
    fontFamily: "monospace",
    background: accentBg,
    color: accent,
    border: `1px solid ${alpha(accent, 0.2)}`,
    whiteSpace: "nowrap",
    flexShrink: 0,
    "& .MuiChip-label": {
      px: 1.25,
      py: 0.5,
    },
  };

  return (
    <Box
      sx={{
        mb: 4,
      }}
    >
      <Typography
        fontSize={11}
        fontWeight={500}
        letterSpacing={"0.1em"}
        textTransform={"uppercase"}
        color={theme.palette.customText.primary.p3.active}
        mb={0.5}
        fontFamily={"monospace"}
      >
        WSO2 Infra Portal
      </Typography>
      <Typography
        letterSpacing={0.5}
        fontWeight={600}
        fontSize={26}
        lineHeight={1.2}
        color={theme.palette.text.primary}
      >
        {getGreeting()},{" "}
        <Typography
          component="span"
          letterSpacing={0.5}
          fontWeight={600}
          fontSize={26}
          lineHeight={1.2}
          color={accent}
        >
          {firstName}
        </Typography>
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75, flexWrap: "wrap" }}>
        <Chip
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: accent, mb: 0.1 }} />
              {topRole}
            </Box>
          }
          sx={chipSx}
        />

        {isGithubConnected ? (
          <Chip
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <GitHubIcon sx={{ fontSize: 13 }} />
                {githubUsername ? `@${githubUsername}` : "Connected"}
              </Box>
            }
            sx={{
              ...chipSx,
              background: alpha(theme.palette.success.main, 0.12),
              color: theme.palette.success.dark,
              border: `1px solid ${alpha(theme.palette.success.main, 0.35)}`,
            }}
          />
        ) : (
          <Chip
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <GitHubIcon sx={{ fontSize: 13 }} />
                Not Connected
              </Box>
            }
            sx={{
              ...chipSx,
              background: alpha(theme.palette.neutral["1200"] ?? theme.palette.grey[600], 0.12),
              color: theme.palette.customText.primary.p3.active,
              border: `1px solid ${alpha(theme.palette.grey[500], 0.35)}`,
            }}
          />
        )}
      </Box>

      <Typography fontSize={15} color={theme.palette.customText.primary.p3.active} mt={0.6}>
        Manage your infrastructure requests and access from one place.
      </Typography>

      {!isGithubConnected && (
        <Button
          variant="contained"
          color="primary"
          startIcon={
            isPostConnectLoading ? (
              <CircularProgress size={14} thickness={5} sx={{ color: "#fff" }} />
            ) : (
              <GitHubIcon sx={{ fontSize: 16 }} />
            )
          }
          disabled={isPostConnectLoading}
          onClick={handleConnectClick}
          sx={{
            mt: 1,
            textTransform: "none",
            borderRadius: 1,
            fontSize: 13,
            fontWeight: 500,
            color: "#fff",
            "&.Mui-disabled": {
              color: "#fff",
              backgroundColor: (theme) => theme.palette.primary.main,
              opacity: 0.9,
            },
          }}
        >
          {isPostConnectLoading ? "Connecting..." : "Connect with GitHub"}
        </Button>
      )}
      </Box>
    );
  }