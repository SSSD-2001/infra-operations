# Email Group Manager Backend Service

Ballerina service for managing Google group subscriptions for employees.

## Overview

The service exposes APIs to:

- read the current user's profile information from the HR entity service
- list default, public, private, user-specific, and domain-wide Google Groups
- subscribe and unsubscribe a user from a Google group through Google Admin SDK

The service listens on port 9090.

## Prerequisites

- Ballerina 2201.7.1
- Google Workspace Admin SDK access
- A configured HR GraphQL endpoint
- A valid JWT in the x-jwt-assertion header for protected endpoints

## Configuration

Update Config.toml before running the service.

### Google SDK configuration

- email_group_manager.google_sdk.defaultUser
- email_group_manager.google_sdk.publicGroupUser
- email_group_manager.google_sdk.privateGroupUser
- email_group_manager.google_sdk.config.audience
- email_group_manager.google_sdk.config.certPath
- email_group_manager.google_sdk.config.issuer
- email_group_manager.google_sdk.config.keyAlias
- email_group_manager.google_sdk.config.keyPassword
- email_group_manager.google_sdk.config.password
- email_group_manager.google_sdk.config.scopes
- email_group_manager.google_sdk.config.subject

### HR entity configuration

- email_group_manager.entity.hrEntityEndpoint
- email_group_manager.entity.clientAuthConfig.clientId
- email_group_manager.entity.clientAuthConfig.clientSecret
- email_group_manager.entity.clientAuthConfig.tokenUrl

### Utility configuration

- email_group_manager.utils.adminRole
- email_group_manager.utils.emailDomain

## Run locally

From the project root:

```bash
bal run
```

## API v1.0

All endpoints below require the x-jwt-assertion header unless noted otherwise.

### GET /user-info

Returns the logged-in user's profile information.

#### Response 200

```json
{
  "image": "https://path.to.user.google.profile.image",
  "firstName": "Tom",
  "lastName": "Jones",
  "isAdmin": false,
  "email": "user1@domain.com"
}
```

#### Possible responses

- 200 OK
- 401 Unauthorized
- 500 Internal Server Error

### GET /default-google-groups

Returns the default Google Groups assigned to all employees.

#### Response 200

```json
["info@domain.com", "news@domain.com", "help@domain.com"]
```

#### Possible responses

- 200 OK
- 401 Unauthorized
- 500 Internal Server Error

### GET /public-google-groups

Returns Google Groups that the user can subscribe to and unsubscribe from.

#### Response 200

```json
["department-x@domain.com", "team-x@domain.com"]
```

#### Possible responses

- 200 OK
- 401 Unauthorized
- 500 Internal Server Error

### GET /private-google-groups

Returns Google Groups that the user is subscribed to but cannot unsubscribe from.

#### Response 200

```json
["news@domain.com", "help@domain.com"]
```

#### Possible responses

- 200 OK
- 401 Unauthorized
- 500 Internal Server Error

### GET /user-google-groups

Returns all Google Groups the user is currently subscribed to.

#### Response 200

```json
[
  "info@domain.com",
  "news@domain.com",
  "help@domain.com",
  "my-department@domain.com",
  "my-team@domain.com"
]
```

#### Possible responses

- 200 OK
- 401 Unauthorized
- 500 Internal Server Error

### GET /all-google-groups

Returns all Google Groups in the configured email domain.

#### Response 200

```json
[
  "info@domain.com",
  "news@domain.com",
  "help@domain.com",
  "my-department@domain.com",
  "department-x@domain.com",
  "department-y@domain.com",
  "department-z@domain.com",
  "my-team@domain.com",
  "team-x@domain.com",
  "team-y@domain.com"
]
```

#### Possible responses

- 200 OK
- 401 Unauthorized
- 500 Internal Server Error

### PATCH /google-group/subscribe

Subscribes the authenticated user to a Google group.

#### Request body

```json
{
  "groupName": "department-x"
}
```

The group name is converted into a Google group email using the configured email domain.

#### Possible responses

- 200 OK
- 400 Bad Request if the group is not subscribable
- 401 Unauthorized
- 500 Internal Server Error

### PATCH /google-group/unsubscribe

Unsubscribes the authenticated user from a Google group.

#### Request body

```json
{
  "groupName": "department-x"
}
```

#### Possible responses

- 200 OK
- 401 Unauthorized
- 500 Internal Server Error
