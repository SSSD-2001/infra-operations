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
import { Box, IconButton, Tooltip, Typography, alpha, useTheme } from "@mui/material";
import { Pencil, Trash2 } from "lucide-react";

import { DefaultTeam } from "@root/src/slices/defaultTeamSlice/defaultTeams";

function usePermissionColor(level: string) {
  const theme = useTheme();
  switch (level) {
    case "push":
      return { color: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.12) };
    case "pull":
      return { color: theme.palette.info.main, bg: alpha(theme.palette.info.main, 0.12) };
    case "triage":
      return {
        color: theme.palette.warning.dark,
        bg: alpha(theme.palette.warning.dark, 0.12),
      };
    case "admin":
      return { color: theme.palette.error.main, bg: alpha(theme.palette.error.main, 0.12) };
    default:
      return { color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.12) };
  }
}

export function TeamRow({
  team,
  isLast,
  onEdit,
  gridTemplateColumns,
  onDelete,
}: {
  team: DefaultTeam;
  isLast: boolean;
  gridTemplateColumns: string;
  onEdit: (team: DefaultTeam) => void;
  onDelete: (teamId: number, teamName: string) => void;
}) {
  const theme = useTheme();
  const { color, bg } = usePermissionColor(team.permissionLevel);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: gridTemplateColumns,
        alignItems: "center",
        px: 1.75,
        py: 1.1,
        borderBottom: isLast ? "none" : `1px solid ${theme.palette.divider}`,
        transition: "background 0.15s ease",
        "&:hover": { background: theme.palette.action.hover },
      }}
    >
      {/* ID */}
      <Typography
        sx={{
          fontSize: 10,
          fontFamily: "monospace",
          color: theme.palette.customText.primary.p3.active,
        }}
      >
        #{team.teamId}
      </Typography>

      {/* Team name */}
      <Typography
        sx={{
          fontSize: 12,
          fontFamily: "monospace",
          color: theme.palette.customText.primary.p1.active,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {team.teamName}
      </Typography>

      {/* Permission pill */}
      <Box
        sx={{
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "monospace",
          px: 0.75,
          py: 0.2,
          borderRadius: "4px",
          background: bg,
          color,
          width: "fit-content",
        }}
      >
        {team.permissionLevel}
      </Box>

      {/* Actions */}
      <Box sx={{ display: "flex", gap: 0.375, justifyContent: "center" }}>
        <Tooltip title="Edit" arrow>
          <IconButton
            size="small"
            onClick={() => onEdit(team)}
            sx={{
              width: 26,
              height: 26,
              borderRadius: "6px",
              color: theme.palette.customText.primary.p3.active,
              "&:hover": {
                color: theme.palette.warning.main,
                background: alpha(theme.palette.warning.main, 0.1),
              },
            }}
          >
            <Pencil size={13} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete" arrow>
          <IconButton
            size="small"
            onClick={() => onDelete(team.teamId, team.teamName)}
            sx={{
              width: 26,
              height: 26,
              borderRadius: "6px",
              color: theme.palette.customText.primary.p3.active,
              "&:hover": {
                color: theme.palette.error.main,
                background: alpha(theme.palette.error.main, 0.1),
              },
            }}
          >
            <Trash2 size={13} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
