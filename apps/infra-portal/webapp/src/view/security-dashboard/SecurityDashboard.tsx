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
import { Box, Grid, alpha, useTheme } from "@mui/material";
import { Shield } from "lucide-react";

import Heading from "@root/src/component/ui/Heading";
import SectionLabel from "@root/src/component/ui/SectionLabel";
import ServiceCard, { ServiceCardProps } from "@root/src/component/ui/Service";
import { Role } from "@root/src/slices/authSlice/auth";
import { useAppSelector } from "@root/src/slices/store";

export default function SecurityDashboard() {
  const theme = useTheme();
  const securityDashboardLinks = useAppSelector((state) => state.securityDashboardLinks.links);

  const greenColor = theme.palette.success.main;
  const greenBg = alpha(greenColor, 0.1);
  const amberColor = theme.palette.warning.main;
  const amberBg = alpha(amberColor, 0.1);
  const blueColor = theme.palette.info.main;
  const blueBg = alpha(blueColor, 0.1);
  const services: ServiceCardProps[] = [
    {
      icon: <Shield size={16} />,
      title: "Device Compliance Status",
      description:
        "View the current security status of all your devices, including vulnerabilities and compliance.",
      roles: [Role.EMPLOYEE],
      iconColor: blueColor,
      iconBg: blueBg,
      tag: {
        tagName: "device",
        tagBackground: blueBg,
        tagColor: blueColor,
      },
      features: [
        {
          label: "View detailed report",
          onClick: () => window.open(securityDashboardLinks.deviceComplianceLink, "_blank"),
          tag: {
            tagName: "report",
            tagBackground: blueBg,
            tagColor: blueColor,
          },
          roles: [Role.EMPLOYEE],
        },
      ],
    },
    {
      icon: <Shield size={16} />,
      title: "Software Compliancy Report",
      description: "View the compliance status of all your software applications.",
      roles: [Role.EMPLOYEE],
      iconColor: greenColor,
      iconBg: greenBg,
      tag: {
        tagName: "software",
        tagBackground: greenBg,
        tagColor: greenColor,
      },
      features: [
        {
          label: "View detailed report",
          onClick: () => window.open(securityDashboardLinks.softwareComplianceLink, "_blank"),
          tag: {
            tagName: "report",
            tagBackground: greenBg,
            tagColor: greenColor,
          },
          roles: [Role.EMPLOYEE],
        },
      ],
    },
    {
      icon: <Shield size={16} />,
      title: "Security Score",
      description: "View your overall security score.",
      roles: [Role.EMPLOYEE],
      iconColor: amberColor,
      iconBg: amberBg,
      tag: {
        tagName: "score",
        tagBackground: amberBg,
        tagColor: amberColor,
      },
      features: [
        {
          label: "View detailed report",
          onClick: () => window.open(securityDashboardLinks.securityScoreLink, "_blank"),
          tag: {
            tagName: "report",
            tagBackground: amberBg,
            tagColor: amberColor,
          },
          roles: [Role.EMPLOYEE],
        },
      ],
    },
  ];
  return (
    <Box
      sx={{
        mx: "auto",
        px: { xs: 2, sm: 3.5 },
        pt: { xs: 3, sm: 1 },
      }}
    >
      <Heading
        title="Security Dashboard"
        description="Monitor the security status of your devices."
        icon={<Shield />}
      />

      <SectionLabel>Services</SectionLabel>
      <Grid container spacing={1.5} mb={4}>
        {services.map((service, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
            <ServiceCard {...service} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
