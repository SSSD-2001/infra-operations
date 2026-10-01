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

import { Tag } from "@root/src/types/types";

interface ServiceRowProps {
  dotColor: string;
  label: string;
  tag: Tag;
  onClick: () => void;
  isLast?: boolean;
}

export default function ServiceRow({ dotColor, label, tag, onClick, isLast }: ServiceRowProps) {
  const theme = useTheme();
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 2.25,
        py: 1.1,
        cursor: "pointer",
        borderBottom: isLast ? "none" : `1px solid ${theme.palette.divider}`,
        transition: "background 0.18s ease",
        "&:hover": {
          background: theme.palette.action.hover,
          "& .row-chevron": { opacity: 1, transform: "translateX(0)" },
        },
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: dotColor, flexShrink: 0 }} />
      <Typography
        sx={{
          fontSize: 12,
          color: theme.palette.customText.primary.p3.active,
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          fontSize: 10,
          fontWeight: 500,
          px: 0.875,
          py: 0.25,
          borderRadius: "4px",
          fontFamily: "monospace",
          flexShrink: 0,
          background: tag.tagBackground,
          color: tag.tagColor,
        }}
      >
        {tag.tagName}
      </Box>
      <Typography
        className="row-chevron"
        sx={{
          fontSize: 12,
          color: theme.palette.customText.primary.p3.active,
          opacity: 0,
          transform: "translateX(-3px)",
          transition: "opacity 0.18s, transform 0.18s",
        }}
      >
        ›
      </Typography>
    </Box>
  );
}
