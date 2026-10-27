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

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

const (
	// searchPath is the external-organization user search endpoint exposed by
	// the scim-operations-service. Only the external org is wired up here —
	// this service has no use for the internal-org endpoint.
	searchPath = "/organizations/external/users/search"

	attrUserName = "userName"
	attrSchema   = "urn:scim:wso2:schema"
)

// Result is the outcome of a user-existence lookup.
type Result struct {
	Exists bool
	// Locked reports the account-locked state. Nil when the user does not
	// exist, or when Asgardeo did not return the field.
	Locked *bool
}

// CheckUserExists reports whether a user with the given userName (email)
// exists in the external Asgardeo organization, along with its account-locked
// state. The caller is responsible for validating the format of email before
// calling, since it is interpolated into a SCIM filter expression.
func (c *Client) CheckUserExists(ctx context.Context, email string) (Result, error) {
	reqBody, err := json.Marshal(searchRequest{
		Attributes:   []string{attrUserName, attrSchema},
		Filter:       fmt.Sprintf("userName eq %q", email),
		ItemsPerPage: 1,
	})
	if err != nil {
		return Result{}, fmt.Errorf("scim: encode search request: %w", err)
	}

	raw, err := c.do(ctx, http.MethodPost, searchPath, reqBody)
	if err != nil {
		return Result{}, err
	}

	var result searchResponse
	if err := json.Unmarshal(raw, &result); err != nil {
		return Result{}, fmt.Errorf("scim: decode search response: %w", err)
	}

	if result.TotalResults == 0 || len(result.Resources) == 0 {
		return Result{Exists: false}, nil
	}

	return Result{Exists: true, Locked: extractLocked(result.Resources[0].SchemaScope)}, nil
}

// extractLocked derives the account-locked state from the WSO2 SCIM
// extension schema. accountLocked is checked first, falling back to
// accountState if accountLocked is absent or unparseable. Returns nil
// (surfaced as JSON null by the caller) if neither field yields a definite
// answer.
func extractLocked(schema *scimSchema) *bool {
	if schema == nil {
		return nil
	}

	if schema.AccountLocked != nil {
		if b, err := strconv.ParseBool(*schema.AccountLocked); err == nil {
			return &b
		}
	}

	if schema.AccountState != nil {
		switch strings.ToUpper(*schema.AccountState) {
		case "LOCKED":
			locked := true
			return &locked
		case "UNLOCKED":
			locked := false
			return &locked
		}
	}

	return nil
}
