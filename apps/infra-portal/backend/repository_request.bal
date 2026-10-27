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

import ballerina/http;
import ballerina/log;
import ballerina/sql;

isolated function canReadRepositoryRequest(authorization:CustomJwtPayload userInfo, db:RepositoryRequest request)
    returns boolean {

    if authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
        return true;
    }
    return userInfo.email.equalsIgnoreCaseAscii(request.email)
        || userInfo.email.equalsIgnoreCaseAscii(request.leadEmail);
}

isolated function canReviewRepositoryRequest(authorization:CustomJwtPayload userInfo, db:RepositoryRequest request)
    returns boolean {

    if authorization:checkPermissions([authorization:authorizedRoles.admin], userInfo.groups) {
        return true;
    }
    return authorization:checkPermissions([authorization:authorizedRoles.approver], userInfo.groups)
        && userInfo.email.equalsIgnoreCaseAscii(request.leadEmail);
}

isolated function validateLeadEmail(string leadEmail) returns http:BadRequest|http:InternalServerError? {
    db:TeamLead[]|error leads = db:getLeads();
    if leads is error {
        log:printError("Error while retrieving functional leads!", leads);
        return <http:InternalServerError>{
            body: {
                message: "Error while retrieving functional leads!"
            }
        };
    }
    foreach db:TeamLead lead in leads {
        if lead.leadEmail.equalsIgnoreCaseAscii(leadEmail) {
            return;
        }
    }
    return <http:BadRequest>{
        body: {
            message: "leadEmail is not a configured functional lead."
        }
    };
}

isolated function normalizeRepositoryType(string repoType) returns string|http:BadRequest {
    if repoType.equalsIgnoreCaseAscii(PUBLIC) {
        return PUBLIC;
    }
    if repoType.equalsIgnoreCaseAscii(PRIVATE) {
        return PRIVATE;
    }
    return <http:BadRequest>{
        body: {
            message: "Repository type must be Public or Private."
        }
    };
}

isolated function validateRepositoryType(int organizationId, string repoType)
    returns http:BadRequest|http:InternalServerError? {

    db:Organization|error organization = db:getOrganizationById(organizationId);
    if organization is sql:NoRowsError {
        return <http:BadRequest>{
            body: {
                message: "Organization was not found."
            }
        };
    }
    if organization is error {
        log:printError("Error while retrieving organization!", organization);
        return <http:InternalServerError>{
            body: {
                message: "Error while retrieving organization!"
            }
        };
    }
    boolean privateOrg = organization.organizationVisibility.equalsIgnoreCaseAscii("private");
    boolean publicOrg = organization.organizationVisibility.equalsIgnoreCaseAscii("public");
    boolean freePlan = organization.organizationPlan.equalsIgnoreCaseAscii("free");
    if (privateOrg && repoType == PUBLIC)
        || ((freePlan || publicOrg) && repoType == PRIVATE) {
        return <http:BadRequest>{
            body: {
                message: "Repository type is not allowed for this organization."
            }
        };
    }
    return;
}