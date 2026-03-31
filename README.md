# Firestore Field Encrypt - Firebase Extension

> Automatically encrypts sensitive Firestore fields (emails, phone numbers, PII) using AES-256-GCM on write. Includes a server-side HTTPS endpoint for decryption. GDPR-friendly by design.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Firebase Extension](https://img.shields.io/badge/Firebase-Extension-FFCA28?logo=firebase)](https://firebase.google.com/products/extensions)

## Why Use This Extension?

Storing sensitive data like emails, phone numbers, and personal identifiers in plaintext is a security risk and a GDPR concern. This extension transparently encrypts configured fields the moment they are written to Firestore, and provides a secure endpoint to decrypt them only when needed.

- **AES-256-GCM encryption** — military-grade, authenticated encryption
- **Transparent** — encrypt on write, decrypt on demand via HTTPS endpoint
- **GDPR-friendly** — encrypted values are unreadable without the key
- **Configurable** — choose which fields to encrypt across all collections
- **Loop-safe** — skips documents that are already encrypted
- **Key management** — encryption key stored as a Firebase Secret

## How It Works

```
1. Client writes:          { email: "alice@example.com", name: "Alice" }
2. Extension encrypts:     { email_enc: "aGVsbG8gd29ybGQ=...", name: "Alice" }
                           (original "email" field is deleted)
3. Server decrypts (API):  POST /decryptField -> { field: "email", value: "alice@example.com" }
```

## Installation

### Option 1: Firebase CLI

```
firebase ext:install aaronat1/firestore-field-encrypt --project=YOUR_PROJECT_ID
```

### Option 2: From Source

```bash
git clone https://github.com/aaronat1/encrypt_extension_firebase.git
cd encrypt_extension_firebase
firebase ext:install . --project=YOUR_PROJECT_ID
```

### Generate an Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: a 64-character hex string like "f3b2c1d4e5f6..."
```

Store this as a Firebase Secret — **never** commit it to source control.

## Configuration Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `LOCATION` | Cloud Functions deployment region | `us-central1` |
| `ENCRYPTION_KEY` | 64-char hex AES-256 key (Firebase Secret) | _(required)_ |
| `FIELDS_TO_ENCRYPT` | Comma-separated field names to encrypt | _(required)_ |
| `ENCRYPTED_FIELD_SUFFIX` | Suffix for encrypted field names | `_enc` |

## Decrypting Data (Server-Side Only)

```bash
curl -X POST https://us-central1-YOUR_PROJECT.cloudfunctions.net/ext-firestore-field-encrypt-decryptField \
  -H "Content-Type: application/json" \
  -d '{"documentPath": "users/alice", "field": "email"}'
```

**Response:**
```json
{ "field": "email", "value": "alice@example.com" }
```

> **Warning:** Never expose the decrypt endpoint to client-side code. Use it only from your backend or Cloud Functions.

## Encryption Details

| Property | Value |
|----------|-------|
| Algorithm | AES-256-GCM |
| Key size | 256 bits (32 bytes) |
| IV | 96 bits (12 bytes), random per value |
| Auth tag | 128 bits (16 bytes) |
| Storage format | Base64(`iv + authTag + ciphertext`) |

## Tech Stack

- **Runtime:** Node.js 20
- **Language:** TypeScript
- **Triggers:** Firestore `onWrite` (depths 1-5) + HTTPS endpoint
- **Dependencies:** `firebase-admin`, `firebase-functions`, Node.js `crypto`

## Security Considerations

- **Key loss = data loss.** If you lose the encryption key, encrypted data cannot be recovered. Back up your key securely.
- Protect the `decryptField` endpoint with Firebase App Check or restrict it to trusted server environments.
- The encryption key is stored as `type: secret` in Firebase, never in plaintext configuration.

## Billing

Blaze plan required. Each document write triggers one encryption function. Decryption calls use HTTPS function invocations. See [Firebase Pricing](https://firebase.google.com/pricing).

## License

Apache 2.0 — see [LICENSE](LICENSE) for details.

## Author

**[@aaronat1](https://github.com/aaronat1)**
