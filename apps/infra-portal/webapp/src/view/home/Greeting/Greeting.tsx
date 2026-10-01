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
import { Box, Chip, Typography, alpha, useTheme } from "@mui/material";

import { Role, UserState } from "@root/src/slices/authSlice/auth";

interface GreetingProps {
  user: UserState;
  roles: Role[];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Greeting({ user, roles }: GreetingProps) {
  const theme = useTheme();

  const accent = theme.palette.primary.main;
  const accentBg = alpha(accent, 0.1);

  const firstName = user.userInfo?.firstName ?? "there";
  const topRole = roles.includes(Role.ADMIN)
    ? Role.ADMIN.toLowerCase()
    : roles.includes(Role.APPROVER)
      ? Role.APPROVER.toLowerCase()
      : Role.EMPLOYEE.toLowerCase();

  return (
    <Box
      sx={{
        mb: 4,
      }}
    >
      <Typography
        fontSize={11}
        fontWeight={500}
        letterSpacing={"0.1em"}
        textTransform={"uppercase"}
        color={theme.palette.customText.primary.p3.active}
        mb={0.5}
        fontFamily={"monospace"}
      >
        WSO2 Infra Portal
      </Typography>
      <Typography
        letterSpacing={0.5}
        fontWeight={600}
        fontSize={26}
        lineHeight={1.2}
        color={theme.palette.text.primary}
      >
        {getGreeting()},{" "}
        <Typography
          component="span"
          letterSpacing={0.5}
          fontWeight={600}
          fontSize={26}
          lineHeight={1.2}
          color={accent}
        >
          {firstName}
        </Typography>
      </Typography>
      <Chip
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: accent, mb: 0.1 }} />
            {topRole}
          </Box>
        }
        sx={{
          display: "inline-flex",
          alignItems: "center",
          height: "fit-content",
          width: "fit-content",
          borderRadius: "20px",
          fontSize: 11,
          fontWeight: 500,
          fontFamily: "monospace",
          background: accentBg,
          color: accent,
          border: `1px solid ${alpha(accent, 0.2)}`,
          whiteSpace: "nowrap",
          mt: 0.75,
          flexShrink: 0,
          "& .MuiChip-label": {
            px: 1.25,
            py: 0.5,
          },
        }}
      />
      <Typography fontSize={13} color={theme.palette.customText.primary.p3.active} mt={0.6}>
        Manage your infrastructure requests and access from one place.
      </Typography>
    </Box>
  );
}
