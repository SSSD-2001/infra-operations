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
import CloudIcon from "@mui/icons-material/Cloud";
import LanguageIcon from "@mui/icons-material/Language";
import { Box, Grid, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BookMarked, ClipboardList, Eye, GitPullRequest, Workflow } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useEffect } from "react";

import { Role } from "@root/src/slices/authSlice/auth";
import { fetchRepositoryRequests } from "@root/src/slices/repositoryRequestSlice/repositoryRequest";
import { RootState, useAppDispatch, useAppSelector } from "@root/src/slices/store";

import SectionLabel from "../../component/ui/SectionLabel";
import Greeting from "./Greeting/Greeting";
import InfraServices from "./InfraServices/InfraServices";
import GitHubServiceCard from "./InfraServices/ServiceCards/GitHubServiceCard";
import SecurityDashboardCard from "./InfraServices/ServiceCards/SecurityDashboardCard";
import PendingAlertBanner from "./PendingAlertBanner/PendingAlertBanner";
import QuickActionCard from "./QuickActions/QuickActionCard";
import RecentActivity from "./RecentActivity/RecentActivity";

export default function Home() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  const auth = useAppSelector((state: RootState) => state.auth);
  const user = useAppSelector((state: RootState) => state.user);
  const repositoryRequestState = useAppSelector((state: RootState) => state.repositoryRequest);

  useEffect(() => {
    dispatch(fetchRepositoryRequests({ leadEmail: user.userInfo?.workEmail }));
  }, [dispatch, user.userInfo?.workEmail]);

  const roles = auth.roles;

  const canReview = roles.includes(Role.ADMIN) || roles.includes(Role.APPROVER);

  const allRequests = repositoryRequestState.repositoryRequests.repositoryRequests;

  // Theme-derived color aliases used for inline sections (greeting, alert, quick actions)
  const accent = theme.palette.primary.main;
  const accentBg = alpha(accent, 0.1);
  const greenColor = theme.palette.success.main;
  const greenBg = alpha(greenColor, 0.1);
  const amberColor = theme.palette.warning.main;
  const amberBg = alpha(amberColor, 0.1);
  const blueColor = theme.palette.info.main;
  const blueBg = alpha(blueColor, 0.1);

  const quickActions = [
    {
      icon: <BookMarked size={16} />,
      iconBg: accentBg,
      iconColor: accent,
      label: "New repository request",
      subtitle: "Request a new GitHub repo",
      onClick: () => navigate("/github/repository-requests"),
      show: roles.includes(Role.EMPLOYEE) || roles.includes(Role.ADMIN),
    },
    {
      icon: <GitPullRequest size={16} />,
      iconBg: blueBg,
      iconColor: blueColor,
      label: "Request repo access",
      subtitle: "Get access to an existing repo",
      onClick: () => navigate("/github/repository-access-requests"),
      show: roles.includes(Role.EMPLOYEE) || roles.includes(Role.ADMIN),
    },
    {
      icon: <ClipboardList size={16} />,
      iconBg: greenBg,
      iconColor: greenColor,
      label: "View my requests",
      subtitle: "Track status and history",
      onClick: () => navigate("/github/repository-requests"),
      show: roles.includes(Role.EMPLOYEE) || roles.includes(Role.ADMIN),
    },
    {
      icon: <Eye size={16} />,
      iconBg: amberBg,
      iconColor: amberColor,
      label: "Review requests",
      subtitle: "Review pending submissions",
      onClick: () => navigate("/github/review-repository-requests"),
      show: canReview,
    },
  ].filter((a) => a.show);

  return (
    <Box
      sx={{
        mx: "auto",
        px: { xs: 2, sm: 3.5 },
        pt: { xs: 3, sm: 1 },
      }}
    >
      {/* ── Greeting ── */}
      <Greeting user={user} roles={roles} />

      {/* ── Pending alert banner ── */}
      <PendingAlertBanner />

      {/* ── Quick actions ── */}
      <SectionLabel>Quick actions</SectionLabel>
      <Grid container spacing={1.25} mb={4}>
        {quickActions.map((action, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <QuickActionCard
              icon={action.icon}
              iconBg={action.iconBg}
              iconColor={action.iconColor}
              label={action.label}
              subtitle={action.subtitle}
              onClick={action.onClick}
            />
          </Grid>
        ))}
      </Grid>

      {/* ── Infrastructure services ── */}
      <SectionLabel>Infrastructure services</SectionLabel>
      <InfraServices
        services={[
          <GitHubServiceCard canReview={canReview} onNavigate={navigate} />,
          <SecurityDashboardCard />,
        ]}
        comingSoon={[
          {
            icon: <LanguageIcon />,
            label: "Domain Management",
          },
          {
            icon: <Workflow />,
            label: "CI / CD",
          },
          {
            icon: <CloudIcon />,
            label: "Cloud Providers",
          },
        ]}
      />

      {/* ── Recent activity ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionLabel>Recent activity</SectionLabel>
        <Typography
          onClick={() => navigate("/repository-requests")}
          sx={{
            fontSize: 12,
            color: accent,
            fontWeight: 500,
            cursor: "pointer",
            mb: 1.5,
            transition: "opacity 0.18s ease",
            "&:hover": { opacity: 0.7 },
          }}
        >
          View all
        </Typography>
      </Box>
      <RecentActivity allRequests={allRequests} />
    </Box>
  );
}
