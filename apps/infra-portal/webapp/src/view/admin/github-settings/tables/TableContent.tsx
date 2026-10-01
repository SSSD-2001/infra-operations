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
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

import type { ReactNode } from "react";

interface TableBodyProps {
  children: ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  height?: number;
}

export default function TableBody({
  children,
  isEmpty = false,
  emptyMessage = "No data available.",
  height: height = 220,
}: TableBodyProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: height,
        overflowY: "auto",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { width: "none" },

        maskImage: `none`,
        WebkitMaskImage: `none`,

        "@keyframes revealTop": {
          from: {
            maskImage: `linear-gradient(to bottom, black 0%, black 0%, black 80%, transparent 100%)`,
            WebkitMaskImage: `linear-gradient(to bottom, black 0%, black 0%, black 80%, transparent 100%)`,
          },
          to: {
            maskImage: `linear-gradient(to bottom, transparent 0%, black 15%, black 80%, transparent 100%)`,
            WebkitMaskImage: `linear-gradient(to bottom, transparent 0%, black 15%, black 80%, transparent 100%)`,
          },
        },

        "@keyframes hideBottom": {
          from: {
            maskImage: `linear-gradient(to bottom, transparent 0%, black 15%, black 80%, transparent 100%)`,
            WebkitMaskImage: `linear-gradient(to bottom, transparent 0%, black 15%, black 80%, transparent 100%)`,
          },
          to: {
            maskImage: `linear-gradient(to bottom, transparent 0%, black 15%, black 80%, black 100%)`,
            WebkitMaskImage: `linear-gradient(to bottom, transparent 0%, black 15%, black 80%, black 100%)`,
          },
        },

        animationName: "revealTop, hideBottom",
        animationTimeline: "scroll(self), scroll(self)",
        animationFillMode: "none, forwards",
        animationDuration: "1ms, 1ms",
        animationRange: "0% 100%, 100% 100%",
      }}
    >
      {isEmpty ? (
        <Box sx={{ px: 1.75, py: 3, textAlign: "center" }}>
          <Typography
            sx={{
              fontSize: 12,
              color: theme.palette.customText.primary.p3.active,
            }}
          >
            {emptyMessage}
          </Typography>
        </Box>
      ) : (
        children
      )}
    </Box>
  );
}
