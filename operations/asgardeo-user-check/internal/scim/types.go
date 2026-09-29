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

package scim

// searchRequest mirrors types:UserSearchInput in the scim-operations-service
// Ballerina module. Only the fields needed for an existence + lock-state
// check are sent — the minimal attributes and a page size of 1, since the
// caller only needs to know whether a match exists and its lock state.
type searchRequest struct {
	Attributes   []string `json:"attributes"`
	Filter       string   `json:"filter"`
	ItemsPerPage int      `json:"itemsPerPage"`
}

// searchResponse mirrors scim:UserSearchResult, restricted to the fields
// this service actually uses.
type searchResponse struct {
	TotalResults int        `json:"totalResults"`
	Resources    []scimUser `json:"Resources"`
}

// scimUser mirrors the SCIM User record, restricted to the account-lock
// state carried in the WSO2 extension schema — no other user attributes
// (name, phone, claims, etc.) are unmarshaled here.
type scimUser struct {
	SchemaScope *scimSchema `json:"urn:scim:wso2:schema,omitempty"`
}

// scimSchema holds the WSO2-specific SCIM extension fields this service
// reads. Asgardeo returns accountLocked as a quoted string ("true"/"false"),
// not a JSON boolean — do not change these to *bool or unmarshaling will fail.
type scimSchema struct {
	AccountLocked *string `json:"accountLocked,omitempty"`
	AccountState  *string `json:"accountState,omitempty"`
}
