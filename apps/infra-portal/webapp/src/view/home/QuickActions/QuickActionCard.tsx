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
import { useTheme } from "@mui/material/styles";

import React from "react";

interface QuickActionCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  subtitle: string;
  onClick: () => void;
}

export default function QuickActionCard({
  icon,
  iconBg,
  iconColor,
  label,
  subtitle,
  onClick,
}: QuickActionCardProps) {
  const theme = useTheme();
  return (
    <Box
      onClick={onClick}
      sx={{
        background:
          theme.palette.mode === "dark"
            ? theme.palette.surface.primary.active
            : theme.palette.neutral["white"],
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "14px",
        p: 2,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        transition: "border-color 0.18s, box-shadow 0.18s, transform 0.18s",
        "&:hover": {
          boxShadow: theme.shadows[1],
          transform: "translateY(-1px)",
          "& .qa-arrow": { transform: "translateX(3px)", color: theme.palette.primary.main },
        },
        "&:active": { transform: "translateY(0)" },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "9px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: iconBg,
          color: iconColor,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 500,
            color: theme.palette.customText.primary.p1.active,
            lineHeight: 1.3,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{ fontSize: 11, color: theme.palette.customText.primary.p3.active, mt: 0.25 }}
        >
          {subtitle}
        </Typography>
      </Box>
      <Typography
        className="qa-arrow"
        sx={{
          fontSize: 14,
          color: theme.palette.customText.primary.p3.active,
          mt: "auto",
          transition: "transform 0.18s, color 0.18s",
        }}
      >
        →
      </Typography>
    </Box>
  );
}
