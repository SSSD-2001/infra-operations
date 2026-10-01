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

import ballerina/mime;

# Generates the email template for approved repository requests.
#
# + data - Approved request email data
# + return - Email body or error
public isolated function createRequestTemplate(RepositoryRequest data) returns string|error {
    string websiteUrl = data.websiteUrl ?: "N/A";
    string jenkinsJobType = data.jenkinsJobType ?: "N/A";
    string jenkinsGroupId = data.jenkinsGroupId ?: "N/A";
    string azureDevopsOrg = data.azureDevopsOrg ?: "N/A";
    string azureDevopsProject = data.azureDevopsProject ?: "N/A";
    string emailBody = string `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #ffffff; /* White background */
            }
            .container {
                padding: 25px;
                border-radius: 10px;
                background-color: #ffffff; /* White background */
                max-width: 700px;
                margin: 30px auto;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); /* Subtle shadow */
                border: 1px solid #e0e0e0; /* Light gray border */
            }
            .header {
                font-size: 24px;
                font-weight: 600;
                color: #333333; /* Dark gray */
                border-bottom: 3px solid #ff7f50; /* Orange accent */
                padding-bottom: 15px;
                margin-bottom: 25px;
            }
            .notification-info {
                color: #555555; /* Medium gray */
                margin-bottom: 20px;
            }
            .important-link {
                display: inline-block;
                margin-top: 10px;
                padding: 10px 20px;
                background-color: #ff7f50; /* Orange accent */
                color: white !important;
                text-decoration: none;
                border-radius: 8px; /* Rounded corners */
                font-weight: 500;
                transition: background-color 0.3s ease;
            }
            .important-link:hover {
                background-color: #ff6b35; /* Slightly darker orange on hover */
            }
            .section {
                margin-top: 25px;
            }
            .section-title {
                font-size: 18px;
                font-weight: 600;
                color: #333333; /* Dark gray */
                border-bottom: 2px solid #cccccc; /* Light gray */
                padding-bottom: 8px;
                margin-bottom: 15px;
            }
            .detail-item {
                margin: 8px 0;
                color: #495057;
                display: flex;
                align-items: baseline;
            }
            .detail-label {
                font-weight: 500;
                color: #333333; /* Dark gray */
                width: 150px;
                margin-right: 10px;
            }
            .detail-value {
                flex-grow: 1;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                font-size: 14px;
                color: #777777; /* Light gray */
                text-align: center;
                border-top: 1px solid #e0e0e0; /* Light gray */
            }
        </style>
    </head>
    <body>
        <div class="container">
            <p class="header">New Repository Request: #${data.id.toString()}</p>
            <p class="notification-info">A new repository request has been submitted via the <strong>Infra Portal</strong>. Please review the detailed information below and take necessary action.</p>

            <p><a class="important-link" href="https://infra-portal.wso2.com/review-repository-requests/request-history?requestId=${data.id.toString()}">Review Request on Infra Portal</a></p>

            <div class="section">
                <p class="section-title">Request Details</p>
                <div class="detail-item"><span class="detail-label">Requested By:</span> <span class="detail-value">${data.email}</span></div>
                <div class="detail-item"><span class="detail-label">Lead Approver:</span> <span class="detail-value">${data.leadEmail}</span></div>
                <div class="detail-item"><span class="detail-label">Requirement:</span> <span class="detail-value">${data.requirement}</span></div>
            </div>

            <div class="section">
                <p class="section-title">Repository Information</p>
                <div class="detail-item"><span class="detail-label">Repository Name:</span> <span class="detail-value">${data.repoName}</span></div>
                <div class="detail-item"><span class="detail-label">Organization:</span> <span class="detail-value">${data.organizationName}</span></div>
                <div class="detail-item"><span class="detail-label">Repo Type:</span> <span class="detail-value">${data.repoType}</span></div>
                <div class="detail-item"><span class="detail-label">Description:</span> <span class="detail-value">${data.description}</span></div>
                <div class="detail-item"><span class="detail-label">Website URL:</span> <span class="detail-value">${websiteUrl}</span></div>
                <div class="detail-item"><span class="detail-label">Topics:</span> <span class="detail-value">${data.topics}</span></div>
                <div class="detail-item"><span class="detail-label">Enable Issues:</span> <span class="detail-value">${data.enableIssues}</span></div>
            </div>

            <div class="section">
                <p class="section-title">Security & Access</p>
                <div class="detail-item"><span class="detail-label">PR Protection:</span> <span class="detail-value">${data.prProtection}</span></div>
                <div class="detail-item"><span class="detail-label">Teams to be Added:</span> <span class="detail-value">${data.teams}</span></div>
                <div class="detail-item"><span class="detail-label">Enable Triage (WSO2 All):</span> <span class="detail-value">${data.enableTriageWso2All}</span></div>
                <div class="detail-item"><span class="detail-label">Enable Triage (WSO2 All Interns):</span> <span class="detail-value">${data.enableTriageWso2AllInterns}</span></div>
                <div class="detail-item"><span class="detail-label">Disable Triage Reason:</span> <span class="detail-value">${data.disableTriageReason}</span></div>
            </div>

            <div class="section">
                <p class="section-title">DevOps Integration</p>
                <div class="detail-item"><span class="detail-label">CI/CD Requirement:</span> <span class="detail-value">${data.cicdRequirement}</span></div>
                <div class="detail-item"><span class="detail-label">Jenkins Job Type:</span> <span class="detail-value">${jenkinsJobType}</span></div>
                <div class="detail-item"><span class="detail-label">Jenkins Group ID:</span> <span class="detail-value">${jenkinsGroupId}</span></div>
                <div class="detail-item"><span class="detail-label">Azure DevOps Organization:</span> <span class="detail-value">${azureDevopsOrg}</span></div>
                <div class="detail-item"><span class="detail-label">Azure DevOps Project:</span> <span class="detail-value">${azureDevopsProject}</span></div>
            </div>

            <p class="footer">This is an automated notification from the WSO2 <strong>Infra Portal</strong>. If you have any questions, contact the Digital Operations Team at <a class="link" href="mailto:${supportEmail}">${supportEmail}</a>.</p>
        </div>
    </body>
    </html>`;
    return mime:base64Encode(emailBody).ensureType();
};

