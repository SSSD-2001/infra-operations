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
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export interface ComingSoonCardProps {
  icon: React.ReactNode;
  label: string;
}

export default function ComingSoonCard({ icon, label }: ComingSoonCardProps) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        background: theme.palette.surface.primary.active,
        border: `1px dashed ${theme.palette.divider}`,
        borderRadius: "18px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 0.75,
        minHeight: 152,
        p: 3,
        opacity: 0.7,
      }}
    >
      <Typography sx={{ fontSize: 20, opacity: 0.3 }}>{icon}</Typography>
      <Typography
        sx={{ fontSize: 12, fontWeight: 500, color: theme.palette.customText.primary.p3.active }}
      >
        {label}
      </Typography>
      <Typography
        sx={{ fontSize: 11, color: theme.palette.customText.primary.p3.active, opacity: 0.55 }}
      >
        Coming soon
      </Typography>
    </Box>
  );
}
