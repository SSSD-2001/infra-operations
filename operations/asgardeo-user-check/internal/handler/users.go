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

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"regexp"

	"github.com/wso2-open-operations/infra-operations/operations/asgardeo-user-check/internal/scim"
)

// maxRequestBodyBytes caps the request body size accepted by this public,
// unauthenticated endpoint.
const maxRequestBodyBytes = 4 << 10 // 4 KiB

// emailPattern intentionally restricts the accepted character set. The email
// is interpolated into a SCIM filter expression downstream, so characters
// that could alter filter semantics (quotes, spaces, parentheses, etc.) are
// rejected outright rather than escaped.
var emailPattern = regexp.MustCompile(`^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`)

// scimClient abstracts the SCIM operations used by UsersHandler, allowing the
// handler to be tested independently of the real HTTP client.
type scimClient interface {
	CheckUserExists(ctx context.Context, email string) (scim.Result, error)
}

// UsersHandler handles HTTP requests for user existence checks.
type UsersHandler struct {
	scim scimClient
}

// NewUsersHandler creates a UsersHandler backed by the given SCIM client.
func NewUsersHandler(scim scimClient) *UsersHandler {
	return &UsersHandler{scim: scim}
}

// existsRequest is the POST /organizations/external/users/validate request shape.
type existsRequest struct {
	Email string `json:"email"`
}

// existsResponse is the POST /organizations/external/users/validate response
// shape. Locked is always present in the JSON output — it is null when the
// user does not exist, or when Asgardeo did not return a determinate
// account-locked state (do not add omitempty here).
type existsResponse struct {
	Exists bool  `json:"exists"`
	Locked *bool `json:"locked"`
}

// Exists handles POST /organizations/external/users/validate. It reports
// whether a user with the given email exists in the external Asgardeo
// organization and, if so, its account-locked state — without leaking any
// other user attributes.
func (h *UsersHandler) Exists(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
	body, err := io.ReadAll(r.Body)
	if err != nil {
		if _, ok := err.(*http.MaxBytesError); ok {
			writeError(w, http.StatusRequestEntityTooLarge, ErrMsgTooLarge)
			return
		}
		writeError(w, http.StatusBadRequest, errMsgReadBody)
		return
	}

	var payload existsRequest
	if err := json.Unmarshal(body, &payload); err != nil {
		writeError(w, http.StatusBadRequest, ErrMsgBadRequest)
		return
	}

	if !emailPattern.MatchString(payload.Email) {
		writeError(w, http.StatusBadRequest, "A valid email must be provided.")
		return
	}

	result, err := h.scim.CheckUserExists(r.Context(), payload.Email)
	if err != nil {
		slog.ErrorContext(r.Context(), "scim CheckUserExists failed", "err", err)
		mapUpstreamError(w, err, "Failed to check user existence.")
		return
	}

	writeJSONValue(w, http.StatusOK, existsResponse{Exists: result.Exists, Locked: result.Locked})
}
