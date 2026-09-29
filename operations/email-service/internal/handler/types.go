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
package handler

// EmailAttachment represents a file to attach to an email. Inline and
// ContentID are optional; omitting both keeps the attachment behaving
// exactly as before this pair was added -- a plain Content-Disposition:
// attachment part, unrelated to the HTML body. Setting Inline: true marks
// the part Content-Disposition: inline instead, and ContentID (required
// when Inline is true, validated in the handler) becomes that part's
// Content-ID header, so the HTML template can reference the same file as
// <img src="cid:<contentId>"> rather than embedding it as a data: URI --
// which most webmail clients (Gmail included) strip from received HTML on
// render, regardless of how it's encoded.
type EmailAttachment struct {
	ContentName string `json:"contentName"`
	ContentType string `json:"contentType"`
	Attachment  []byte `json:"attachment"`
	Inline      bool   `json:"inline,omitempty"`
	ContentID   string `json:"contentId,omitempty"`
}

// EmailRequest is the JSON body accepted by POST /send-email.
type EmailRequest struct {
	To          []string          `json:"to"`
	CC          []string          `json:"cc,omitempty"`
	BCC         []string          `json:"bcc,omitempty"`
	ReplyTo     []string          `json:"replyTo,omitempty"`
	From        string            `json:"from"`
	Subject     string            `json:"subject"`
	Template    []byte            `json:"template"`
	Attachments []EmailAttachment `json:"attachments,omitempty"`
}

// HealthStatus represents the health-check status.
type HealthStatus string

// ResponseMessage is the JSON body returned by all responses.
type ResponseMessage struct {
	Message string `json:"message"`
}

// HealthResponse is the JSON body returned by GET /health-check.
type HealthResponse struct {
	Status HealthStatus `json:"status"`
}
