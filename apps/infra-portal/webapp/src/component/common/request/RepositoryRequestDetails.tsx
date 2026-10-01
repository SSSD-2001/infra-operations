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
import BlockIcon from "@mui/icons-material/Block";
import BugReportIcon from "@mui/icons-material/BugReport";
import BuildIcon from "@mui/icons-material/Build";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import BusinessIcon from "@mui/icons-material/Business";
import CloudCircleIcon from "@mui/icons-material/CloudCircle";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderIcon from "@mui/icons-material/Folder";
import Groups2Icon from "@mui/icons-material/Groups";
import LanguageIcon from "@mui/icons-material/Language";
import PermContactCalendarIcon from "@mui/icons-material/PermContactCalendar";
import PersonIcon from "@mui/icons-material/Person";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import SecurityIcon from "@mui/icons-material/Security";
import TagIcon from "@mui/icons-material/Tag";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Box, Grid, Typography } from "@mui/material";

import InfoCard from "@component/common/request/InfoCard";
import { RepositoryRequest } from "@slices/repositoryRequestSlice/repositoryRequest";

interface RepositoryRequestDetailsProps {
  request: RepositoryRequest | null;
}

const toLines = (value: string | undefined) => {
  const entries = (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (entries.length === 0) return undefined;
  return entries.map((entry, idx) => (
    <Typography variant="body2" key={idx} sx={{ display: "block", wordBreak: "break-all" }}>
      {entry}
    </Typography>
  ));
};

export default function RepositoryRequestDetails({ request }: RepositoryRequestDetailsProps) {
  if (!request) {
    return <Typography>No data available.</Typography>;
  }

  return (
    <Box sx={{ px: 1.5, py: 1.5, maxHeight: "100%", overflowY: "auto" }}>
      <Grid container spacing={2}>
        {/* Left Column */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Grid container spacing={1} direction="column">
            <Grid>
              <InfoCard title="Request Details" gridSize={12} items={[]} />
            </Grid>
            <Grid>
              <InfoCard
                gridSize={12}
                items={[
                  { title: "Requested By", subTitle: request.email, icon: <PersonIcon /> },
                  {
                    title: "Requested From",
                    subTitle: request.leadEmail,
                    icon: <PermContactCalendarIcon />,
                  },
                  { title: "CC List", subTitle: toLines(request.ccList), icon: <ContactMailIcon /> },
                ]}
              />
            </Grid>
            <Grid>
              <InfoCard
                gridSize={12}
                items={[
                  {
                    title: "Requirement",
                    subTitle: request.requirement,
                    icon: <QuestionMarkIcon />,
                  },
                ]}
              />
            </Grid>
            <Grid sx={{ mt: 2 }}>
              <InfoCard title="CI/CD Configuration" gridSize={12} items={[]} />
            </Grid>
            <Grid>
              <InfoCard
                gridSize={12}
                items={[
                  {
                    title: "CI/CD Configuration",
                    subTitle: request.cicdRequirement,
                    icon: <BuildIcon />,
                  },
                  ...(request.cicdRequirement === "Jenkins"
                    ? [
                        {
                          title: "Jenkins Job Type",
                          subTitle: request.jenkinsJobType || "N/A",
                          icon: <BuildCircleIcon />,
                        },
                        {
                          title: "Jenkins Group ID",
                          subTitle: request.jenkinsGroupId || "N/A",
                          icon: <BuildCircleIcon />,
                        },
                      ]
                    : []),
                  ...(request.cicdRequirement === "Azure"
                    ? [
                        {
                          title: "Azure DevOps Org",
                          subTitle: request.azureDevopsOrg || "N/A",
                          icon: <CloudCircleIcon />,
                        },
                        {
                          title: "Azure DevOps Project",
                          subTitle: request.azureDevopsProject || "N/A",
                          icon: <CloudCircleIcon />,
                        },
                      ]
                    : []),
                ]}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Grid container spacing={1} direction="column">
            <Grid>
              <InfoCard title="Repository Details" gridSize={12} items={[]} />
            </Grid>
            <Grid>
              <InfoCard
                gridSize={6}
                items={[
                  { title: "Repository Name", subTitle: request.repoName, icon: <FolderIcon /> },
                  {
                    title: "Organization",
                    subTitle: request.organizationName,
                    icon: <BusinessIcon />,
                  },
                  {
                    title: "Enable Issues",
                    subTitle: request.enableIssues,
                    icon: <BugReportIcon />,
                  },
                  { title: "Type", subTitle: request.repoType, icon: <VisibilityIcon /> },
                  { title: "Topics", subTitle: toLines(request.topics), icon: <TagIcon /> },
                  {
                    title: "Website URL",
                    subTitle: request.websiteUrl || "N/A",
                    icon: <LanguageIcon />,
                  },
                ]}
              />
            </Grid>
            <Grid>
              <InfoCard
                gridSize={12}
                items={[
                  {
                    title: "Description",
                    subTitle: request.description,
                    icon: <DescriptionIcon />,
                  },
                ]}
              />
            </Grid>
            <Grid sx={{ mt: 2 }}>
              <InfoCard title="Security and Access" gridSize={6} items={[]} />
            </Grid>
            <Grid>
              <InfoCard
                gridSize={6}
                items={[
                  {
                    title: "Branch Protection",
                    subTitle: request.prProtection,
                    icon: <SecurityIcon />,
                  },
                  { title: "Teams", subTitle: toLines(request.teams), icon: <Groups2Icon /> },
                  ...(request.organizationVisibility === "Private"
                    ? [
                        {
                          title: "Enable triage access to wso2-all Team?",
                          subTitle: request.enableTriageWso2All,
                          icon: <VerifiedUserIcon />,
                        },
                        {
                          title: "Enable triage access to wso2-all-interns Team?",
                          subTitle: request.enableTriageWso2AllInterns,
                          icon: <VerifiedUserIcon />,
                        },
                      ]
                    : []),
                ]}
              />
            </Grid>
            {(request.enableTriageWso2All === "No" ||
              request.enableTriageWso2AllInterns === "No") && (
              <Grid>
                <InfoCard
                  gridSize={12}
                  items={[
                    {
                      title: "Reason for disabling triage access",
                      subTitle: request.disableTriageReason || "N/A",
                      icon: <BlockIcon />,
                    },
                  ]}
                />
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
