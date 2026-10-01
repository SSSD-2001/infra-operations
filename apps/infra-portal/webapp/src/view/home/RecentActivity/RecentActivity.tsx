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
import { Box, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { RepositoryRequest } from "@slices/repositoryRequestSlice/repositoryRequest";

import ActivityRow from "./ActivityRow";

interface RecentActivityProps {
  allRequests: RepositoryRequest[];
}

export default function RecentActivity({ allRequests }: RecentActivityProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const recentRequests = [...allRequests]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  if (recentRequests.length === 0) {
    return null;
  }
  return (
    <>
      <Box
        sx={{
          background:
            theme.palette.mode === "dark"
              ? theme.palette.surface.primary.active
              : theme.palette.neutral["white"],
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: "18px",
          overflow: "hidden",
        }}
      >
        {recentRequests.map((req, idx) => (
          <ActivityRow
            key={req.id}
            req={req}
            onClick={() => navigate(`/repository-requests/${req.id}`)}
            isLast={idx === recentRequests.length - 1}
          />
        ))}
      </Box>
    </>
  );
}
