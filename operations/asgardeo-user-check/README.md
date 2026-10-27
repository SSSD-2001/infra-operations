# Asgardeo User Check

A small, unauthenticated public service with a single endpoint: check whether
a user exists in the external Asgardeo organization, by email, and whether
their account is locked — without exposing any other user attributes.

It is a thin client of the internal SCIM operations service, wired only to
that service's external-organization user search endpoint.

## Endpoint

`POST /organizations/external/users/validate`

Request:

```json
{ "email": "user@example.com" }
```

Response:

```json
{ "exists": true, "locked": false }
```

`locked` is `null` when `exists` is `false`, or if Asgardeo did not return a
determinate account-locked state.

## Configuration

Copy `.env.example` to `.env` and fill in the SCIM operations service
credentials (client-credentials OAuth2 app registered against
scim-operations-service, scoped to the external-org user search endpoint).

## Running the service

Requires Go 1.25+.

1. From this directory, copy the env template and fill in the SCIM
   credentials:

   ```bash
   cp .env.example .env
   ```

2. Run it directly (auto-loads `.env` from the working directory):

   ```bash
   go run ./cmd/server
   ```

   Or build and run a binary:

   ```bash
   make build
   ./server
   ```

By default the server listens on port `8080` (override with `PORT` in `.env`).
Once running:

```bash
curl http://localhost:8080/health

curl -X POST http://localhost:8080/organizations/external/users/validate \
  -d '{"email":"user@example.com"}'
# {"exists": true, "locked": false}
```