# Generates the email template for approved repository requests.
#
# + data - Approved request email data
# + results - GitHub operation results
# + return - Email body or error
public isolated function approveRequestTemplate(ApproveRequestEmailData data, GitHubOperationResult[] results) returns string|error {
    string operationSummary = "<ul>";
    foreach GitHubOperationResult result in results {
        operationSummary += string `<li>${result.operation}: <strong>${result.status}</strong></li>`;
    }
    operationSummary += "</ul>";
    string emailBody = string `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #ffffff;
            }
            .container {
                padding: 25px;
                border-radius: 10px;
                background-color: #ffffff;
                max-width: 700px;
                margin: 30px auto;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                border: 1px solid #e0e0e0;
            }
            .header {
                font-size: 24px;
                font-weight: 600;
                color: #333333;
                border-bottom: 3px solid #ff7f50;
                padding-bottom: 15px;
                margin-bottom: 25px;
            }
            .greeting {
                color: #555555;
                margin-bottom: 20px;
            }
            .body-text {
                color: #495057;
                margin-bottom: 20px;
                line-height: 1.6;
            }
            .section {
                margin-top: 25px;
            }
            .section-title {
                font-size: 18px;
                font-weight: 600;
                color: #333333;
                border-bottom: 2px solid #cccccc;
                padding-bottom: 8px;
                margin-bottom: 15px;
            }
            .content {
                margin: 8px 0;
                color: #495057;
                line-height: 1.6;
            }
            .highlight {
                font-weight: bold;
                color: #333333;
            }
            .link {
                color: #007bff;
                text-decoration: none;
                font-weight: 500;
            }
            .link:hover {
                color: #0056b3;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                font-size: 14px;
                color: #777777;
                text-align: center;
                border-top: 1px solid #e0e0e0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <p class="header">GitHub Repository Request Approved</p>

            <p class="greeting">Hi,</p>
            <p class="body-text">
                Your request for creating a new GitHub repository has been approved.
            </p>
            
            <div class="section">
                <p class="section-title">Repository Details</p>
                <p class="content">
                    <span class="highlight">Repository Link:</span> 
                    <a class="link" href="https://github.com/${data.organizationName}/${data.repoName}" target="_blank">
                        https://github.com/${data.organizationName}/${data.repoName}
                    </a>
                </p>
            </div>

            <div class="section">
                <p class="section-title">GitHub Operation Results</p>
                <p class="content">
                    ${operationSummary}
                </p>
            </div>

            <p class="body-text">
                DevOps configurations will be handled by the DigiOps Team manually.
            </p>

            <p class="footer">This is an automated notification from the WSO2 <strong>Infra Portal</strong>. If you have any questions, contact the Digital Operations Team at <a class="link" href="mailto:${supportEmail}">${supportEmail}</a>.</p>
        </div>
    </body>
    </html>`;
    return mime:base64Encode(emailBody).ensureType();
};

