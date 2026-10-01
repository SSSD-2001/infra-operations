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
import { Box, Tab, Tabs, Typography, useTheme } from "@mui/material";

import { useState } from "react";

import RequestHistoryTable from "@component/common/request/RequestHistoryTable";
import { Role, selectRoles } from "@slices/authSlice/auth";
import { useAppSelector } from "@slices/store";

export default function ReviewRequests() {
  const theme = useTheme();
  const userInfo = useAppSelector((state) => state.user.userInfo);
  const roles = useAppSelector(selectRoles);
  const isAdmin = roles.includes(Role.ADMIN);

  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, mt: 3, color: theme.palette.customText.primary.p1.active }}
      >
        Review Repository Requests
      </Typography>
      <Typography variant="body2" sx={{ color: theme.palette.customText.primary.p3.active }}>
        Review, comment on and approve or reject repository requests.
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        sx={{ mt: 1, borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Tab label="Assigned to me" />
        {isAdmin && <Tab label="All Requests" />}
      </Tabs>

      {activeTab === 0 && userInfo?.workEmail && (
        <RequestHistoryTable leadEmailProp={userInfo.workEmail} />
      )}
      {activeTab === 1 && isAdmin && userInfo?.workEmail && (
        <RequestHistoryTable adminEmailProp={userInfo.workEmail} />
      )}
    </Box>
  );
}
