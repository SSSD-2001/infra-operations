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

import RequestHistoryTable from "@component/common/request/RequestHistoryTable";
import { useAppSelector } from "@slices/store";

export default function MyRequests() {
  const theme = useTheme();
  const userInfo = useAppSelector((state) => state.user.userInfo);

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, mt: 3, color: theme.palette.customText.primary.p1.active }}
      >
        My Repository Requests
      </Typography>
      <Typography variant="body2" sx={{ color: theme.palette.customText.primary.p3.active }}>
        View, edit and resubmit your pending requests, and track their decisions.
      </Typography>
      {userInfo?.workEmail && <RequestHistoryTable memberEmailProp={userInfo.workEmail} />}
    </Box>
  );
}