# Generates the email template for comments on repository requests.
#
# + comment - Comment text
# + requestId - Repository request ID
# + return - Email body or error
public isolated function commentTemplate(Comment comment, int requestId) returns string|error { 
    string emailBody = string `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #ffffff;
            }
            .container {
                padding: 25px;
                border-radius: 10px;
                background-color: #ffffff;
                max-width: 700px;
                margin: 30px auto;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                border: 1px solid #e0e0e0;
            }
            .header {
                font-size: 24px;
                font-weight: 600;
                color: #333333;
                border-bottom: 3px solid #ff7f50;
                padding-bottom: 15px;
                margin-bottom: 25px;
            }
            .important-link {
                display: inline-block;
                margin-top: 10px;
                padding: 10px 20px;
                background-color: #ff7f50; /* Orange accent */
                color: white !important;
                text-decoration: none;
                border-radius: 8px; /* Rounded corners */
                font-weight: 500;
                transition: background-color 0.3s ease;
            }
            .important-link:hover {
                background-color: #ff6b35; /* Slightly darker orange on hover */
            }
            .body-text {
                color: #495057;
                margin-bottom: 20px;
                line-height: 1.6;
            }
            .section {
                margin-top: 25px;
            }
            .section-title {
                font-size: 18px;
                font-weight: 600;
                color: #333333;
                border-bottom: 2px solid #cccccc;
                padding-bottom: 8px;
                margin-bottom: 15px;
            }
            .comment-content {
                margin: 8px 0;
                color: #495057;
                padding: 15px;
                background-color: #f8f8f8; /* Light gray background for comment box */
                border-radius: 8px;
                border: 1px solid #e0e0e0;
                line-height: 1.6;
            }
            .highlight {
                font-weight: bold;
                color: #333333;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                font-size: 14px;
                color: #777777;
                text-align: center;
                border-top: 1px solid #e0e0e0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <p class="header">Comment on Your Repository Request</p>

            <p class="body-text">
                This is a comment regarding your request to create a new GitHub repository.
            </p>
            <p><a class="important-link" href="https://infra-portal.wso2.com/review-repository-requests/request-history?requestId=${requestId}">Review Request on Infra Portal</a></p>
            
            <div class="section">
                <p class="section-title">Comment Details</p>
                <div class="comment-content">
                    <span class="highlight">Comment:</span> ${comment.commentText}
                </div>
                <div class="detail-item">
                    <span class="highlight">Author:</span> ${comment.authorEmail}
                </div>
            </div>

            <p class="body-text">
                Please review and update your request accordingly. If you have any questions, feel free to reach out.
            </p>

            <p class="footer">This is an automated notification from the WSO2 <strong>Infra Portal</strong>. If you have any questions, contact the Digital Operations Team at <a class="link" href="mailto:${supportEmail}">${supportEmail}</a>.</p>
        </div>
    </body>
    </html>
    `;
    return mime:base64Encode(emailBody).ensureType();
};

