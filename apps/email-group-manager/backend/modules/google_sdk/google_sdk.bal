// Copyright (c) 2026, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerina/http;
import ballerina/url;

# Gets the email groups a user is a member of using the Admin SDK API.
#
# + userEmail - The email of the user to get groups for
# + return - An array of Email Group records or an error if the API call fails
public isolated function getEmailGroupsForUser(string userEmail) returns EmailGroup[]|error {
    string encodedUserEmail = check url:encode(userEmail, "UTF-8");
    string path = string `/admin/directory/v1/groups?userKey=${encodedUserEmail}`;
    http:Client adminClient = check getAdminClient();
    http:Response res = check adminClient->get(path);

    if res.statusCode != 200 {
        string errBody = check res.getTextPayload();
        return error(string `Admin SDK error ${res.statusCode}: ${errBody}`);
    }

    EmailGroupListResponse groupPage = check (check res.getJsonPayload()).cloneWithType();
    return groupPage.groups ?: [];
}

# Gets the default email groups that the default user is a member of.
#
# + return - An array of group email addresses or an error if the API call fails
public isolated function getDefaultEmailGroups() returns string[]|error {
    EmailGroup[] defaultEmailGroupsResponse = check getEmailGroupsForUser(defaultUser);
    string[] defaultEmailGroups = [];
    foreach EmailGroup group in defaultEmailGroupsResponse {
        defaultEmailGroups.push(group.email);
    }

    return defaultEmailGroups;
}

# Get the all email groups in the domain.
#
# + emailDomain - The email domain to get groups for
# + return - An array of group email addresses or an error if the API call fails
public isolated function getAllEmailGroupsInDomain(string emailDomain) returns string[]|error {
    string encodedEmailDomain = check url:encode(emailDomain, "UTF-8");
    string path = string `/admin/directory/v1/groups?domain=${encodedEmailDomain}`;
    http:Client adminClient = check getAdminClient();
    http:Response res = check adminClient->get(path);

    if res.statusCode != 200 {
        string errBody = check res.getTextPayload();
        return error(string `Admin SDK error ${res.statusCode}: ${errBody}`);
    }

    EmailGroupListResponse groupPage = check (check res.getJsonPayload()).cloneWithType();
    string[] emailGroups = [];
    foreach EmailGroup group in groupPage.groups ?: [] {
        emailGroups.push(group.email);
    }

    return emailGroups;
}

# Gets the email groups that the user can subscribe to.
#
# + return - An array of email group addresses or an error if the API call fails
public isolated function getUserSubscribableEmailGroups() returns string[]|error {
    EmailGroup[] subscribableEmailGroupsResponse = check getEmailGroupsForUser(publicGroupUser);
    string[] subscribableEmailGroups = [];
    foreach EmailGroup group in subscribableEmailGroupsResponse {
        subscribableEmailGroups.push(group.email);
    }

    return subscribableEmailGroups;
}

# Get given user subscribed private email groups.
#
# + userEmail - The email of the user to get subscribed private email groups for
# + return - An array of email group addresses or an error if the API call fails
public isolated function getUserSubscribedPrivateEmailGroups(string userEmail) returns string[]|error {
    EmailGroup[] subscribedEmailGroupsResponse = check getEmailGroupsForUser(userEmail);
    EmailGroup[] privateEmailGroupsResponse = check getEmailGroupsForUser(privateGroupUser);
    string[] privateEmailGroups = [];
    foreach EmailGroup group in subscribedEmailGroupsResponse {
        foreach EmailGroup privateGroup in privateEmailGroupsResponse {
            if group.email == privateGroup.email {
                privateEmailGroups.push(group.email);
                break;
            }
        }
    }

    return privateEmailGroups;
}

# Subscribes a user to a group using the Admin SDK API.
#
# + userEmail - The email of the user to subscribe
# + groupEmail - The email of the group to subscribe the user to
# + return - true if the subscription was successful, or an error if the API call fails
public isolated function subscribeUserToGroup(string userEmail, string groupEmail) returns boolean|error {
    string encodedGroupEmail = check url:encode(groupEmail, "UTF-8");
    string path = string `/admin/directory/v1/groups/${encodedGroupEmail}/members`;
    Member member = {email: userEmail, role: "MEMBER"};
    http:Client adminClient = check getAdminClient();
    http:Response res = check adminClient->post(path, member);

    if res.statusCode != 200 {
        string errBody = check res.getTextPayload();
        return error(string `Admin SDK error ${res.statusCode}: ${errBody}`);
    }

    return true;
}

# Unsubscribes a user from a group using the Admin SDK API.
#
# + userEmail - The email of the user to unsubscribe
# + groupEmail - The email of the group to unsubscribe the user from
# + return - true if the unsubscription was successful, or an error if the API call fails
public isolated function unsubscribeUserFromGroup(string userEmail, string groupEmail) returns boolean|error {
    string encodedGroupEmail = check url:encode(groupEmail, "UTF-8");
    string encodedUserEmail = check url:encode(userEmail, "UTF-8");
    string path = string `/admin/directory/v1/groups/${encodedGroupEmail}/members/${encodedUserEmail}`;
    http:Client adminClient = check getAdminClient();
    http:Response res = check adminClient->delete(path);

    if res.statusCode != 200 && res.statusCode != 204 {
        string errBody = check res.getTextPayload();
        return error(string `Admin SDK error ${res.statusCode}: ${errBody}`);
    }

    return true;
}

# Checks if a group is subscribable by checking if the public group user is a member of the group.
#
# + groupEmail - The email of the group to check
# + return - true if the group is subscribable, false if not, or an error
public isolated function checkGroupIsSubscribable(string groupEmail) returns boolean|error {
    string encodedGroupEmail = check url:encode(groupEmail, "UTF-8");
    string path = string `/admin/directory/v1/groups/${encodedGroupEmail}/members/${publicGroupUser}`;
    http:Client adminClient = check getAdminClient();
    http:Response res = check adminClient->get(path);

    if res.statusCode == 200 {
        return true;
    } else if res.statusCode == 404 {
        return false;
    } else {
        string errBody = check res.getTextPayload();
        return error(string `Admin SDK error ${res.statusCode}: ${errBody}`);
    }
}
