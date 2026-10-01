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
import { Box, Typography, alpha, useTheme } from "@mui/material";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Role } from "@root/src/slices/authSlice/auth";
import { RequestApprovalState } from "@root/src/slices/repositoryRequestSlice/repositoryRequest";
import { RootState, useAppSelector } from "@root/src/slices/store";

export default function PendingAlertBanner() {
  const navigate = useNavigate();
  const theme = useTheme();
  const auth = useAppSelector((state: RootState) => state.auth);
  const repositoryRequestState = useAppSelector((state: RootState) => state.repositoryRequest);
  const amberColor = theme.palette.warning.main;
  const amberBg = alpha(amberColor, 0.1);
  const allRequests = repositoryRequestState.repositoryRequests.repositoryRequests;
  const pendingCount = repositoryRequestState.repositoryRequests.pendingCount;

  const pendingRepoNames = allRequests
    .filter((r) => r.state === RequestApprovalState.PENDING)
    .slice(0, 2)
    .map((r) => r.repoName);
  if (pendingCount > 0 && auth.roles.includes(Role.APPROVER)) {
    return (
      <Box
        onClick={() => navigate("/repository-requests")}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.5,
          background: amberBg,
          border: `1px solid ${alpha(amberColor, 0.15)}`,
          borderRadius: "14px",
          mb: 4,
          cursor: "pointer",
          transition: "opacity 0.18s ease",
          "&:hover": { opacity: 0.82 },
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "8px",
            background: alpha(amberColor, 0.12),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Clock size={14} color={amberColor} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.text.primary }}>
            {pendingCount} request{pendingCount !== 1 ? "s" : ""} awaiting your attention
          </Typography>
          {pendingRepoNames.length > 0 && (
            <Typography
              sx={{ fontSize: 12, color: theme.palette.customText.primary.p3.active, mt: 0.1 }}
            >
              {pendingRepoNames.join(" , ")}
              {pendingCount > 2 ? ` and ${pendingCount - 2} more` : " pending review"}
            </Typography>
          )}
        </Box>
        <Typography sx={{ fontSize: 12, color: amberColor, fontWeight: 500, whiteSpace: "nowrap" }}>
          View all
        </Typography>
      </Box>
    );
  } else {
    return null;
  }
}
