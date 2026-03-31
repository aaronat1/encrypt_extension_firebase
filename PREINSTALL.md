# Firestore Field Encrypt

This extension automatically encrypts sensitive fields (email, phone, SSN, etc.) in Firestore documents using AES-256-GCM on write, and provides a server-side HTTPS endpoint to decrypt them on demand. Encrypted values are stored as base64 strings; the plaintext fields are removed.

## How It Works

1. When a document is created or updated, any configured plaintext fields are encrypted.
2. The encrypted value is stored in `{field}{ENCRYPTED_FIELD_SUFFIX}` (e.g., `email_enc`).
3. The original plaintext field is deleted from the document.
4. To read the decrypted value, call the `decryptField` HTTPS endpoint from your backend.

## Prerequisites

- Firebase project with Firestore enabled.
- A 32-byte AES-256 key stored as a Firebase Secret (64 hex characters).

## Generate an Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Store this value as a Firebase Secret via the Firebase Console or CLI.

## Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `LOCATION` | Cloud Functions region | `us-central1` |
| `ENCRYPTION_KEY` | 64-char hex AES-256 key (secret) | _(required)_ |
| `FIELDS_TO_ENCRYPT` | Comma-separated field names | _(required)_ |
| `ENCRYPTED_FIELD_SUFFIX` | Suffix for encrypted fields | `_enc` |

## Security

- **Never** expose the `decryptField` endpoint publicly. Protect it with Firebase App Check or call it from a trusted server environment only.
- Use Firebase Secrets to store `ENCRYPTION_KEY` — never put it in source code or `.env` files committed to version control.
- Losing the encryption key means losing access to all encrypted data permanently.

## Billing

This extension uses Cloud Functions for Firebase. See [Firebase Pricing](https://firebase.google.com/pricing) for details.
