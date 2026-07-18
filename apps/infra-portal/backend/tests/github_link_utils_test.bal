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

import infra_portal.authorization;

import ballerina/test;

// Covers the in-process GitHub link fallback store and resolveGithubLinkStatus's use of it.
// Cases that would only be reachable by hitting GitHub/SCIM over the network (e.g. a JWT that
// already carries a githubUserId, which triggers a live gh:getUserDetails call) are intentionally
// left out so this suite stays deterministic and network-independent.

@test:Config {}
isolated function testStoreAndGetGithubLinkRoundTrip() {
    string email = "github-link-round-trip@wso2.com";

    storeGithubLink(email, "1111111", "octocat-test");
    GithubLinkEntry? stored = getStoredGithubLink(email);

    test:assertTrue(stored is GithubLinkEntry, "expected a stored link entry");
    if stored is GithubLinkEntry {
        test:assertEquals(stored.githubUserId, "1111111");
        test:assertEquals(stored.githubUsername, "octocat-test");
    }
}

@test:Config {}
isolated function testStoreGithubLinkOverwritesExistingEntry() {
    string email = "github-link-overwrite@wso2.com";

    storeGithubLink(email, "2222222", "first-username");
    storeGithubLink(email, "3333333", "second-username");
    GithubLinkEntry? stored = getStoredGithubLink(email);

    test:assertTrue(stored is GithubLinkEntry, "expected a stored link entry");
    if stored is GithubLinkEntry {
        test:assertEquals(stored.githubUserId, "3333333");
        test:assertEquals(stored.githubUsername, "second-username");
    }
}

@test:Config {}
isolated function testGetStoredGithubLinkReturnsNilWhenNeverLinked() {
    GithubLinkEntry? stored = getStoredGithubLink("never-linked-user@wso2.com");
    test:assertTrue(stored is (), "expected no stored link for an email that was never linked");
}

@test:Config {}
isolated function testResolveGithubLinkStatusPrefersJwtClaimUsernameFromStore() {
    string email = "resolve-fallback-user@wso2.com";
    storeGithubLink(email, "4444444", "fallback-username");

    authorization:CustomJwtPayload userInfo = {
        sub: "sub-fallback",
        email: email,
        groups: ["wso2-everyone"]
    };

    [string?, string?] result = resolveGithubLinkStatus(userInfo);

    test:assertEquals(result[0], "4444444");
    test:assertEquals(result[1], "fallback-username");
}

@test:Config {}
isolated function testResolveGithubLinkStatusReturnsNilsWhenNoLinkExistsAnywhere() {
    authorization:CustomJwtPayload userInfo = {
        sub: "sub-no-link",
        email: "no-github-link-1a9f3e@wso2.com",
        groups: ["wso2-everyone"]
    };

    [string?, string?] result = resolveGithubLinkStatus(userInfo);

    test:assertTrue(result[0] is (), "expected no GitHub user ID when no link exists");
    test:assertTrue(result[1] is (), "expected no GitHub username when no link exists");
}
