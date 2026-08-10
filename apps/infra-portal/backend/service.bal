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
import infra_portal.authorization;
import infra_portal.database as db;
import infra_portal.email;
import infra_portal.entity;
import infra_portal.github as gh;
import infra_portal.scim;

import ballerina/cache;
import ballerina/http;
import ballerina/log;

configurable SecurityDashboardLinks securityDashboardLinks = ?;

final cache:Cache cache = new ({
    capacity: 2000,
    defaultMaxAge: 1800.0,
    cleanupInterval: 900.0
});

@display {
    label: "Infra Portal Backend Service",
    id: "digiops-infra/infra-portal"
}
service class ErrorInterceptor {
    *http:ResponseErrorInterceptor;

    remote function interceptResponseError(error err, http:RequestContext ctx) returns http:BadRequest|error {
        // Handle data-binding errors.
        if err is http:PayloadBindingError {
            string customError = "Payload binding failed!";
            log:printError(customError, err);
            return {
                body: {
                    message: customError
                }
            };
        }
        return err;
    }
}

service http:InterceptableService / on new http:Listener(8090) {

    # Request interceptor.
    #
    # + return - authorization:JwtInterceptor, ErrorInterceptor
    public function createInterceptors() returns http:Interceptor[] => [
        new authorization:JwtInterceptor(),
        new ErrorInterceptor()
    ];

    # Fetch user information of the logged in users.
    #
    # + ctx - Request object
    # + return - User information | Error
    resource function get user\-info(http:RequestContext ctx) returns UserInfoResponse|http:NotFound|http:InternalServerError {

        // User information header.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        // Check if the employees are already cached.
        if cache.hasKey(userInfo.email) {
            UserInfoResponse|error cachedUserInfo = cache.get(userInfo.email).ensureType();
            if cachedUserInfo is UserInfoResponse {
                return cachedUserInfo;
            }
        }

        // Fetch the user information from the entity service.
        entity:Employee|error? loggedInUser = entity:fetchEmployeesBasicInfo(userInfo.email);
        if loggedInUser is error {
            string customError = "Error occurred while retrieving user data!";
            log:printError(customError, loggedInUser);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if loggedInUser is () {
            string customError = "User information not found!";
            log:printError(customError);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        // Fetch the user's privileges based on the roles.
        int[] privileges = [];
        if authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            privileges.push(authorization:EMPLOYEE_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.approver], userInfo.groups) {
            privileges.push(authorization:APPROVER_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            privileges.push(authorization:ADMIN_PRIVILEGE);
        }

        string? githubUserId = userInfo.githubUserId;
        string? githubUsername = ();
        if githubUserId is string {
            gh:GitHubUser|error githubUser = gh:getUserDetails(githubUserId);
            if githubUser is error {
                string customError = "Error while fetching GitHub username for user-info!";
                log:printError(customError, 'error = githubUser, email = userInfo.email);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }
            githubUsername = githubUser.login;
        }

        UserInfoResponse userInfoResponse = {
            employeeId: loggedInUser.employeeId,
            workEmail: loggedInUser.workEmail,
            firstName: loggedInUser.firstName,
            lastName: loggedInUser.lastName,
            jobRole: loggedInUser.jobRole,
            employeeThumbnail: loggedInUser.employeeThumbnail,
            department: loggedInUser.department,
            team: loggedInUser.team,
            employmentType: loggedInUser.employmentType,
            privileges,
            githubUserId,
            githubUsername
        };

        error? cacheError = cache.put(userInfo.email, userInfoResponse);
        if cacheError is error {
            log:printWarn("An error occurred while writing user info to the cache", cacheError);
        }

        return userInfoResponse;
    }

    # Fetch employee information.
    #
    # + ctx - Request object
    # + return - Employee information | Error
    resource function get employee\-info(http:RequestContext ctx, string email)
        returns entity:Employee|http:Forbidden|http:NotFound|http:InternalServerError {

        // User information header.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        // Fetch the user information from the entity service.
        entity:Employee|error? employee = entity:fetchEmployeesBasicInfo(email);
        if employee is error {
            string customError = "Error occurred while retrieving employee data!";
            log:printError(customError, employee);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if employee is () {
            string customError = "Employee information not found!";
            log:printError(customError);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        return employee;
    }

    # Fetch list of employees.
    #
    # + ctx - Request object
    # + return - List  of employees | Error
    resource function get employees(http:RequestContext ctx)
        returns entity:EmployeeBasic[]|http:Forbidden|http:InternalServerError {

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        // Check if the employees are already cached.
        if cache.hasKey(EMPLOYEES_CACHE_KEY) {
            entity:EmployeeBasic[]|error cachedEmployees = cache.get(EMPLOYEES_CACHE_KEY).ensureType();
            if cachedEmployees is entity:EmployeeBasic[] {
                return cachedEmployees;
            }
        }

        entity:EmployeeBasic[]|error employees = entity:getEmployees();
        if employees is error {
            string customError = "Error occurred while retrieving employees!";
            log:printError(customError, employees);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Sort employees by email in ascending order.
        entity:EmployeeBasic[] sortedEmployees = from entity:EmployeeBasic employee in employees
            order by employee.workEmail.toLowerAscii() ascending
            select employee;

        error? cacheError = cache.put(EMPLOYEES_CACHE_KEY, sortedEmployees);
        if cacheError is error {
            log:printError("Error occurred while writing employees to the cache!", cacheError);
        }

        return sortedEmployees;
    }

    # Get all repository requests (with filtering by user or lead ID).
    # Used to get requests to be displayed in the frontend.
    #
    # + memberEmail - email of the member (optional)
    # + leadEmail - email of the lead (optional)
    # + approvalState - state of the request (optional)
    # + repoName - name of the repository (optional)
    # + 'limit - number of records to return (optional)
    # + offset - number of records to skip (optional)
    # + return - array of repository requests or error
    isolated resource function get repository\-requests(http:RequestContext ctx, string? memberEmail,
            string? leadEmail, db:RepositoryRequestState? approvalState, int? 'limit, int? offset, string? repoName)
            returns RepositoryRequestsListResponse|http:Forbidden|http:InternalServerError {

        log:printDebug("Fetching repository requests");

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        db:RepositoryRequest[]|error repoRequests =
            db:getRepositoryRequests({
                                         memberEmail: memberEmail,
                                         leadEmail: leadEmail,
                                         approvalState: approvalState,
                                         'limit: 'limit,
                                         offset: offset,
                                         repoName: repoName
                                     });

        if repoRequests is error {
            string customError = "Error occurred while retrieving the repository requests!";
            log:printError(customError, repoRequests);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        int totalCount = (repoRequests.length() > 0) ? repoRequests[0].totalCount : 0;
        int pendingCount = (repoRequests.length() > 0) ? repoRequests[0].pendingCount : 0;
        int approvedCount = (repoRequests.length() > 0) ? repoRequests[0].approvedCount : 0;
        int rejectedCount = (repoRequests.length() > 0) ? repoRequests[0].rejectedCount : 0;

        return {
            totalCount: totalCount,
            pendingCount: pendingCount,
            approvedCount: approvedCount,
            rejectedCount: rejectedCount,
            repositoryRequests: repoRequests
        };
    }

    # Get a specific repository request by ID.
    # used to get a specific request details to be displayed in the frontend.
    #
    # + id - ID of the repository request
    # + return - repository request object or error
    isolated resource function get repository\-requests/[int id](http:RequestContext ctx)
        returns db:RepositoryRequest|http:Forbidden|http:InternalServerError|http:NotFound {

        log:printDebug(string `Fetching repository request with ID: ${id}`);

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        db:RepositoryRequest|error? repoRequest = db:getRepositoryRequest(id);
        if repoRequest is error {
            string customError = "Error occurred while retrieving the repository request!";
            log:printError(customError, repoRequest);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if repoRequest is () {
            string customError = "Repository Request Not Found!";
            log:printError(customError, repoRequest);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        return repoRequest;
    }

    # Create a new repository request.
    #
    # + request - repository request object
    # + return - http:Created or http error
    resource function post repository\-requests(http:RequestContext ctx, db:RepositoryRequestCreate request)
        returns http:Created|http:Forbidden|http:InternalServerError {

        log:printDebug("Adding a new repository request");

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        db:RepositoryRequest|error response = db:insertRepositoryRequest(request);
        if response is error {
            string customError = string `Error occurred while adding repository ${request.repoName}!`;
            log:printError(customError, response);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        error? emailError = email:sendNewRepoRequestEmail(response);
        if emailError is error {
            log:printError("Error while sending email!", emailError);
        }

        return http:CREATED;
    }

    # Update a repository request by ID.
    #
    # + id - ID of the repository request
    # + updatedData - repository request object
    # + return - http:NoContent or error
    resource function patch repository\-requests/[int id](http:RequestContext ctx, db:RepositoryRequestUpdate
            updatedData) returns http:Ok|http:Forbidden|http:InternalServerError|http:NotFound {

        log:printDebug(string `Updating repository request with ID: ${id}`);

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        db:RepositoryRequest|error? oldRepoRequest = db:getRepositoryRequest(id);
        if oldRepoRequest is error {
            string customError = "Error while retrieving repository request!";
            log:printError(customError, oldRepoRequest);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if oldRepoRequest is () {
            string customError = string `No repository request found with ID: ${id}`;
            log:printError(customError);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        error? result = db:updateRepositoryRequest(id, updatedData);
        if result is error {
            string customError = "Error updating repository request!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        db:RepositoryRequest|error? updatedRepoRequest = db:getRepositoryRequest(id);
        if updatedRepoRequest is error {
            string customError = "Error while retrieving repository request!";
            log:printError(customError, updatedRepoRequest);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if updatedRepoRequest is () {
            string customError = string `No repository request found with ID: ${id}`;
            log:printError(customError);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        error? emailError = email:updateRepoRequestAlert(oldRepoRequest, updatedRepoRequest);
        if emailError is error {
            log:printError("Error while sending email!", emailError);
        }

        return http:OK;
    }

    # Reject a repository request.
    #
    # + id - ID of the repository request
    # + return - http:NoContent or error
    resource function patch repository\-requests/[int id]/reject(http:RequestContext ctx)
        returns http:Ok|http:Forbidden|http:InternalServerError|http:NotFound {

        log:printDebug(string `Rejecting repository request with ID: ${id}`);

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions(
                [authorization:authorizedRoles.approver, authorization:authorizedRoles.admin], userInfo.groups) {

            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        db:RepositoryRequest|error? repositoryRequest = db:getRepositoryRequest(id);
        if repositoryRequest is error {
            string customError = "Error while retrieving repository request!";
            log:printError(customError, repositoryRequest);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if repositoryRequest is () {
            string customError = string `No repository request found with ID: ${id}`;
            log:printError(customError);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        error? response = db:rejectRepositoryRequest(id);
        if response is error {
            string customError = "Error while rejecting repository request!";
            log:printError(customError, response);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        error? emailError = email:rejectRepoRequestAlert(repositoryRequest);
        if emailError is error {
            log:printError("Error while sending email!", emailError);
        }

        return http:OK;
    }

    # Approve a repository request by ID and create the repository in GitHub.
    #
    # + id - ID of the repository request
    # + return - http:NoContent or error
    resource function patch repository\-requests/[int id]/approve(http:RequestContext ctx)
        returns http:NotFound|http:Forbidden|http:BadRequest|http:InternalServerError|http:Ok {

        log:printDebug(string `Creating repository request with ID: ${id}`);

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions(
                [authorization:authorizedRoles.approver, authorization:authorizedRoles.admin], userInfo.groups) {

            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        // Update repository request.
        db:RepositoryRequest|error? repoRequest = db:getRepositoryRequest(id);
        if repoRequest is error {
            string customError = "Error while retrieving repository request!";
            log:printError(customError, repoRequest);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if repoRequest is () {
            string customError = "Repository Request Not Found!";
            log:printError(customError, repoRequest);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }
        // check if the repository request is already approved
        if repoRequest.state == db:APPROVED {
            string customError = "Repository Request is already approved!";
            log:printWarn(customError);
            return <http:BadRequest>{
                body: {
                    message: customError
                }
            };
        }
        if repoRequest.state == db:REJECTED {
            string customError = "Repository Request is already rejected!";
            log:printWarn(customError);
            return <http:BadRequest>{
                body: {
                    message: customError
                }
            };
        }

        // create the repository in github
        gh:GitHubOperationResult[] repoCreationResponse = createGitHubRepository(repoRequest);
        // check for errors while creating the repository
        foreach gh:GitHubOperationResult result in repoCreationResponse {
            if result.operation == gh:CREATE_REPO && result.status == gh:FAILURE {
                string customError = string `Error while creating repository: ${result.errorMessage}`;
                log:printError(customError);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            } else if result.status == gh:FAILURE || result.status == gh:PARTIAL_FAILURE {
                log:printWarn(string `Error: ${result.operation}`, error(result.errorMessage));
            } else if result.status == gh:SUCCESS {
                log:printInfo(string `Success: ${result.operation}`);
            }
        }

        // update the approval state of the repository request
        error? updateApprovalState = db:approveRepositoryRequest(id);
        if updateApprovalState is error {
            string customError = "Error while updating approval state!";
            log:printError(customError, updateApprovalState);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        error? emailError = email:approveRepoRequestAlert(repoRequest, repoCreationResponse);
        if emailError is error {
            log:printError("Error while sending email!", emailError);
        }

        return http:OK;
    }

    # Add a comment to a repository request.
    #
    # + id - ID of the repository request
    # + comment - Comment object containing author email and comment text
    # + return - http:Created or error
    isolated resource function post repository\-requests/[int id]/comments(http:RequestContext ctx, Comment comment)
        returns http:Created|http:InternalServerError|http:Forbidden|http:NotFound {

        log:printDebug(string `Adding comment to repository request with ID: ${id}`);

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        error? result = db:addRepositoryRequestComment(id, comment.authorEmail, comment.commentText);
        if result is error {
            string customError = "Error while adding comment!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        db:RepositoryRequest|error? repoRequest = db:getRepositoryRequest(id);
        if repoRequest is error {
            string customError = "Error while retrieving repository request!";
            log:printError(customError, repoRequest);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if repoRequest is () {
            string customError = string `No repository request found with ID: ${id}`;
            log:printError(customError);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        map<string> payload = createKeyValuePair(repoRequest);
        payload["comment"] = comment.commentText;

        email:EmailDetails emailDetails = {
            userEmail: userInfo.email,
            leadEmail: repoRequest.leadEmail,
            ccList: repoRequest.ccList,
            id: repoRequest.id.toString()
        };

        error? emailError = email:commentRepoRequestAlert(comment, emailDetails, id);
        if emailError is error {
            log:printError("Error while sending email!", emailError);
        }

        return http:CREATED;
    }

    # Get all comments for a repository request.
    #
    # + id - ID of the repository request
    # + return - array of comments or error
    isolated resource function get repository\-requests/[int id]/comments(http:RequestContext ctx)
        returns db:RepositoryRequestComment[]|http:InternalServerError|http:Forbidden|http:NotFound {

        log:printDebug(string `Fetching comments for repository request with ID: ${id}`);

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        db:RepositoryRequestComment[]|error comments = db:getRepositoryRequestComments(id);
        if comments is error {
            string customError = "Error while fetching comments!";
            log:printError(customError, comments);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return comments;
    }

    # Get the list of internal committer teams in a GitHub organization.
    # Used to update frontend forms
    #
    # + organization - selected organization
    # + return - list of teams
    isolated resource function get teams(http:RequestContext ctx, string organization)
        returns string[]|http:Forbidden|http:InternalServerError {

        log:printDebug("Fetching internal committer teams from github");

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        string[]|error teams = gh:getInternalCommitterTeams(organization);
        if teams is error {
            string customError = string `Error occurred while retrieving teams for organization: ${organization}!`;
            log:printError(customError, teams);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return teams;
    }

    # Get the list of organizations.
    # Used to update frontend forms.
    #
    # + return - list of organizations or error
    isolated resource function get organizations(http:RequestContext ctx)
        returns db:Organization[]|http:Forbidden|http:InternalServerError {

        log:printDebug("Fetching organizations from the database");

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        db:Organization[]|error organizations = db:getOrganizations();
        if organizations is error {
            string customError = "Error occurred while retrieving organizations!";
            log:printError(customError, organizations);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return organizations;
    }

    # Add a new organization to the database.
    # Checks whether the organization can be reached before adding to database.
    #
    # + newOrganization - new organization object
    # + return - http:Created or error
    isolated resource function post organizations(http:RequestContext ctx, Organization newOrganization)
        returns http:Created|http:Forbidden|http:InternalServerError {

        log:printDebug(string `Adding new organization: ${newOrganization.organizationName}`);

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        // check if organization exists in github
        string|error orgStatus = gh:verifyOrganization(newOrganization.organizationName);
        if orgStatus is error {
            string customError = "Error occurred while verifying organization!";
            log:printError(customError, orgStatus);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        error? result = db:upsertOrganization(
                newOrganization.organizationName,
                newOrganization.organizationVisibility,
                orgStatus,
                newOrganization.enableIssues,
                newOrganization.teamIds
        );
        if result is error {
            string customError = "Error while adding organization to database!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return http:CREATED;
    }

    # Get a specific organization by ID.
    #
    # + id - Organization ID
    # + return - Organization object or error
    isolated resource function get organizations/[int id](http:RequestContext ctx)
        returns db:Organization|http:InternalServerError|http:Forbidden {

        log:printDebug(string `Fetching organization with ID: ${id} from the database`);

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        db:Organization|error organization = db:getOrganizationById(id);
        if organization is error {
            string customError = "Error occurred while retrieving organization!";
            log:printError(customError, organization, organizationId = id);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return organization;
    }

    # Update an organization in the database.
    #
    # + id - Organization ID
    # + updatedOrganization - Updated organization object
    # + return - http:Ok or error
    isolated resource function put organizations/[int id](http:RequestContext ctx, Organization updatedOrganization)
        returns http:Ok|http:Forbidden|http:InternalServerError {

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        db:Organization|error currentOrganization = db:getOrganizationById(id);
        if currentOrganization is error {
            log:printError("Error while fetching organization: ", currentOrganization);
            return <http:InternalServerError>{
                body: {
                    message: "Error while fetching organization"
                }
            };
        }

        // check if organization exists in github
        string|error organizationPlan = gh:verifyOrganization(updatedOrganization.organizationName);
        if organizationPlan is error {
            string customError = "Error occurred while verifying organization!";
            log:printError(customError, organizationPlan);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        error? result = db:upsertOrganization(
                updatedOrganization.organizationName,
                updatedOrganization.organizationVisibility,
                organizationPlan,
                updatedOrganization.enableIssues,
                updatedOrganization.teamIds
        );

        if result is error {
            string customError = "Error while updating organization!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return http:OK;
    }

    # Sync an organization's plan with GitHub.
    #
    # + organizationName - Name of the organization
    # + return - http:Ok or error
    isolated resource function patch organizations/[string organizationName]/sync\-plan(http:RequestContext ctx)
        returns http:Ok|http:Forbidden|http:InternalServerError {

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        // check for organization existence in github
        string|error organizationPlan = gh:verifyOrganization(organizationName);
        if organizationPlan is error {
            string customError = "Error occurred while verifying organization!";
            log:printError(customError, organizationPlan);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        error? result = db:syncOrganizationPlan(organizationName, organizationPlan);

        if result is error {
            string customError = "Error while syncing organization plan!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return http:OK;
    }

    # Delete an organization from the database.
    #
    # + id - ID of the organization
    # + return - http:NoContent or error
    isolated resource function delete organizations/[int id](http:RequestContext ctx)
        returns http:Ok|http:BadRequest|http:Forbidden|http:InternalServerError {

        log:printDebug(string `Deleting organization with ID: ${id}`);

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        db:InvalidOperationError|error? result = db:deleteOrganization(id);
        if result is db:InvalidOperationError {
            log:printError(result.message(), result);
            return <http:BadRequest>{
                body: {
                    message: result.message()
                }
            };
        }
        if result is error {
            string customError = "Error while deleting organization!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return <http:Ok>{
            body: "Organization deleted successfully"
        };
    }

    # Get the list of topics.
    #
    # + return - list of topics or error
    isolated resource function get topics(http:RequestContext ctx)
        returns db:Topic[]|http:Forbidden|http:InternalServerError {

        log:printDebug("Fetching topics from the database");

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        db:Topic[]|error topics = db:getTopics();
        if topics is error {
            string customError = "Error occurred while retrieving topics!";
            log:printError(customError, topics);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return topics;
    }

    # Add a new topic to the database.
    #
    # + newTopic - new topic object
    # + return - http:Created or error
    isolated resource function post topics(http:RequestContext ctx, Topic newTopic)
        returns http:Created|http:Forbidden|http:InternalServerError {

        log:printDebug("Adding new topic");

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        error? result = db:upsertTopic(newTopic.topicName);
        if result is error {
            string customError = "Error while adding topic!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return http:CREATED;
    }

    # Update a topic.
    #
    # + id - Topic ID
    # + updatedTopic - Updated topic object
    # + return - http:Ok or error
    isolated resource function put topics/[int id](http:RequestContext ctx, Topic updatedTopic)
        returns http:Ok|http:Forbidden|http:InternalServerError {

        log:printDebug(string `Updating topic with ID: ${id}`);

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }
        error? result = db:updateTopic(id, updatedTopic.topicName);
        if result is error {
            string customError = "Error while updating topic!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return http:OK;
    }

    # Delete a topic from the database.
    #
    # + id - ID of the topic
    # + return - http:Ok or error
    isolated resource function delete topics/[int id](http:RequestContext ctx)
        returns http:Ok|http:Forbidden|http:InternalServerError {

        log:printDebug(string `Deleting topic with ID: ${id}`);

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        error? result = db:deleteTopic(id);
        if result is error {
            string customError = "Error while deleting topic!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Topic deleted successfully"
            }
        };
    }

    # Get the list of leads.
    #
    # + return - list of leads or error
    isolated resource function get leads(http:RequestContext ctx)
        returns db:TeamLead[]|http:Forbidden|http:InternalServerError {

        log:printDebug("Fetching leads from the database");

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        db:TeamLead[]|error leads = db:getLeads();
        if leads is error {
            string customError = "Error occurred while retrieving leads!";
            log:printError(customError, leads);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return leads;
    }

    # Add a new lead to the database.
    #
    # + newLead - new lead object
    # + return - http:Created or error
    isolated resource function post leads(http:RequestContext ctx, TeamLead newLead)
        returns http:Created|http:Forbidden|http:InternalServerError {

        log:printDebug("Adding new lead");

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        error? result = db:upsertLead(newLead.leadEmail, newLead.teamName);
        if result is error {
            string customError = "Error while adding leads!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return http:CREATED;
    }

    # Update a lead.
    #
    # + updatedLead - Updated lead object
    # + return - http:Ok or error
    isolated resource function put leads/[int id](http:RequestContext ctx, TeamLead updatedLead)
        returns http:Ok|http:Forbidden|http:InternalServerError {

        log:printDebug(string `Updating lead with ID: ${id}`);

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        error? result = db:updateLead(id, updatedLead.leadEmail, updatedLead.teamName);
        if result is error {
            string customError = "Error while updating lead!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return http:OK;
    }

    # Delete a lead from the database.
    #
    # + id - ID of the lead
    # + return - http:NoContent or error
    isolated resource function delete leads/[int id](http:RequestContext ctx)
        returns http:Ok|http:BadRequest|http:Forbidden|http:InternalServerError {

        log:printDebug(string `Deleting lead with ID: ${id}`);

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        db:InvalidOperationError|error? result = db:deleteLead(id);
        if result is db:InvalidOperationError {
            log:printError(result.toString());
            return <http:BadRequest>{
                body: {
                    message: result.message()
                }
            };
        }
        if result is error {
            string customError = "Error while deleting lead!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return <http:Ok>{
            body: "Lead deleted successfully"
        };
    }

    # Get all default teams.
    #
    # + return - list of default teams or error
    isolated resource function get default\-teams(http:RequestContext ctx)
        returns db:DefaultTeam[]|http:Forbidden|http:InternalServerError {

        log:printDebug("Fetching default teams from the database");

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        db:DefaultTeam[]|error result = db:getDefaultTeams();
        if result is error {
            string customError = "Error while fetching default teams!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return result;
    }

    # Add a new default team to the database.
    #
    # + payload - new default team object
    # + return - http:Created or error
    isolated resource function post default\-teams(http:RequestContext ctx, DefaultTeam payload)
        returns http:Created|http:Forbidden|http:InternalServerError {

        log:printDebug(string `Adding new default team: ${payload.teamName}`);
        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        error? result = db:upsertDefaultTeam(payload.teamName, payload.permissionLevel);
        if result is error {
            string customError = "Error while adding default team!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return http:CREATED;
    }

    # Update a default team in the database.
    #
    # + id - ID of the default team
    # + updatedTeam - Updated default team object
    # + return - http:Ok or error
    isolated resource function put default\-teams/[int id](http:RequestContext ctx, DefaultTeam updatedTeam)
        returns http:Ok|http:Forbidden|http:InternalServerError {

        log:printDebug(string `Updating default team with ID: ${id}`);
        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        error? result = db:updateDefaultTeam(id, updatedTeam.teamName, updatedTeam.permissionLevel);
        if result is error {
            string customError = "Error while updating default team!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return http:OK;
    }

    # Delete a default team from the database.
    #
    # + id - ID of the default team
    # + return - http:Ok or error
    isolated resource function delete default\-teams/[int id](http:RequestContext ctx)
        returns http:Ok|http:Forbidden|http:InternalServerError {

        log:printDebug(string `Deleting default team with ID: ${id}`);

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        error? result = db:deleteDefaultTeam(id);
        if result is error {
            string customError = "Error while deleting default team!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Default team deleted successfully"
            }
        };
    }

    # Get security dashboard links from the configuration.
    #
    # + return - SecurityDashboardLinks object or error
    isolated resource function get security\-dashboard\-links(http:RequestContext ctx)
        returns SecurityDashboardLinks|http:Forbidden|http:InternalServerError {

        log:printDebug("Fetching security dashboard links from the configuration");

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        return securityDashboardLinks;
    }

    # Get fine-grained access tokens of the organization.
    #
    # + return - List of successful responses and failed responses or error
    isolated resource function get fine\-grained\-access\-tokens(http:RequestContext ctx)
        returns gh:FineGrainedAccessTokenResponse|http:Forbidden|http:NotFound|http:InternalServerError {

        // interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        gh:FineGrainedAccessTokenResponse|error fineGrainedAccessTokens = gh:getFinegrainedAccessTokens();
        if fineGrainedAccessTokens is error {
            string customError = "Error while fetching fine-grained access tokens!";
            log:printError(customError, fineGrainedAccessTokens);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        return fineGrainedAccessTokens;
    }

    # Get GitHub teams of the organization.
    #
    # + id - Organization ID
    # + return - List of GitHub teams or error
    isolated resource function get
        organizations/[int id]/github\-teams(http:RequestContext ctx, int page = 1, int perPage = gh:DEFAULT_LIMIT)
            returns gh:GitHubTeam[]|http:Forbidden|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        db:Organization|error organization = db:getOrganizationById(id);
        if organization is error {
            string customError = "Error while fetching organization: ";
            log:printError(customError, organization, organizationId = id);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        gh:GitHubTeam[]|error teams = gh:getTeamsForOrganization(organization.organizationName, page, perPage);
        if teams is error {
            string customError = "Error while fetching teams for organization: ";
            log:printError(customError, teams, organizationName = organization.organizationName);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return teams;
    }

    # Get default repository access status and granted org/repo list for the current user.
    #
    # + return - granted flag + organizations/repos, or error
    isolated resource function get default\-repository\-access(http:RequestContext ctx)
        returns DefaultRepositoryAccessResponse|http:Forbidden|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: "User information header not found!"}
            };
        }
        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {message: "Insufficient privileges!"}
            };
        }

        entity:Employee|error? employee = entity:fetchEmployeesBasicInfo(userInfo.email);
        if employee is error {
            string customError = "Error while fetching employee information!";
            log:printError(customError, employee, email = userInfo.email);
            return <http:InternalServerError>{body: {message: customError}};
        }
        if employee is () {
            string customError = "Employee information not found for the employee!";
            log:printError(customError, email = userInfo.email);
            return <http:InternalServerError>{body: {message: customError}};
        }

        db:UserDefaultRepositoryAccess|error? accessRow =
            db:getUserDefaultRepositoryAccess(employee.employeeId);
        if accessRow is error {
            string customError = "Error while reading default repository access!";
            log:printError(customError, accessRow, employeeId = employee.employeeId);
            return <http:InternalServerError>{body: {message: customError}};
        }
        if accessRow is () || !accessRow.granted {
            return {granted: false, organizations: []};
        }

        gh:OrganizationAndTeam[] orgTeams = [];
        if employee.employmentType == PERMANENT {
            db:OrganizationDefaultRepository[]|error permanentRows =
                db:getOrganizationDefaultRepositoriesByAccessType("PERMANENT");
            if permanentRows is error {
                string customError = "Error while reading default organization repositories!";
                log:printError(customError, permanentRows);
                return <http:InternalServerError>{body: {message: customError}};
            }
            orgTeams = from var row in permanentRows
                select {orgName: row.orgName, teamSlug: row.teamSlug};

            if employee.department == CUSTOMER_SUCCESS_DEPARTMENT {
                db:OrganizationDefaultRepository[]|error csRows =
                    db:getOrganizationDefaultRepositoriesByAccessType("CS");
                if csRows is error {
                    string customError = "Error while reading default organization repositories!";
                    log:printError(customError, csRows);
                    return <http:InternalServerError>{body: {message: customError}};
                }
                orgTeams = from var row in csRows
                    select {orgName: row.orgName, teamSlug: row.teamSlug};
            }
        } else if employee.employmentType == INTERNSHIP {
            db:OrganizationDefaultRepository[]|error internRows =
                db:getOrganizationDefaultRepositoriesByAccessType("INTERN");
            if internRows is error {
                string customError = "Error while reading default organization repositories!";
                log:printError(customError, internRows);
                return <http:InternalServerError>{body: {message: customError}};
            }
            orgTeams = from var row in internRows
                select {orgName: row.orgName, teamSlug: row.teamSlug};
        } else {
            return {granted: true, organizations: []};
        }

        map<DefaultAccessRepository[]> reposByOrg = {};
        foreach gh:OrganizationAndTeam ot in orgTeams {
            if !reposByOrg.hasKey(ot.orgName) {
                reposByOrg[ot.orgName] = [];
            }
            gh:TeamRepository[]|error teamRepos = gh:getTeamRepositories(ot.orgName, ot.teamSlug);
            if teamRepos is error {
                log:printWarn(
                    "Failed to list team repos; skipping team",
                    teamRepos,
                    org = ot.orgName,
                    team = ot.teamSlug
                );
                continue;
            }
            DefaultAccessRepository[] existing = reposByOrg.get(ot.orgName);
            map<boolean> seen = {};
            foreach DefaultAccessRepository r in existing {
                seen[r.name] = true;
            }
            foreach gh:TeamRepository repo in teamRepos {
                if seen.hasKey(repo.name) {
                    continue;
                }
                seen[repo.name] = true;
                existing.push({name: repo.name, htmlUrl: repo.htmlUrl});
            }
            reposByOrg[ot.orgName] = existing;
        }

        DefaultAccessOrganization[] organizations = [];
        foreach string orgName in reposByOrg.keys() {
            organizations.push({
                orgName: orgName,
                avatarUrl: string `https://github.com/${orgName}.png`,
                repositories: reposByOrg.get(orgName)
            });
        }
        return {granted: true, organizations};
    
    }
    # Set default repository access for a GitHub user based on their employment type and department.
#
# + return - List of successful responses and failed responses or error
isolated resource function put set\-default\-repository\-access(http:RequestContext ctx)
    returns gh:AddOrUpdateTeamMemberResponse|http:Forbidden|http:InternalServerError {

    authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
    if userInfo is error {
        return <http:InternalServerError>{
            body: {
                message: "User information header not found!"
            }
        };
    }
    if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
        return <http:Forbidden>{
            body: {
                message: "Insufficient privileges!"
            }
        };
    }

    entity:Employee|error? employee = entity:fetchEmployeesBasicInfo(userInfo.email);
    if employee is error {
        string customError = "Error while fetching employee information!";
        log:printError(customError, employee, email = userInfo.email);
        return <http:InternalServerError>{
            body: {
                message: customError
            }
        };
    }
    if employee is () {
        string customError = "Employee information not found for the employee!";
        log:printError(customError, email = userInfo.email);
        return <http:InternalServerError>{
            body: {
                message: customError
            }
        };
    }

    string? githubUserId = userInfo.githubUserId;
    if githubUserId is () {
        return <http:Forbidden>{
            body: {message: "GitHub account is not verified."}
        };
    }

    gh:GitHubUser|error githubUser = gh:getUserDetails(githubUserId);
    if githubUser is error {
        string customError = "Error while resolving GitHub username!";
        log:printError(customError, githubUser, email = userInfo.email);
        return <http:InternalServerError>{
            body: {
                message: customError
            }
        };
    }
    string gitHubUserName = githubUser.login;

    gh:OrganizationAndTeam[] orgTeams = [];
    if employee.employmentType == PERMANENT {
        db:OrganizationDefaultRepository[]|error permanentRows =
            db:getOrganizationDefaultRepositoriesByAccessType("PERMANENT");
        if permanentRows is error {
            string customError = "Error while reading default organization repositories!";
            log:printError(customError, permanentRows);
            return <http:InternalServerError>{body: {message: customError}};
        }
        orgTeams = from var row in permanentRows
            select {orgName: row.orgName, teamSlug: row.teamSlug};

        if employee.department == CUSTOMER_SUCCESS_DEPARTMENT {
            db:OrganizationDefaultRepository[]|error csRows =
                db:getOrganizationDefaultRepositoriesByAccessType("CS");
            if csRows is error {
                string customError = "Error while reading default organization repositories!";
                log:printError(customError, csRows);
                return <http:InternalServerError>{body: {message: customError}};
            }
            orgTeams = from var row in csRows
                select {orgName: row.orgName, teamSlug: row.teamSlug};
        }
    } else if employee.employmentType == INTERNSHIP {
        db:OrganizationDefaultRepository[]|error internRows =
            db:getOrganizationDefaultRepositoriesByAccessType("INTERN");
        if internRows is error {
            string customError = "Error while reading default organization repositories!";
            log:printError(customError, internRows);
            return <http:InternalServerError>{body: {message: customError}};
        }
        orgTeams = from var row in internRows
            select {orgName: row.orgName, teamSlug: row.teamSlug};
    } else {
        string actualType = employee.employmentType ?: "null";
        string customError = string `No team membership changes made as the employment type does not match any criteria. employmentType=${actualType}`;
        log:printError(customError, email = userInfo.email, employmentType = actualType);
        return <http:InternalServerError>{
            body: {
                message: customError
            }
        };
    }

    if orgTeams.length() == 0 {
        string customError = "No default organization repositories configured for this employment type!";
        log:printError(customError, email = userInfo.email, employmentType = employee.employmentType);
        return <http:InternalServerError>{body: {message: customError}};
    }

    gh:AddOrUpdateTeamMemberInformationInput[] inputs = from var organizationAndTeam in orgTeams
        select {
            orgName: organizationAndTeam.orgName,
            teamSlug: organizationAndTeam.teamSlug,
            userName: gitHubUserName,
            role: gh:MEMBER
        };

    gh:AddOrUpdateTeamMemberResponse|error membershipResult = gh:addOrUpdateTeamMemberships(inputs);
    if membershipResult is error {
        string customError = "Error while adding/updating team membership for the employee!";
        log:printError(customError, membershipResult);
        return <http:InternalServerError>{
            body: {
                message: customError
            }
        };
    }

    boolean granted = membershipResult.successfulMemberships.length() > 0;
    error? dbResult = db:upsertUserDefaultRepositoryAccess(employee.employeeId, granted);
    if dbResult is error {
        string customError = "Default access applied on GitHub, but failed to update access record in DB!";
        log:printError(customError, dbResult, employeeId = employee.employeeId);
        return <http:InternalServerError>{
            body: {
                message: customError
            }
        };
    }

    return membershipResult;
}
    # Exchange the authorization code for an access token.
    #
    # + payload - The authorization code received from GitHub after user authorization
    # + return - Access token or error
    isolated resource function post github/verify\-and\-persist\-user(http:RequestContext ctx, VerifyEmailPayload payload)
        returns gh:EmailVerificationResponse|http:Forbidden|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }
        if !authorization:checkPermissions([authorization:authorizedRoles.employee], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }

        gh:EmailVerificationResponse|error result
            = gh:verifyCompanyEmail({code: payload.code, email: userInfo.email});

        if result is error {
            string customError = "Error while verifying company email!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        gh:EmailVerificationResponse {status, githubUserId} = result;
        if status == "verified" && githubUserId is string {
            scim:User|error? updatedUser
                    = scim:updateGithubUserId(githubUserId = githubUserId, email = userInfo.email);

            if updatedUser is error {
                string customError = "Error while updating GitHub user ID in the IDP!";
                log:printError(customError, updatedUser, email = userInfo.email);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            } else if updatedUser is () {
                string customError = "User not found for the email!";
                log:printError(customError, email = userInfo.email);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            // Invalidate the cached user info so the next fetch reflects the newly linked GitHub account.
            cache:Error? cacheInvalidateError = cache.invalidate(userInfo.email);
            if cacheInvalidateError is cache:Error {
                log:printWarn(
                        "An error occurred while invalidating cached user info", cacheInvalidateError,
                        email = userInfo.email);
            }
        }
        return result;
    }

}