# Generates the email template for updated repository requests.
#
# + updatedData - Updated repository request data
# + return - Email body as a base64 encoded string or error
public isolated function updateRequestTemplate(UpdateRequestEmailData updatedData) returns string|error {
    string emailBody = string `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                    background-color: #ffffff;
                }
                .container {
                    padding: 25px;
                    border-radius: 10px;
                    background-color: #ffffff;
                    max-width: 700px;
                    margin: 30px auto;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    border: 1px solid #e0e0e0;
                }
                .header {
                    font-size: 24px;
                    font-weight: 600;
                    color: #333333;
                    border-bottom: 3px solid #ff7f50;
                    padding-bottom: 15px;
                    margin-bottom: 25px;
                }
                .notification-info {
                    color: #555555;
                    margin-bottom: 20px;
                }
                .important-link {
                    display: inline-block;
                    margin-top: 10px;
                    padding: 10px 20px;
                    background-color: #ff7f50;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 500;
                    transition: background-color 0.3s ease;
                }
                .important-link:hover {
                    background-color: #ff6b35;
                }
                .section {
                    margin-top: 25px;
                }
                .section-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #333333;
                    border-bottom: 2px solid #cccccc;
                    padding-bottom: 8px;
                    margin-bottom: 15px;
                }
                .detail-item {
                    margin: 8px 0;
                    color: #495057;
                    display: flex;
                    align-items: baseline;
                }
                .detail-label {
                    font-weight: 500;
                    color: #333333;
                    width: 180px;
                    margin-right: 10px;
                }
                .detail-value {
                    flex-grow: 1;
                    line-height: 1.6;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    font-size: 14px;
                    color: #777777;
                    text-align: center;
                    border-top: 1px solid #e0e0e0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <p class="header">Updated Repository Request: #${updatedData.id}</p>
                <p class="notification-info">The repository request has been updated. Updated fields are highlighted. Please review the details below:</p>
                
                <p><a class="important-link" href="https://infra-portal.wso2.com/review-repository-requests/request-history?requestId=${updatedData.id}">Review Request on Infra Portal</a></p>

                <div class="section">
                    <p class="section-title">Request Details</p>
                    <div class="detail-item"><span class="detail-label">Requested By:</span> <span class="detail-value">${updatedData.email}</span></div>
                    <div class="detail-item"><span class="detail-label">Lead Approver:</span> <span class="detail-value">${updatedData.leadEmail}</span></div>
                    <div class="detail-item"><span class="detail-label">Requirement:</span> <span class="detail-value">${updatedData.requirement}</span></div>
                </div>

                <div class="section">
                    <p class="section-title">Repository Information</p>
                    <div class="detail-item"><span class="detail-label">Repository Name:</span> <span class="detail-value">${updatedData.repoName}</span></div>
                    <div class="detail-item"><span class="detail-label">Organization:</span> <span class="detail-value">${updatedData.organizationName}</span></div>
                    <div class="detail-item"><span class="detail-label">Repo Type:</span> <span class="detail-value">${updatedData.repoType}</span></div>
                    <div class="detail-item"><span class="detail-label">Description:</span> <span class="detail-value">${updatedData.description}</span></div>
                    <div class="detail-item"><span class="detail-label">Website URL:</span> <span class="detail-value">${updatedData.websiteUrl}</span></div>
                    <div class="detail-item"><span class="detail-label">Topics:</span> <span class="detail-value">${updatedData.topics}</span></div>
                    <div class="detail-item"><span class="detail-label">Enable Issues:</span> <span class="detail-value">${updatedData.enableIssues}</span></div>
                </div>

                <div class="section">
                    <p class="section-title">Security & Access</p>
                    <div class="detail-item"><span class="detail-label">PR Protection:</span> <span class="detail-value">${updatedData.prProtection}</span></div>
                    <div class="detail-item"><span class="detail-label">Teams to be Added:</span> <span class="detail-value">${updatedData.teams}</span></div>
                    <div class="detail-item"><span class="detail-label">Enable Triage (WSO2 All):</span> <span class="detail-value">${updatedData.enableTriageWso2All}</span></div>
                    <div class="detail-item"><span class="detail-label">Enable Triage (WSO2 All Interns):</span> <span class="detail-value">${updatedData.enableTriageWso2AllInterns}</span></div>
                    <div class="detail-item"><span class="detail-label">Disable Triage Reason:</span> <span class="detail-value">${updatedData.disableTriageReason}</span></div>
                </div>

                <div class="section">
                    <p class="section-title">DevOps Integration</p>
                    <div class="detail-item"><span class="detail-label">CI/CD Requirement:</span> <span class="detail-value">${updatedData.cicdRequirement}</span></div>
                    <div class="detail-item"><span class="detail-label">Jenkins Job Type:</span> <span class="detail-value">${updatedData.jenkinsJobType}</span></div>
                    <div class="detail-item"><span class="detail-label">Jenkins Group ID:</span> <span class="detail-value">${updatedData.jenkinsGroupId}</span></div>
                    <div class="detail-item"><span class="detail-label">Azure DevOps Organization:</span> <span class="detail-value">${updatedData.azureDevopsOrg}</span></div>
                    <div class="detail-item"><span class="detail-label">Azure DevOps Project:</span> <span class="detail-value">${updatedData.azureDevopsProject}</span></div>
                </div>

                <p class="footer">This is an automated notification from the WSO2 <strong>Infra Portal</strong>. If you have any questions, contact the Digital Operations Team at <a class="link" href="mailto:${supportEmail}">${supportEmail}</a>.</p>
            </div>
        </body>
        </html>`;
    return mime:base64Encode(emailBody).ensureType();
};

