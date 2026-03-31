## Version 0.1.0

- Initial release.
- AES-256-GCM encryption with random IV per value.
- Supports documents at depths 1–5.
- Configurable field list and encrypted field suffix.
- Infinite-loop guard: skips documents that already have encrypted fields and no plaintext.
- `decryptField` HTTPS endpoint for server-side decryption.
- ENCRYPTION_KEY stored as a Firebase Secret (type: secret in extension.yaml).
