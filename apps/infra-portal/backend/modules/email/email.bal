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

# Send an email notifying the creation of a new repository request.
#
# + data - Repository request object
# + return - Error or null if successful
public isolated function sendNewRepoRequestEmail(RepositoryRequest data) returns error? {
    string emailBody = check createRequestTemplate(data);
    EmailDetails emailDetails = generateEmailDetails(data);
    check sendEmail(emailDetails, emailBody);
}

# Send an email notifying the update of a repository request.
#
# + oldData - Repository request object
# + newData - Updated repository request object
# + return - Error or null if successful
public isolated function updateRepoRequestAlert(RepositoryRequest oldData, RepositoryRequest newData) returns error? {
    UpdateRequestEmailData updatedData = updateChanges(oldData, newData);
    string emailBody = check updateRequestTemplate(updatedData);
    EmailDetails emailDetails = generateEmailDetails(newData);
    check sendEmail(emailDetails, emailBody);
}

# Send an email notifying the comment on a repository request.
#
# + comment - Comment object
# + emailDetails - Email details
# + requestId - Repository request ID
# + return - Error or null if successful
public isolated function commentRepoRequestAlert(Comment comment, EmailDetails emailDetails, int requestId) returns error? {
    string emailBody = check commentTemplate(comment, requestId);
    check sendEmail(emailDetails, emailBody);
}

# Send an email notifying the approval of a repository request.
#
# + data - Repository request object data for the email body
# + results - Record type containing the status of GitHub operations array
# + return - Error or null if successful
public isolated function approveRepoRequestAlert(ApproveRequestEmailData data, GitHubOperationResult[] results) 
    returns error? {

    string emailBody = check approveRequestTemplate(data, results);
    EmailDetails emailDetails = generateEmailDetails(data);
    check sendEmail(emailDetails, emailBody);
}

# Send an email notifying the rejection of a repository request.
#
# + data - Repository request object data for the email body
# + return - Error or null if successful
public isolated function rejectRepoRequestAlert(RejectRequestEmailData data) 
    returns error? {
        
    string emailBody = check rejectRequestTemplate(data);
    EmailDetails emailDetails = generateEmailDetails(data);
    check sendEmail(emailDetails, emailBody);
}
