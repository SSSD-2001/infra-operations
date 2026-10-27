# Asgardeo User Check

Go HTTP server (`net/http`, Go 1.25+) with a single public, unauthenticated
endpoint: check whether a user exists in the external Asgardeo organization
by email, returning `{"exists": bool, "locked": bool|null}` — no other user
attributes (name, phone, claims, etc.) are ever read or returned.

## Middleware chain

`SecurityHeaders → Logger → Mux`

- `SecurityHeaders` (`internal/middleware/security_headers.go`): sets `X-Content-Type-Options: nosniff`, `Content-Security-Policy: upgrade-insecure-requests`, and `Strict-Transport-Security: max-age=31536000; includeSubDomains` on every response; outermost so headers are present on every response
- `Logger` (`internal/middleware/logger.go`): logs every completed request (method, path, status, elapsed) via slog

There is deliberately no `Auth` middleware — this service has exactly one
public, unauthenticated endpoint by design. Do not add JWT/API-key gating
without an explicit request to change that design. There is also no
correlation-ID middleware — keep this service minimal; do not reintroduce one
without an explicit request.

`middleware.ConfigureLogger()` must be called at startup to set up the
default slog handler.

## Upstream

`internal/scim` is a thin client of the internal SCIM operations service,
authenticated via OAuth2 client credentials (`SCIM_TOKEN_URL`/`SCIM_CLIENT_ID`/`SCIM_CLIENT_SECRET`/`SCIM_SCOPES`). It calls only the
external-organization user search path — this service has no use for the
internal-org endpoints and should not be wired to them.

`CheckUserExists` requests the minimal attribute set (`userName` and the
`urn:scim:wso2:schema` extension) and `itemsPerPage: 1`, and reads only
`totalResults` plus two fields of the `urn:scim:wso2:schema` extension:
`accountLocked` (checked first) and `accountState` (fallback, mapped
`LOCKED`/`UNLOCKED` → bool). `accountLocked` comes back from Asgardeo as a
quoted string (`"true"`/`"false"`), not a JSON boolean — it's typed `*string`
in `scimUser` (`internal/scim/types.go`) and parsed explicitly; do not change
it back to `*bool`. `scimUser` intentionally has no other fields — do not add
more of the SCIM response to it (name, phone, claims, etc.) without an
explicit request, since the whole point of this service is to expose nothing
beyond existence and lock state.

## Running locally

```bash
# from operations/asgardeo-user-check
go run ./cmd/server
```

The server auto-loads `.env` from the working directory at startup (silently
ignored if absent).

## Commands

```bash
make vet     # go vet
make test    # vet + race-detector tests
make build   # runs tests then compiles ./cmd/server
```

## Handler conventions

- **Body size**: capped with `http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)` (4 KiB) before reading — this endpoint takes a single short field, so the limit is intentionally tight
- **Email validation**: `emailPattern` in `internal/handler/users.go` is a strict allowlist regex, not just format validation — it exists to prevent SCIM filter injection, since the email is interpolated directly into a `userName eq <email>` filter expression. Do not relax it to accept quotes, parentheses, or whitespace
- **Upstream errors**: always use `mapUpstreamError(w, err, "<fallback message>")` — never write custom status mappings inline
- **Response**: only ever return `{"exists": bool, "locked": bool|null}` — do not add fields from the SCIM response to this endpoint's output, even if convenient, since the whole point of this service is to expose nothing beyond existence and lock state

## Security

- **Never commit secrets** — SCIM client credentials must not appear in source code or config files; use environment variables
- **No sensitive data in logs** — do not log request bodies or email addresses; log only error summaries
- **This endpoint is intentionally public** — do not add authentication to it as a "fix"; if abuse becomes a concern, handle it at the gateway/network layer (e.g. Choreo rate limiting), not in application code, unless asked to change the design
- **Input validation** — the email regex is a security control (filter-injection prevention), not just UX validation; treat changes to it as security-sensitive
- **Error messages** — never leak upstream error details to the caller; use the fixed `ErrMsg*` constants or a short fallback message

## OpenAPI spec

`openapi.yaml` must be updated whenever the API changes — it is the contract
for anything integrating with this service.
