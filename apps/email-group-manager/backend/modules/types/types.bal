// Copyright (c) 2026, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

# JWT record.  
public type JwtRecord record {
    # User email as a string
    string email;
    # User groups as a string array
    string[] groups = [];
};

# Get User Info Response.
public type UserInfo record {|
    # User's thumbnail image URL
    string? image;
    # First name as a string
    string firstName;
    # Last name as a string
    string lastName;
    # Is user an admin or not as a boolean
    boolean isAdmin;
    # User email as a string
    string email;
|};

public type Payload record {|
    # Email of the user as a string
    string user;
    # Name of the google
    string groupName;
|};
