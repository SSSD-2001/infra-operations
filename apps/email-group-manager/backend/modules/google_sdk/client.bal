// Copyright (c) 2026, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerina/http;
import ballerina/jwt;
import ballerina/time;

configurable OAuthClientConfig config = ?;
configurable string defaultUser = ?;
configurable string publicGroupUser = ?;
configurable string privateGroupUser = ?;

isolated http:Client adminClient = check createAdminClient();
isolated time:Utc lastCreatedTime = time:utcNow();

isolated function createAdminClient() returns http:Client|error {
    string assertion = check jwt:issue(
            {
                issuer: config.issuer,
                audience: config.audience,
                expTime: 3600,
                customClaims: {
                    scope: config.scopes,
                    sub: config.subject
                },
                signatureConfig: {
                    config: {
                        keyStore: {
                            path: config.certPath,
                            password: config.password
                        },
                        keyAlias: config.keyAlias,
                        keyPassword: config.keyPassword
                    }
                }
            }
    );

    return new ("https://admin.googleapis.com", {
        auth: {
            tokenUrl: "https://oauth2.googleapis.com/token",
            assertion: assertion
        }
    });
}

isolated function getAdminClient() returns http:Client|error {
    time:Utc now = time:utcNow();

    boolean needsRefresh = false;

    lock {
        int diffSeconds = now[0] - lastCreatedTime[0];
        if (diffSeconds > 3300) {
            needsRefresh = true;
        }
    }

    if (needsRefresh) {
        lock {
            adminClient = check createAdminClient();

        }

        lock {
            lastCreatedTime = now;
        }
    }

    lock {
        return adminClient;
    }
}
