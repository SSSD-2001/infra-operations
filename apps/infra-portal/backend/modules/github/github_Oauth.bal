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
import ballerina/http;

configurable GitHubOauthAppConfig githubOauthAppConfig = ?;

# Verifies the company email using the code received from GitHub and the email of the user.
#
# + payload - The payload containing the code received from GitHub and the email of the user.
# + return - The response of the email verification containing the status and GitHub user details.
public isolated function verifyCompanyEmail(VerifyEmailPayload payload) returns EmailVerificationResponse|error {
    http:Client githubClient = check createGithubClient();
    return githubClient->/github/verify\-email.post(payload);
}
