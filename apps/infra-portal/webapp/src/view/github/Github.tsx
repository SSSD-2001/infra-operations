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
import { Box, Grid, alpha, useTheme } from "@mui/material";
import { BookKey, BookMarked, Settings } from "lucide-react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";

import SectionLabel from "@root/src/component/ui/SectionLabel";
import { Role } from "@root/src/slices/authSlice/auth";

import Heading from "../../component/ui/Heading";
import ServiceCard, { ServiceCardProps } from "../../component/ui/Service";

export default function Github() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isIndex = useMatch({ path: "/github", end: true });

  const accent = theme.palette.primary.main;
  const accentBg = alpha(accent, 0.1);
  const greenColor = theme.palette.success.main;
  const greenBg = alpha(greenColor, 0.1);
  const amberColor = theme.palette.warning.main;
  const amberBg = alpha(amberColor, 0.1);
  const blueColor = theme.palette.info.main;
  const blueBg = alpha(blueColor, 0.1);

  const services: ServiceCardProps[] = [
    {
      icon: <BookMarked size={16} />,
      iconColor: accent,
      iconBg: accentBg,
      tag: {
        tagName: "all roles",
        tagBackground: greenBg,
        tagColor: greenColor,
      },
      title: "Repository Requests",
      description:
        "Request new GitHub repositories. Set visibility, topics, team access and CI/CD requirements.",
      roles: [Role.EMPLOYEE],
      features: [
        {
          label: "Submit a new repository request",
          //   description: "Fill a 4-step request form",
          tag: {
            tagName: "employee",
            tagBackground: blueBg,
            tagColor: blueColor,
          },
          onClick: () => navigate("repository-requests"),
          roles: [Role.EMPLOYEE],
        },
        {
          label: "My Repository Requests",
          //   description: "View and edit your requests",
          tag: {
            tagName: "employee",
            tagBackground: blueBg,
            tagColor: blueColor,
          },
          onClick: () => navigate("my-requests"),
          roles: [Role.EMPLOYEE],
        },
        {
          label: "Review pending requests",
          //   description: "Review and approve/deny pending repository requests",
          tag: {
            tagName: "approver",
            tagBackground: amberBg,
            tagColor: amberColor,
          },
          onClick: () => navigate("review-repository-requests"),
          roles: [Role.APPROVER],
        },
      ],
    },
    {
      icon: <BookKey size={16} />,
      iconColor: blueColor,
      iconBg: blueBg,
      tag: {
        tagName: "all roles",
        tagBackground: greenBg,
        tagColor: greenColor,
      },
      title: "Repository Access Requests",
      description:
        "Request read, write or triage access to an existing repository. Specify the team and access level required.",
      roles: [Role.EMPLOYEE],
      features: [
        {
          label: "Request repository access",
          //   description: "Fill a 2-step request form",
          tag: {
            tagName: "employee",
            tagBackground: blueBg,
            tagColor: blueColor,
          },
          onClick: () => navigate("repository-access-requests"),
          roles: [Role.EMPLOYEE],
        },
        {
          label: "My Access Requests History",
          //   description: "View and edit your access requests",
          tag: {
            tagName: "employee",
            tagBackground: blueBg,
            tagColor: blueColor,
          },
          onClick: () => navigate("my-requests"),
          roles: [Role.EMPLOYEE],
        },
        {
          label: "Review pending requests",
          //   description: "Review and approve/deny pending access requests",
          tag: {
            tagName: "approver",
            tagBackground: amberBg,
            tagColor: amberColor,
          },
          onClick: () => navigate("review-repository-requests"),
          roles: [Role.APPROVER],
        },
      ],
    },
    {
      icon: <Settings size={16} />,
      iconColor: greenColor,
      iconBg: greenBg,
      tag: {
        tagName: "admin",
        tagBackground: greenBg,
        tagColor: greenColor,
      },
      title: "Admin Settings",
      description: "Configure GitHub integration settings and permissions.",
      roles: [Role.ADMIN],
      features: [
        {
          label: "Manage GitHub settings",
          description: "Configure integration settings and permissions",
          tag: {
            tagName: "admin",
            tagBackground: greenBg,
            tagColor: greenColor,
          },
          onClick: () => navigate("/admin/github-settings"),
          roles: [Role.ADMIN],
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
        title="GitHub Integration"
        description="Repository and access management across WSO2 organizations"
        icon={<GitHub />}
      />

      {/* services */}
      {isIndex ? (
        <>
          <SectionLabel>Services</SectionLabel>
          <Grid container spacing={1.5} mb={4}>
            {services.map((service, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                <ServiceCard {...service} />
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
        <Outlet />
      )}
    </Box>
  );
}
