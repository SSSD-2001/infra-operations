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

export function GridHeader({
  gridTemplateColumns,
  headers,
}: {
  gridTemplateColumns: string;
  headers: string[];
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: gridTemplateColumns,
        alignItems: "center",
        px: 1.75,
        py: 0.75,
        background:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.common.white, 0.03)
            : alpha(theme.palette.common.black, 0.02),
        borderBottom: `1px solid ${theme.palette.divider}`,
        position: "sticky",
        top: 0,
        zIndex: 1,
      }}
    >
      {headers.map((header) => (
        <Typography
          key={header}
          sx={{
            fontSize: 11,
            // fontFamily: "monospace",
            textTransform: "Capitalize",
            letterSpacing: "0.05em",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            color: theme.palette.customText.primary.p2.active,
          }}
        >
          {header}
        </Typography>
      ))}
    </Box>
  );
}
