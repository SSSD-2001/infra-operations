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
import PersonIcon from "@mui/icons-material/Person";
import { Avatar, Box, Card, CardContent, Typography, useTheme } from "@mui/material";

import { formatDateTime } from "@utils/utils";

export interface CommentCardProps {
  authorEmail: string;
  commentText: string;
  createdAt: string;
}

export default function CommentCard({ authorEmail, commentText, createdAt }: CommentCardProps) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        px: 0.5,
        mb: 1,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "12px",
        background:
          theme.palette.mode === "dark"
            ? theme.palette.surface.primary.active
            : theme.palette.neutral["white"],
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={0.5}>
          <Avatar
            sx={{
              mr: 1,
              bgcolor: theme.palette.secondary.main,
              width: 32,
              height: 32,
            }}
          >
            <PersonIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ color: theme.palette.customText.primary.p2.active }}>
              {authorEmail}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.customText.primary.p3.active }}>
              {formatDateTime(createdAt)}
            </Typography>
          </Box>
        </Box>
        <Typography
          variant="body1"
          sx={{ color: theme.palette.customText.primary.p2.active, whiteSpace: "pre-line" }}
        >
          {commentText}
        </Typography>
      </CardContent>
    </Card>
  );
}
