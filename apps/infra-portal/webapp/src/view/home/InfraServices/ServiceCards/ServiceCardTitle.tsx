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
import { ChevronRight } from "lucide-react";

import ServiceIconBox from "@root/src/component/ui/ServiceIconBox";

export default function ServiceCardHeader({
  title,
  onNavigate,
  icon,
}: {
  title: string;
  onNavigate: () => void;
  icon: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Box
      onClick={onNavigate}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.4,
        px: 2.25,
        pt: 2,
        pb: 1.75,
        borderBottom: `1px solid ${theme.palette.divider}`,
        cursor: "pointer",
        transition: "background 0.18s ease",
        "&:hover": { background: theme.palette.action.hover },
      }}
    >
      <ServiceIconBox icon={icon} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 14,
            color: theme.palette.customText.primary.p1.active,
          }}
        >
          {title}
        </Typography>
      </Box>
      <ChevronRight size={13} color={theme.palette.customText.primary.p3.active} />
    </Box>
  );
}
