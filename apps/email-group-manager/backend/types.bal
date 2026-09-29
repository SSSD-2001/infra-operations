// Copyright (c) 2026, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import email_group_manager.people;

# Email groups types (ALL, DEFAULT, PRIVATE, PUBLIC).
enum EmailGroupsTypes {
    ALL,
    DEFAULT,
    PRIVATE,
    PUBLIC
};

# Response for fetching user information.
type UserInfo record {|
    *people:Employee;
    # Array of privileges assigned to the user
    int[] privileges;
    json...;
|};
