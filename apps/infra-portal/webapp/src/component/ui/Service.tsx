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
import { Box, Grid, Stack, Typography, useTheme } from "@mui/material";

import React from "react";

import { Role } from "@root/src/slices/authSlice/auth";
import { RootState, useAppSelector } from "@root/src/slices/store";
import { Tag } from "@root/src/types/types";

export interface ServiceCardProps {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  tag: Tag;
  description: string;
  features?: Features[];
  navigateTo?: (path: string) => void;
  roles: Role[]; // Roles that can access this service card
}

interface Features {
  label: string;
  description?: string;
  tag: Tag;
  onClick?: (path: string) => void;
  roles?: Role[]; // Roles that can access this feature
}

export default function ServiceCard(props: ServiceCardProps) {
  const auth = useAppSelector((state: RootState) => state.auth);
  const roles = auth.roles;
  const theme = useTheme();
  if (!props.roles.some((role) => roles.includes(role))) {
    return null;
  }
  return (
    <Box
      sx={{
        background:
          theme.palette.mode === "dark"
            ? theme.palette.surface.primary.active
            : theme.palette.neutral["white"],
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "18px",
        height: "100%",
        overflow: "hidden",
        transition: "box-shadow 0.18s ease",
        // "&:hover": { boxShadow: theme.shadows[1] },
      }}
    >
      {/* Header */}
      <Stack
        direction="column"
        minHeight="150px"
        spacing={2}
        sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
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
              background: props.iconBg,
              color: props.iconColor,
              flexShrink: 0,
            }}
          >
            {props.icon}
          </Box>
          <Box
            sx={{
              fontSize: 10,
              fontWeight: 500,
              px: 0.875,
              py: 0.25,
              borderRadius: "4px",
              fontFamily: "monospace",
              flexShrink: 0,
              background: props.tag.tagBackground,
              color: props.tag.tagColor,
            }}
          >
            {props.tag.tagName}
          </Box>
        </Box>
        <Grid container direction="column" spacing={1}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: 14,
              color: theme.palette.customText.primary.p1.active,
              lineHeight: 1.3,
            }}
          >
            {props.title}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: theme.palette.customText.primary.p3.active,
              mt: 0.25,
              lineHeight: 1.5,
            }}
          >
            {props.description}
          </Typography>
        </Grid>
      </Stack>
      {/* features */}
      <Stack direction="column" spacing={1} sx={{ p: 2, flex: 1, overflowY: "auto" }}>
        {props.features &&
          props.features.map((feature, index) => {
            if (feature.roles && !feature.roles.some((role) => roles.includes(role))) {
              return null;
            }
            return (
              <Grid
                container
                direction="row"
                spacing={1}
                alignItems="center"
                key={index}
                onClick={() => feature.onClick && feature.onClick(feature.label)}
                flexWrap={"nowrap"}
                sx={{
                  padding: 1,
                  //   pl: 2,
                  borderRadius: "8px",
                  border: `1px solid ${theme.palette.divider}`,
                  cursor: "pointer",
                  transition: "background 0.18s ease",
                  "&:hover": {
                    background: theme.palette.action.hover,
                    "& .row-chevron": { opacity: 1, transform: "translateX(0)" },
                  },
                }}
              >
                {/* <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: props.iconColor,
                    flexShrink: 0,
                  }}
                /> */}
                <Box
                  sx={{
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    py: feature.description ? 0.5 : 0,
                  }}
                >
                  <Typography
                    lineHeight={1.5}
                    sx={{
                      fontWeight: 500,
                      fontSize: 12,
                      color: theme.palette.text.primary,
                      ml: 1,
                    }}
                  >
                    {feature.label}
                  </Typography>
                  <Typography
                    lineHeight={1.5}
                    sx={{
                      fontSize: 11,
                      color: theme.palette.customText.primary.p3.active,
                      ml: 1,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    fontSize: 10,
                    fontWeight: 500,
                    px: 0.875,
                    py: 0.25,
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    flexShrink: 0,
                    background: feature.tag.tagBackground,
                    color: feature.tag.tagColor,
                    ml: "auto",
                  }}
                >
                  {feature.tag.tagName}
                </Box>
              </Grid>
            );
          })}
      </Stack>
    </Box>
  );
}
