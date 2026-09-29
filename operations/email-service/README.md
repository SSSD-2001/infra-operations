# Go Email Service

A robust, simple, and dependency-free (other than the standard library) HTTP microservice built in Go for dispatching emails through an SMTP server.

## Features

- **Zero external dependencies**: Built entirely on the Go standard library.
- **Standard Go layout**: Strict `cmd/` and `internal/` separation for maintainability.
- **Secure by default**: STARTTLS with TLS 1.2 minimum; context-aware timeouts on all SMTP operations.
- **Testable design**: Full Mailer interface abstraction allowing fast, mock-based unit tests with no network calls.
- **RESTful API**: `/send-email` for dispatch and `/health-check` for deep SMTP connectivity verification.
- **OpenAPI Specification**: Defined in [`openapi.yaml`](./openapi.yaml) for easy integration and documentation.

## Endpoints

### `GET /health-check`

Performs a real SMTP dial + STARTTLS + AUTH + QUIT to confirm the upstream server is reachable and credentials are valid.

**Responses**

| Status                    | Body                      |
| ------------------------- | ------------------------- |
| `200 OK`                  | `{"status": "healthy"}`   |
| `503 Service Unavailable` | `{"status": "unhealthy"}` |

### `POST /send-email`

Sends an email with an HTML body and optional file attachments.

**Request Body (JSON)**:

```json
{
  "to":          ["addr@example.com"],          // required, non-empty
  "cc":          ["cc@example.com"],            // optional
  "bcc":         ["bcc@example.com"],           // optional
  "replyTo":     ["reply@example.com"],         // optional
  "from":        "sender@example.com",          // required, non-empty
  "subject":     "Hello",                       // required
  "template":    "<base64-encoded HTML>",       // required — see note below
  "attachments": [{                             // optional
    "contentName": "file.pdf",
    "contentType": "application/pdf",
    "attachment":  "<base64-encoded bytes>",
    "inline":      false,                       // optional, default false
    "contentId":   ""                           // required when inline is true
  }]
}
```

> The HTML body is transmitted as a base64 string to avoid ambiguity when the template contains characters that clash with JSON encoding (e.g., unescaped `<`, `>`, or embedded quotes in inline scripts/styles). Callers encode the raw HTML once; this service decodes it and encodes it again as `quoted-printable` inside the MIME message, which is the standard encoding for HTML email bodies.

**Inline images**: setting `inline: true` on an attachment (with a `contentId`) sends it with `Content-Disposition: inline` and a `Content-ID` header instead of a plain downloadable attachment, so the `template` HTML can reference it directly:

```html
<img src="cid:pasted-image-1@example.com">
```

```json
{
  "attachments": [{
    "contentName": "pasted-image-1.png",
    "contentType": "image/png",
    "attachment":  "<base64-encoded PNG bytes>",
    "inline":      true,
    "contentId":   "pasted-image-1@example.com"
  }]
}
```

`contentId` must be shaped like `local-part@domain` (RFC 2392's `addr-spec`) — a bare token (e.g. `"pasted-image-1"`, no `@`) is rejected. This value is written verbatim into the `Content-ID` header, never reshaped, so the caller must use the exact same string in both the `template`'s `cid:` reference and `contentId` — email-service has no way to know what `cid:` reference the caller already baked into its HTML, so it cannot safely substitute a different value after the fact.

An inline attachment's HTML part and every inline image are nested together inside their own `multipart/related` (`type="text/html"`); a non-inline attachment on the same request stays a sibling under the outer `multipart/mixed`, not nested inside it — matching RFC 2387/RFC 2557's requirement that a `cid:` reference only be guaranteed to resolve to a part inside the same `multipart/related` as the HTML referencing it.

This is the standards-compliant way to embed an image directly in an email (a real `multipart/mixed` MIME part referenced by `cid:`), unlike a `data:` URI embedded in the HTML itself — Gmail and most major webmail clients strip a `data:` image `src` from received HTML on render regardless of how correctly it's encoded, so a caller that needs an image to actually display in the recipient's inbox should always use this, never a `data:` URI in `template`.

**Responses**

| Status                      | Body                                     |
| --------------------------- | ---------------------------------------- |
| `200 OK`                    | `{"message": "email sent successfully"}` |
| `400 Bad Request`           | `{"message": "<validation error>"}`      |
| `413 Payload Too Large`     | `{"message": "request body too large"}`  |
| `500 Internal Server Error` | `{"message": "failed to send email"}`    |

## Configuration

The service prioritises OS environment variables, enabling seamless deployment in containerised environments (Kubernetes, Docker, Choreo). If a variable is not found in the environment it falls back to a `.env` file at the project root.

| Variable                   | Description                                    | Default            |
| -------------------------- | ---------------------------------------------- | ------------------ |
| `SMTP_HOSTNAME`            | SMTP server hostname (e.g. `smtp.example.com`) | **Required**       |
| `SMTP_USERNAME`            | SMTP username or access key                    | **Required**       |
| `SMTP_PASSWORD`            | SMTP password or secret key                    | **Required**       |
| `SMTP_PORT`                | SMTP port                                      | `587`              |
| `PORT`                     | HTTP listening port                            | `9090`             |
| `HTTP_READ_HEADER_TIMEOUT` | Timeout to read request headers                | `5s`               |
| `HTTP_READ_TIMEOUT`        | Timeout to read the full request body          | `10s`              |
| `HTTP_WRITE_TIMEOUT`       | Timeout to write the full response             | `10s`              |
| `HTTP_IDLE_TIMEOUT`        | Keep-alive idle connection timeout             | `120s`             |
| `MAX_REQUEST_BODY_SIZE`    | Maximum request body size in bytes             | `10485760` (10 MB) |
| `SHUTDOWN_TIMEOUT`         | Graceful shutdown timeout                      | `30s`              |

All timeout values accept standard Go duration strings (e.g. `5s`, `1m30s`).

An `.env.example` file is provided. Copy it to `.env` and fill in your SMTP credentials before running locally.

## Running Locally

```bash
# Copy and populate the environment file
cp .env.example .env

# Start the service
go run ./cmd/email-service/
```

## Testing

### Unit Tests

The unit tests use a mock `Mailer` — no network connections are made:

```bash
go test -race -count=1 ./...
```

## License

This project is licensed under the [Apache License 2.0](../../LICENSE). The full license text is in the repository root.
