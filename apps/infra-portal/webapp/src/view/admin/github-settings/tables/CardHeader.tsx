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
import { Box, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

interface CardHeaderProps {
  icon: React.ReactNode;
  itemCount: number;
  iconColor: string;
  title: string;
  itemType: string;
  action?: React.ReactNode;
}

export function CardHeader(props: CardHeaderProps) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 1.75,
        py: 1.4,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "7px",
          background: alpha(props.iconColor, 0.15),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: props.iconColor,
          flexShrink: 0,
        }}
      >
        {props.icon}
      </Box>
      <Typography
        sx={{
          fontSize: 13,
          color: theme.palette.customText.primary.p1.active,
          flex: 1,
        }}
      >
        {props.title}
      </Typography>
      <Typography
        sx={{
          fontSize: 11,
          fontFamily: "monospace",
          color: theme.palette.customText.primary.p3.active,
        }}
      >
        {props.itemCount} {props.itemCount === 1 ? props.itemType : `${props.itemType}s`}
      </Typography>
      {props.action && <Box sx={{ flexShrink: 0 }}>{props.action}</Box>}
    </Box>
  );
}
