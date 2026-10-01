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
import { Security } from "@mui/icons-material";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { useEffect } from "react";

import { fetchSecurityDashboardLinks } from "@slices/securityDashboardLinksSlice/securityDashboardLinks";
import { useAppDispatch, useAppSelector } from "@slices/store";

import ServiceCardHeader from "./ServiceCardTitle";
import ServiceRow from "./ServiceRow";

export default function SecurityDashboardCard() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const securityDashboardLinks = useAppSelector((state) => state.securityDashboardLinks.links);
  const accent = theme.palette.primary.main;
  const greenColor = theme.palette.success.main;
  const greenBg = alpha(greenColor, 0.1);
  const amberColor = theme.palette.warning.main;
  const blueColor = theme.palette.info.main;

  useEffect(() => {
    dispatch(fetchSecurityDashboardLinks());
  }, [dispatch]);

  return (
    <Box
      sx={{
        background:
          theme.palette.mode === "dark"
            ? theme.palette.surface.primary.active
            : theme.palette.neutral["white"],
        border: `1px solid ${theme.palette.divider}`,
        height: "100%",
        borderRadius: "18px",
        overflow: "hidden",
        transition: "box-shadow 0.18s ease",
        "&:hover": { boxShadow: theme.shadows[1] },
      }}
    >
      {/* Header */}
      <ServiceCardHeader
        title="Security Dashboard"
        icon={<Security />}
        onNavigate={() =>
          window.open(securityDashboardLinks.deviceComplianceLink, "_blank", "noopener noreferrer")
        }
      />

      {/* Service rows */}
      <Box>
        <ServiceRow
          dotColor={accent}
          label="Device compliance overview"
          tag={{ tagName: "all", tagBackground: greenBg, tagColor: greenColor }}
          onClick={() =>
            window.open(
              securityDashboardLinks.deviceComplianceLink,
              "_blank",
              "noopener noreferrer",
            )
          }
        />
        <ServiceRow
          dotColor={blueColor}
          label="Software compliance overview"
          tag={{ tagName: "all", tagBackground: greenBg, tagColor: greenColor }}
          onClick={() =>
            window.open(
              securityDashboardLinks.softwareComplianceLink,
              "_blank",
              "noopener noreferrer",
            )
          }
        />

        <ServiceRow
          dotColor={amberColor}
          label="Security score overview"
          tag={{ tagName: "all", tagBackground: greenBg, tagColor: greenColor }}
          onClick={() =>
            window.open(securityDashboardLinks.securityScoreLink, "_blank", "noopener noreferrer")
          }
          isLast
        />
      </Box>
    </Box>
  );
}
