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

import ballerina/http;

configurable string[] defaultEmailGroups = ?;

# Generates email details from the repository request data.
#
# + data - Repository request data
# + return - Email details
public isolated function generateEmailDetails(RepositoryRequest data) returns EmailDetails {
    return {
        userEmail: data.email,
        leadEmail: data.leadEmail,
        ccList: data.ccList,
        id: data.id.toString()
    };
}

# Sends email using the email client.
#
# + emailDetails - Email details
# + emailBody - Email body
# + return - Error or null if successful
public isolated function sendEmail(EmailDetails emailDetails, string emailBody) returns error? {
    EmailPayload payload = {
        to: [emailDetails.userEmail, emailDetails.leadEmail],
        'from: emailFrom,
        cc: [...re `,`.split(emailDetails.ccList), ...defaultEmailGroups],
        subject: string `REQUESTING NEW REPOSITORY [#${emailDetails.id}]`,
        template: emailBody
    };
    http:Response|http:ClientError response = emailClient->/send\-email.post(payload);
    if response is http:ClientError {
        string customError = string `Client Error occurred while sending the email !`;
        return error(customError);
    }
    if response.statusCode != http:STATUS_OK {
        string customError = string `Error occurred while sending the email !`;
        return error(customError);
    }
}

# Update the changes between old and new data.
#
# + oldData - The old repository request data
# + newData - The new repository request data
# + return - The email data highlighting the changes
public isolated function updateChanges(RepositoryRequest oldData, RepositoryRequest newData)
    returns UpdateRequestEmailData {
        
    RepositoryRequest {
        id,
        organizationId,
        websiteUrl,
        jenkinsJobType,
        jenkinsGroupId,
        azureDevopsOrg,
        azureDevopsProject,
        totalCount,
        pendingCount,
        approvedCount,
        rejectedCount,
        updatedAt,
        ...restOldData
    } = oldData;
    UpdateRequestEmailData emailData = {
        ...restOldData,
        id: id.toString(),
        organizationId: organizationId.toString(),  
        websiteUrl: websiteUrl ?: "",  
        jenkinsJobType: jenkinsJobType ?: "",  
        jenkinsGroupId: jenkinsGroupId ?: "",  
        azureDevopsOrg: azureDevopsOrg ?: "",  
        azureDevopsProject: azureDevopsProject ?: "",  
        totalCount: totalCount.toString(),  
        pendingCount: pendingCount.toString(),  
        approvedCount: approvedCount.toString(),  
        rejectedCount: rejectedCount.toString(),  
        updatedAt: updatedAt ?: ""  
    };  
    foreach var [key, newValue] in newData.entries(){
        var oldValue = oldData[key];
        if oldValue != newValue {
            emailData[key] 
                = string `<span style="background-color: #ffff99; font-weight: bold">${newValue.toString()}</span>`;
        }
    }
    return emailData;
}
