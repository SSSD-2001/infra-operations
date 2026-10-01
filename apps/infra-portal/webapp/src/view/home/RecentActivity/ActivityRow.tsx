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
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Check, Clock, X } from "lucide-react";

import {
  RepositoryRequest,
  RequestApprovalState,
} from "@slices/repositoryRequestSlice/repositoryRequest";

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

interface ActivityRowProps {
  req: RepositoryRequest;
  onClick: () => void;
  isLast?: boolean;
}

export default function ActivityRow({ req, onClick, isLast }: ActivityRowProps) {
  const theme = useTheme();

  const isPending = req.state === RequestApprovalState.PENDING;
  const isApproved = req.state === RequestApprovalState.APPROVED;

  const statusBg = isPending
    ? alpha(theme.palette.warning.main, 0.12)
    : isApproved
      ? alpha(theme.palette.success.main, 0.12)
      : alpha(theme.palette.error.main, 0.08);

  const statusColor = isPending
    ? theme.palette.warning.main
    : isApproved
      ? theme.palette.success.main
      : theme.palette.error.main;

  const StatusIcon = isPending ? Clock : isApproved ? Check : X;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2.25,
        py: 1.5,
        borderBottom: isLast ? "none" : `1px solid ${theme.palette.divider}`,
        cursor: "pointer",
        transition: "background 0.18s ease",
        "&:hover": {
          background: theme.palette.action.hover,
          "& .act-chevron": { opacity: 1 },
        },
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "7px",
          background: statusBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <StatusIcon size={11} color={statusColor} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 500,
            color: theme.palette.customText.primary.p1.active,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "monospace",
          }}
        >
          {req.repoName}
        </Typography>
        <Typography
          sx={{ fontSize: 11, color: theme.palette.customText.primary.p3.active, mt: 0.1 }}
        >
          {req.organizationName} · {req.repoType} · {formatRelativeTime(req.updatedAt)}
        </Typography>
      </Box>
      <Box
        sx={{
          fontSize: 10,
          fontWeight: 500,
          px: 1,
          py: 0.375,
          borderRadius: "5px",
          fontFamily: "monospace",
          flexShrink: 0,
          background: statusBg,
          color: statusColor,
        }}
      >
        {req.state}
      </Box>
      <Typography
        className="act-chevron"
        sx={{
          fontSize: 13,
          color: theme.palette.customText.primary.p3.active,
          opacity: 0,
          transition: "opacity 0.18s",
        }}
      >
        ›
      </Typography>
    </Box>
  );
}