# Generates the email template for rejected repository requests.
#
# + data - Rejected request data
# + return - Email body or error
public isolated function rejectRequestTemplate(RejectRequestEmailData data) returns string|error { 
    string websiteUrl = data.websiteUrl ?: "N/A";
    string jenkinsJobType = data.jenkinsJobType ?: "N/A";
    string jenkinsGroupId = data.jenkinsGroupId ?: "N/A";
    string azureDevopsOrg = data.azureDevopsOrg ?: "N/A";
    string azureDevopsProject = data.azureDevopsProject ?: "N/A";

    string emailBody = string `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #ffffff;
            }
            .container {
                padding: 25px;
                border-radius: 10px;
                background-color: #ffffff;
                max-width: 700px;
                margin: 30px auto;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                border: 1px solid #e0e0e0;
            }
            .header {
                font-size: 24px;
                font-weight: 600;
                color: #333333;
                border-bottom: 3px solid #ff7f50;
                padding-bottom: 15px;
                margin-bottom: 25px;
            }
            .greeting {
                color: #555555;
                margin-bottom: 20px;
            }
            .body-text {
                color: #495057;
                margin-bottom: 20px;
                line-height: 1.6;
            }
            .section {
                margin-top: 25px;
            }
            .section-title {
                font-size: 18px;
                font-weight: 600;
                color: #333333;
                border-bottom: 2px solid #cccccc;
                padding-bottom: 8px;
                margin-bottom: 15px;
            }
            .content {
                margin: 8px 0;
                color: #495057;
                line-height: 1.6;
            }
            .highlight {
                font-weight: bold;
                color: #333333;
            }
            .link {
                color: #007bff;
                text-decoration: none;
                font-weight: 500;
            }
            .link:hover {
                color: #0056b3;
            }
            .detail-item {
                margin: 8px 0;
                color: #495057;
                display: flex;
                align-items: baseline;
            }
            .detail-label {
                font-weight: 500;
                color: #333333; /* Dark gray */
                width: 150px;
                margin-right: 10px;
            }
            .detail-value {
                flex-grow: 1;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                font-size: 14px;
                color: #777777;
                text-align: center;
                border-top: 1px solid #e0e0e0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <p class="header">GitHub Repository Request Rejected</p>

            <p class="greeting">Hi,</p>
            <p class="body-text">
                Your request for creating a new GitHub repository has been rejected.
            </p>

            <div class="section">
                <p class="section-title">Request Details</p>
                <div class="detail-item"><span class="detail-label">Requested By:</span> <span class="detail-value">${data.email}</span></div>
                <div class="detail-item"><span class="detail-label">Lead Approver:</span> <span class="detail-value">${data.leadEmail}</span></div>
                <div class="detail-item"><span class="detail-label">Requirement:</span> <span class="detail-value">${data.requirement}</span></div>
            </div>

            <div class="section">
                <p class="section-title">Repository Information</p>
                <div class="detail-item"><span class="detail-label">Repository Name:</span> <span class="detail-value">${data.repoName}</span></div>
                <div class="detail-item"><span class="detail-label">Organization:</span> <span class="detail-value">${data.organizationName}</span></div>
                <div class="detail-item"><span class="detail-label">Repo Type:</span> <span class="detail-value">${data.repoType}</span></div>
                <div class="detail-item"><span class="detail-label">Description:</span> <span class="detail-value">${data.description}</span></div>
                <div class="detail-item"><span class="detail-label">Website URL:</span> <span class="detail-value">${websiteUrl}</span></div>
                <div class="detail-item"><span class="detail-label">Topics:</span> <span class="detail-value">${data.topics}</span></div>
                <div class="detail-item"><span class="detail-label">Enable Issues:</span> <span class="detail-value">${data.enableIssues}</span></div>
            </div>

            <div class="section">
                <p class="section-title">Security & Access</p>
                <div class="detail-item"><span class="detail-label">PR Protection:</span> <span class="detail-value">${data.prProtection}</span></div>
                <div class="detail-item"><span class="detail-label">Teams to be Added:</span> <span class="detail-value">${data.teams}</span></div>
                <div class="detail-item"><span class="detail-label">Enable Triage (WSO2 All):</span> <span class="detail-value">${data.enableTriageWso2All}</span></div>
                <div class="detail-item"><span class="detail-label">Enable Triage (WSO2 All Interns):</span> <span class="detail-value">${data.enableTriageWso2AllInterns}</span></div>
                <div class="detail-item"><span class="detail-label">Disable Triage Reason:</span> <span class="detail-value">${data.disableTriageReason}</span></div>
            </div>

            <div class="section">
                <p class="section-title">DevOps Integration</p>
                <div class="detail-item"><span class="detail-label">CI/CD Requirement:</span> <span class="detail-value">${data.cicdRequirement}</span></div>
                <div class="detail-item"><span class="detail-label">Jenkins Job Type:</span> <span class="detail-value">${jenkinsJobType}</span></div>
                <div class="detail-item"><span class="detail-label">Jenkins Group ID:</span> <span class="detail-value">${jenkinsGroupId}</span></div>
                <div class="detail-item"><span class="detail-label">Azure DevOps Organization:</span> <span class="detail-value">${azureDevopsOrg}</span></div>
                <div class="detail-item"><span class="detail-label">Azure DevOps Project:</span> <span class="detail-value">${azureDevopsProject}</span></div>
            </div>
            
            <p class="footer">This is an automated notification from the WSO2 <strong>Infra Portal</strong>. If you have any questions, contact the Digital Operations Team at <a class="link" href="mailto:${supportEmail}">${supportEmail}</a>.</p>
        </div>
    </body>
</html>`;
    return mime:base64Encode(emailBody).ensureType();
};
