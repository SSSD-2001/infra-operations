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
import { lazy } from "react";

const help = lazy(() => import("@view/help/help"));
const nestedPage = lazy(() => import("@view/nested-page/NestedPage"));
const github = lazy(() => import("@view/github/Github"));
const securityDashboard = lazy(() => import("@view/security-dashboard/SecurityDashboard"));
const home = lazy(() => import("@view/home/Home"));
const admin = lazy(() => import("@view/admin/Admin"));
const githubSettings = lazy(() => import("@view/admin/github-settings/GithubSettings"));
const repositoryAccessRequests = lazy(
  () => import("@view/github/pages/repository-access/RepositoryAccessRequests"),
);
const repositoryCreationRequests = lazy(
  () => import("@view/github/pages/repository-creation-requests/RepositoryCreationRequests"),
);
const myRequests = lazy(() => import("@view/github/pages/view-requests/my-requests/MyRequests"));
const reviewRequests = lazy(
  () => import("@view/github/pages/view-requests/review-requests/ReviewRequests"),
);
export const View = {
  help,
  nestedPage,
  github,
  securityDashboard,
  home,
  admin,
  githubSettings,
  repositoryAccessRequests,
  repositoryCreationRequests,
  myRequests,
  reviewRequests,
};
