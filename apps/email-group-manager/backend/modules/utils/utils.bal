// Copyright (c) 2026, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerina/regex;

public configurable string emailDomain = ?;

# Create a group email from a group name.
#
# + groupName - The name of the group to create the email for
# + return - The email of the group as a string
public isolated function createGroupEmailFromGroupName(string groupName) returns string {
    string groupEmail = regex:replace(groupName.toLowerAscii(), " ", "-") + "@" + emailDomain;
    return groupEmail;
}
