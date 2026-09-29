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

import employee_claims_sync.employee;
import employee_claims_sync.scim;

import ballerina/lang.runtime;
import ballerina/log;

@display {
    label: "Employee Claims Sync to Asgardeo",
    id: "infra/employee-claims-sync"
}
public function main() returns error? {
    log:printInfo("Employee claims sync to Asgardeo started...");
    employee:Employee[] employees = check employee:getEmployees(filters =
            {employeeStatus: [employee:EmployeeStatusActive, employee:EmployeeStatusMarkedLeaver]});
    log:printInfo("Successfully fetched employee data. Total employees: " + employees.length().toString());
    int count = 0;
    int employeeCount = 0;
    int updateFailureCount = 0;
    foreach employee:Employee employee in employees {
        employeeCount += 1;
        if count > 0 && count % 100 == 0 {
            log:printInfo(string `Processed ${count} SCIM requests so far. Total employees processed: ${
                employeeCount}.`);
            log:printInfo("Waiting for 1 minute to avoid hitting rate limits...");
            // Wait for 1 minute after processing every 100 SCIM requests to avoid hitting rate limits.
            runtime:sleep(60);
        }
        scim:User[] userResult = check scim:searchUser(employee.workEmail.toLowerAscii());
        count += 1;
        if userResult.length() == 0 {
            log:printWarn(string `employee with ID: ${employee.employeeId} does not exist in Asgardeo. Skipping...`);
            continue;
        }
        scim:User user = userResult[0];
        boolean jobTitleNeedsUpdate = user.urn\:scim\:wso2\:schema?.jobtitle != employee.jobRole;
        boolean profileUrlNeedsUpdate = user.profileUrl != employee.employeeThumbnail;
        boolean businessUnitNeedsUpdate =
            user.urn\:scim\:schemas\:extension\:custom\:User?.businessUnit != employee.businessUnit;
        boolean departmentNeedsUpdate = user.urn\:scim\:schemas\:extension\:custom\:User?.team != employee.department;
        boolean teamNeedsUpdate = user.urn\:scim\:schemas\:extension\:custom\:User?.subTeam != employee.team;
        boolean subTeamNeedsUpdate = user.urn\:scim\:schemas\:extension\:custom\:User?.unit != employee.subTeam;
        boolean employeeIdNeedsUpdate =
            user.urn\:scim\:schemas\:extension\:custom\:User?.employeeId != employee.employeeId;

        if jobTitleNeedsUpdate || profileUrlNeedsUpdate || businessUnitNeedsUpdate || departmentNeedsUpdate ||
            teamNeedsUpdate || subTeamNeedsUpdate || employeeIdNeedsUpdate {
            scim:UserUpdatePayload updatePayload = {};
            if jobTitleNeedsUpdate {
                updatePayload.jobTitle = employee.jobRole ?: "";
            }
            if profileUrlNeedsUpdate {
                updatePayload.profileUrl = employee.employeeThumbnail ?: "";
            }
            if businessUnitNeedsUpdate {
                updatePayload.businessUnit = employee.businessUnit ?: "";
            }
            if departmentNeedsUpdate {
                updatePayload.team = employee.department ?: "";
            }
            if teamNeedsUpdate {
                updatePayload.subTeam = employee.team ?: "";
            }
            if subTeamNeedsUpdate {
                updatePayload.unit = employee.subTeam ?: "";
            }
            if employeeIdNeedsUpdate {
                updatePayload.employeeId = employee.employeeId;
            }
            scim:User|error updatedUser = scim:updateUser(updatePayload, user.id);
            count += 1;
            if updatedUser is error {
                log:printError(string `Failed to update employee ${user.id} in Asgardeo.`, updatedUser);
                updateFailureCount += 1;
            } else {
                log:printDebug(string `Successfully updated employee ${user.id} in Asgardeo.`);
            }
        }
    }

    if updateFailureCount == 0 {
        log:printInfo(string `Employee claims sync completed successfully. Total employees processed: ${
            employeeCount}. Total SCIM requests made: ${count}. Update failure count: ${updateFailureCount}.`);
    } else {
        log:printInfo(string `Employee claims sync completed with some failures. Total employees processed: ${
            employeeCount}. Total SCIM requests made: ${count}. Update failure count: ${updateFailureCount}.`);
    }
}
