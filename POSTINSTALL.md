# Firestore Field Encrypt — Setup Complete

The extension is now encrypting the following fields across all collections:

**Fields:** `${param:FIELDS_TO_ENCRYPT}`
**Encrypted suffix:** `${param:ENCRYPTED_FIELD_SUFFIX}`

## How Encrypted Data Looks

```js
// Before encryption (original write):
{ email: "user@example.com", name: "Alice" }

// After encryption (stored in Firestore):
{ email_enc: "base64encodedvalue==", name: "Alice" }
```

## Decrypt a Field (Server-side Only)

```bash
curl -X POST https://${param:LOCATION}-${PROJECT_ID}.cloudfunctions.net/ext-firestore-field-encrypt-decryptField \
  -H "Content-Type: application/json" \
  -d '{"documentPath": "users/abc123", "field": "email"}'
```

Response:
```json
{ "field": "email", "value": "user@example.com" }
```

## Support

[GitHub repository](https://github.com/aaronat1/firestore-field-encrypt)
