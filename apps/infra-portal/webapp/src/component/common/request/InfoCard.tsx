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
import { Box, Grid, Typography, useTheme } from "@mui/material";

import React from "react";

interface InfoArray {
  title: string;
  subTitle?: React.ReactNode;
  icon: React.ReactElement;
}

interface InfoCardProps {
  title?: string;
  items: InfoArray[];
  gridSize?: number;
}

export default function InfoCard({ title, items, gridSize = 6 }: InfoCardProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        px: 2,
        pb: 1,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        background:
          theme.palette.mode === "dark"
            ? theme.palette.surface.primary.active
            : theme.palette.neutral["white"],
      }}
    >
      {title && (
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: theme.palette.customText.primary.p2.active,
            textAlign: "center",
            py: 1,
          }}
        >
          {title}
        </Typography>
      )}
      <Grid container spacing={2}>
        {items.map((item, index) => (
          <Grid
            key={index}
            size={{ xs: 12, sm: gridSize }}
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ mb: 1 }}
          >
            {React.cloneElement(item.icon as React.ReactElement<{ sx?: object }>, {
              sx: { color: theme.palette.secondary.main, fontSize: 20 },
            })}
            <Box>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.customText.primary.p2.active, fontWeight: "bold" }}
              >
                {item.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.customText.primary.p3.active }}
              >
                {item.subTitle || "N/A"}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
