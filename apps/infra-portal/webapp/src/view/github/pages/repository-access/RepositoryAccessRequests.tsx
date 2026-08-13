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
import GitHubConnect from "@component/ui/GitHubConnect";
import DefaultRepositoryAccessSection from "@view/github/components/DefaultRepositoryAccessSection";

export default function RepositoryAccessRequests() {
  const theme = useTheme();
  return (
    <Box sx={{ mt: 3 }}>
      <Box
        sx={{
          background:
            theme.palette.mode === "dark"
              ? theme.palette.surface.primary.active
              : theme.palette.neutral["white"],
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: "16px",
          p: { xs: 2, sm: 3 },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 0.5,
            color: theme.palette.customText.primary.p1.active,
          }}
        >
          Default Repository Access
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mb: 3,
            color: theme.palette.customText.primary.p3.active,
          }}
        >
          Organizations and repositories you are granted access by default.
        </Typography>
        <DefaultRepositoryAccessSection />
        <GitHubConnect />
      </Box>
    </Box>
  );
}
