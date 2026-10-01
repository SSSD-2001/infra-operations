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

# Search users from Asgardeo.
#
# + email - User email
# + return - Users result or error
public isolated function searchUser(string email) returns User[]|error {
    UserSearchResult response = check scimOperationsClient->/organizations/internal/users/search.post({
        domain: "DEFAULT",
        filter: string `userName eq ${email}`,
        attributes: ["id", "userName", "profileUrl", "urn:scim:wso2:schema", "urn:scim:schemas:extension:custom:User"]
    });
    return response.Resources;
}

# Update the GitHub user ID of a user in Asgardeo.
#
# + email - User email
# + githubUserId - GitHub user ID to set
# + return - Updated user or error
public isolated function updateGithubUserId(string email, string githubUserId) returns User|error? {
    User[] users = check searchUser(email);
    if users.length() == 0 {
        return ();
    }
    if users[0].urn\:scim\:schemas\:extension\:custom\:User?.githubUserId != githubUserId {
        return scimOperationsClient->/organizations/internal/users/[users[0].id].patch({githubUserId});
    }
    return users[0];
}
