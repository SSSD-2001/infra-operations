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
import { GitHub } from "@mui/icons-material";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import ServiceCardHeader from "./ServiceCardTitle";
import ServiceRow from "./ServiceRow";

interface GitHubServiceCardProps {
  canReview: boolean;
  onNavigate: (path: string) => void;
}

export default function GitHubServiceCard({ canReview, onNavigate }: GitHubServiceCardProps) {
  const theme = useTheme();

  const accent = theme.palette.primary.main;
  const greenColor = theme.palette.success.main;
  const greenBg = alpha(greenColor, 0.1);
  const amberColor = theme.palette.warning.main;
  const amberBg = alpha(amberColor, 0.1);
  const blueColor = theme.palette.info.main;

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
        "&:hover": { boxShadow: theme.shadows[1] },
      }}
    >
      {/* Header */}
      <ServiceCardHeader
        title="GitHub"
        onNavigate={() => onNavigate("/github")}
        icon={<GitHub />}
      />

      {/* Service rows */}
      <Box>
        <ServiceRow
          dotColor={accent}
          label="Repository Requests"
          tag={{ tagName: "all", tagBackground: greenBg, tagColor: greenColor }}
          onClick={() => onNavigate("/github/repository-requests")}
        />
        <ServiceRow
          dotColor={blueColor}
          label="Repository Access Requests"
          tag={{ tagName: "all", tagBackground: greenBg, tagColor: greenColor }}
          onClick={() => onNavigate("/github/repository-access-requests")}
        />
        {canReview && (
          <ServiceRow
            dotColor={amberColor}
            label="Review Repository Requests"
            tag={{ tagName: "approver", tagBackground: amberBg, tagColor: amberColor }}
            onClick={() => onNavigate("/github/review-repository-requests")}
            isLast
          />
        )}
      </Box>
    </Box>
  );
}
