// Copyright (c) 2026, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import email_group_manager.authorization;
import email_group_manager.google_sdk;
import email_group_manager.people;
import email_group_manager.types;
import email_group_manager.utils;

import ballerina/cache;
import ballerina/http;
import ballerina/log;

final cache:Cache cache = new ({
    capacity: 2000,
    defaultMaxAge: 1800.0,
    cleanupInterval: 900.0
});

service http:InterceptableService / on new http:Listener(9090) {

    # Request interceptor.
    #
    # + return - authorization:JwtInterceptor, BadRequestInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
        [new authorization:JwtInterceptor(), new BadRequestInterceptor()];

    # Fetch logged-in user's details.
    #
    # + return - User information or InternalServerError
    resource function get user\-info(http:RequestContext ctx) returns UserInfo|http:InternalServerError {
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if cache.hasKey(userInfo.email) {
            UserInfo|error cachedUserInfo = cache.get(userInfo.email).ensureType();
            if cachedUserInfo is UserInfo {
                return cachedUserInfo;
            }
        }

        people:Employee|error? employee = people:fetchEmployee(userInfo.email);
        if employee is error {
            string customError = string `Error occurred while fetching user information: ${userInfo.email}`;
            log:printError(customError, employee);
            return <http:InternalServerError>{
                body: customError
            };
        }
        if employee is () {
            log:printError(string `No employee information found for the user: ${userInfo.email}`);
            return <http:InternalServerError>{
                body: {
                    message: "No information found for the user!"
                }
            };
        }

        int[] privileges = [];
        if authorization:checkPermissions([...authorization:authorizedRoles.EMPLOYEE_ROLE], userInfo.groups) {
            privileges.push(authorization:EMPLOYEE_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups) {
            privileges.push(authorization:SECURITY_ADMIN_PRIVILEGE);
        }

        UserInfo userInfoResponse = {...employee, privileges};

        error? cacheError = cache.put(userInfo.email, userInfoResponse);
        if cacheError is error {
            log:printError("An error occurred while writing user info to the cache", cacheError);
        }
        return userInfoResponse;
    }

    # Fetch logged-in user's email groups.
    #
    # + return - List of email groups or InternalServerError
    resource function get email\-groups/me(http:RequestContext ctx) returns string[]|http:InternalServerError {
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        google_sdk:EmailGroup[]|error userEmailGroups = google_sdk:getEmailGroupsForUser(userInfo.email);
        if userEmailGroups is error {
            log:printError(string `Error in getting user's email groups`, 'error = userEmailGroups,
                    stackTrace = userEmailGroups.stackTrace(), userEmail = userInfo.email);
            return http:INTERNAL_SERVER_ERROR;
        }

        string[] userEmailGroupEmails = [];
        foreach google_sdk:EmailGroup group in userEmailGroups {
            userEmailGroupEmails.push(group.email);
        }

        return userEmailGroupEmails;
    }

    # Fetch email groups based on the type.
    #
    # + 'type - EmailGroupsType to specify the type of email groups to be fetched (ALL, DEFAULT, PRIVATE, PUBLIC)
    # + return - List of email groups or InternalServerError
    resource function get email\-groups(http:RequestContext ctx, EmailGroupsTypes 'type) returns string[]|http:InternalServerError {
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        match 'type {
            ALL => {
                string[]|error allEmailGroups = google_sdk:getAllEmailGroupsInDomain(utils:emailDomain);
                if allEmailGroups is error {
                    log:printError(string `Error in getting all email groups`, 'error = allEmailGroups,
                            stackTrace = allEmailGroups.stackTrace(), userEmail = userInfo.email);
                    return <http:InternalServerError>{
                        body: {
                            message: "Error in getting all email groups"
                        }
                    };
                }

                return allEmailGroups;
            }
            DEFAULT => {
                string[]|error defaultEmailGroups = google_sdk:getDefaultEmailGroups();
                if defaultEmailGroups is error {
                    log:printError(string `Error in getting default email groups`, 'error = defaultEmailGroups,
                            stackTrace = defaultEmailGroups.stackTrace(), userEmail = userInfo.email);
                    return <http:InternalServerError>{
                        body: {
                            message: "Error in getting default email groups"
                        }
                    };
                }

                return defaultEmailGroups;
            }
            PUBLIC => {
                string[]|error publicEmailGroups = google_sdk:getUserSubscribableEmailGroups();
                if publicEmailGroups is error {
                    log:printError(string `Error in getting public email groups`, 'error = publicEmailGroups,
                            stackTrace = publicEmailGroups.stackTrace(), userEmail = userInfo.email);
                    return <http:InternalServerError>{
                        body: {
                            message: "Error in getting public email groups"
                        }
                    };
                }

                return publicEmailGroups;
            }
            PRIVATE => {
                string[]|error userSubscribedPrivateEmailGroups = google_sdk:getUserSubscribedPrivateEmailGroups(userInfo.email);
                if userSubscribedPrivateEmailGroups is error {
                    log:printError(string `Error in getting private email groups`, 'error = userSubscribedPrivateEmailGroups,
                            stackTrace = userSubscribedPrivateEmailGroups.stackTrace(), userEmail = userInfo.email);
                    return <http:InternalServerError>{
                        body: {
                            message: "Error in getting private email groups"
                        }
                    };
                }

                return userSubscribedPrivateEmailGroups;
            }
        }

        return [];
    }

    # Subscribe to a email group.
    #
    # + payload - Payload containing the user email and the group name to which the user wants to subscribe.
    # + return - Success message or InternalServerError or BadRequest
    resource function post email\-group/subscribe(http:RequestContext ctx, types:Payload payload)
        returns http:Ok|http:InternalServerError|http:BadRequest {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        string userEmail = userInfo.email;
        if authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups) && payload.user != userInfo.email {
            userEmail = payload.user;
        }

        string groupEmail = utils:createGroupEmailFromGroupName(payload.groupName);
        boolean|error res = google_sdk:checkGroupIsSubscribable(groupEmail);
        if res is error {
            log:printError(string `Error checking if the group is subscribable: ${payload.groupName}`, 'error = res,
                    stackTrace = res.stackTrace(), userEmail = userEmail);
            return <http:InternalServerError>{
                body: {
                    message: string `Error checking if the group is subscribable: ${payload.groupName}`
                }
            };
        }

        if res == false {
            log:printInfo(string `The group is not subscribable: ${payload.groupName}`, userEmail = userEmail);
            return <http:BadRequest>{
                body: {
                    message: string `The group is not subscribable: ${payload.groupName}`
                }
            };
        }

        boolean|error response = google_sdk:subscribeUserToGroup(userEmail, groupEmail);
        if response is error {
            log:printError(string `Error when subscribing to the google group: ${payload.groupName}`, 'error = response,
                    stackTrace = response.stackTrace(), userEmail = userEmail);
            return <http:InternalServerError>{
                body: {
                    message: string `Error when subscribing to the google group: ${payload.groupName}`
                }
            };
        }

        log:printInfo(string `Successfully subscribed to the google group: ${payload.groupName}`,
                userEmail = userEmail);

        return <http:Ok>{
            body: {
                message: string `Successfully subscribed to the google group: ${payload.groupName}`
            }
        };
    }

    # Unsubscribe from a email group.
    #
    # + payload - Payload containing the user email and the group name from which the user wants to unsubscribe.
    # + return - Success message or InternalServerError or BadRequest
    resource function post email\-group/unsubscribe(http:RequestContext ctx, types:Payload payload)
        returns http:Ok|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        string userEmail = userInfo.email;
        if authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups) && payload.user != userInfo.email {
            userEmail = payload.user;
        }

        string groupEmail = utils:createGroupEmailFromGroupName(payload.groupName);
        boolean|error response = google_sdk:unsubscribeUserFromGroup(userEmail, groupEmail);
        if response is error {
            log:printError(string `Error when unsubscribing from the google group: ${payload.groupName}`, 'error = response,
                    stackTrace = response.stackTrace(), userEmail = userEmail);
            return <http:InternalServerError>{
                body: {
                    message: string `Error when unsubscribing from the google group: ${payload.groupName}`
                }
            };
        }

        log:printInfo(string `Successfully unsubscribed from the google group: ${payload.groupName}`,
                userEmail = userEmail);

        return <http:Ok>{
            body: {
                message: string `Successfully unsubscribed from the google group: ${payload.groupName}`
            }
        };
    }
}
