// Copyright (c) 2026, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

# Google Service Account JWT config
type OAuthClientConfig record {|
    # Google's token endpoint URL for obtaining access tokens
    string audience;
    # Service account keystore file path (.p12 or .jks)
    string certPath;
    # Service account email
    string issuer;
    # Key alias (.p12/.jks only) 
    string keyAlias;
    # Key password (.p12/.jks only)
    string keyPassword;
    # Keystore password (.p12/.jks only)
    string password;
    # Space-separated scopes
    string scopes;
    # User to impersonate when using domain-wide delegation
    string subject;
|};

# Group record type representing a Google Group as returned by the Admin SDK API.
public type EmailGroup record {|
    # The unique identifier of the group
    string id;
    # The email address of the group
    string email;
    # The name of the group
    string name;
    # An optional description of the group
    string? description?;
    # The direct members count of the group, if available
    string? directMembersCount?;
    json...;
|};

# GroupListResponse record type representing the response from the Admin SDK API when listing groups.
type EmailGroupListResponse record {|
    # An array of Group records representing the groups returned by the API
    EmailGroup[] groups?;
    # A token to retrieve the next page of results, if pagination is used
    string? nextPageToken?;
    json...;
|};

# Member record type representing a group member to be added via the Admin SDK API.
type Member record {|
    # The email address of the member to be added to the group
    string email;
    # The role of the member in the group (e.g., "MEMBER", "OWNER", "MANAGER")
    string role;
    json...;
|};

