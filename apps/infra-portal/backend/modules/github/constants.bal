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

# client retry configuration for max retry attempts.
public const int RETRY_COUNT = 3;

# client retry configuration for wait interval in seconds.
public const decimal RETRY_INTERVAL = 3.0;

# client retry configuration for interval increment in seconds.
public const float RETRY_BACKOFF_FACTOR = 2.0;

# client retry configuration for maximum wait interval in seconds.
public const decimal RETRY_MAX_INTERVAL = 20.0;

# Default limit for the entity.
public const int DEFAULT_LIMIT = 100;

# Internal committer team slug.
const string INTERNAL_COMMITTER_TEAM_SLUG = "wso2-internal-committers";

# External committer team slug.
const string EXTERNAL_COMMITTER_TEAM_SLUG = "wso2-external-committers";

# WsO2 all team slug.
const string WSO2_ALL_TEAM_SLUG = "wso2-all";

# WsO2 all interns team slug.
const string WSO2_ALL_INTERNS_TEAM_SLUG = "wso2-all-interns";

# Readonly team slug.
const string READONLY_TEAM_SLUG = "wso2-readonly";

# Default team access for permanent employees.
# Override in Config.toml for local/test orgs (defaults are production).
# - **wso2-support** > `wso2-support-readonly`
# - **wso2** > `wso2-readonly`
# - **wso2-extensions** > `wso2-readonly`
public configurable OrganizationAndTeam[] permanentDefaultTeamAccess = [
    {orgName: "wso2-support", teamSlug: "wso2-support-readonly"},
    {orgName: "wso2", teamSlug: "wso2-readonly"},
    {orgName: "wso2-extensions", teamSlug: "wso2-readonly"}
];

# Extra team access for Customer Success permanent employees.
# - **wso2-cs** > `cs-team`
# - **wso2-enterprise** > `customer-success-team`
public configurable OrganizationAndTeam[] csTeamAccess = [
    {orgName: "wso2-cs", teamSlug: "cs-team"},
    {orgName: "wso2-enterprise", teamSlug: "customer-success-team"}
];

# Organizations where interns receive default team membership.
public configurable string[] internsDefaultOrganizations = [
    "wso2",
    "wso2-extensions",
    "wso2-support",
    "ballerina-platform"
];

# Team slug granted to interns in each intern default organization.
public configurable string internsTeamSlug = "wso2-all-interns";
