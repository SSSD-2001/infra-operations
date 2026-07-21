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

import infra_portal.github as gh;

import ballerina/test;

@test:Config {}
function testDefaultRepositoryAccessConfigIsPopulated() {
    test:assertTrue(gh:permanentDefaultTeamAccess.length() > 0,
            "permanentDefaultTeamAccess must define at least one org/team");
    test:assertTrue(gh:csTeamAccess.length() > 0,
            "csTeamAccess must define at least one org/team");
    test:assertTrue(gh:internsDefaultTeamAccess.length() > 0,
            "internsDefaultTeamAccess must define at least one org/team");

    foreach gh:OrganizationAndTeam entry in [
        ...gh:permanentDefaultTeamAccess,
        ...gh:csTeamAccess,
        ...gh:internsDefaultTeamAccess
    ] {
        test:assertTrue(entry.orgName.length() > 0, "orgName must be non-empty");
        test:assertTrue(entry.teamSlug.length() > 0, "teamSlug must be non-empty");
    }
}
