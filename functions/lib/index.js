"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptField = exports.encryptFieldsL5 = exports.encryptFieldsL4 = exports.encryptFieldsL3 = exports.encryptFieldsL2 = exports.encryptFieldsL1 = void 0;
const crypto = require("crypto");
const admin = require("firebase-admin");
const functions = require("firebase-functions");
admin.initializeApp();
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY ?? "";
const FIELDS_TO_ENCRYPT = (process.env.FIELDS_TO_ENCRYPT ?? "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
const ENCRYPTED_FIELD_SUFFIX = process.env.ENCRYPTED_FIELD_SUFFIX ?? "_enc";
const ALGORITHM = "aes-256-gcm";
function getKey() {
    if (ENCRYPTION_KEY_HEX.length !== 64) {
        throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes).");
    }
    return Buffer.from(ENCRYPTION_KEY_HEX, "hex");
}
function encrypt(plaintext) {
    const key = getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}
function decrypt(encoded) {
    const key = getKey();
    const buf = Buffer.from(encoded, "base64");
    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext) + decipher.final("utf8");
}
async function handleWrite(change) {
    if (FIELDS_TO_ENCRYPT.length === 0) return null;
    const after = change.after;
    if (!after.exists) return null;
    const data = after.data();
    const updates = {};
    const deletions = {};
    let hasChanges = false;
    for (const field of FIELDS_TO_ENCRYPT) {
        const encField = `${field}${ENCRYPTED_FIELD_SUFFIX}`;
        if (data[encField] !== undefined && data[field] === undefined) continue;
        if (typeof data[field] === "string") {
            try {
                updates[encField] = encrypt(data[field]);
                deletions[field] = admin.firestore.FieldValue.delete();
                hasChanges = true;
            }
            catch (err) {
                functions.logger.error(`Failed to encrypt field "${field}"`, { err, path: after.ref.path });
            }
        }
    }
    if (!hasChanges) return null;
    functions.logger.info("Encrypting fields", { path: after.ref.path, fields: Object.keys(updates) });
    try {
        await after.ref.update({ ...updates, ...deletions });
    }
    catch (err) {
        functions.logger.error("Failed to write encrypted fields", { err });
    }
    return null;
}
exports.encryptFieldsL1 = functions.firestore.document("{c1}/{d1}").onWrite((change) => handleWrite(change));
exports.encryptFieldsL2 = functions.firestore.document("{c1}/{d1}/{c2}/{d2}").onWrite((change) => handleWrite(change));
exports.encryptFieldsL3 = functions.firestore.document("{c1}/{d1}/{c2}/{d2}/{c3}/{d3}").onWrite((change) => handleWrite(change));
exports.encryptFieldsL4 = functions.firestore.document("{c1}/{d1}/{c2}/{d2}/{c3}/{d3}/{c4}/{d4}").onWrite((change) => handleWrite(change));
exports.encryptFieldsL5 = functions.firestore.document("{c1}/{d1}/{c2}/{d2}/{c3}/{d3}/{c4}/{d4}/{c5}/{d5}").onWrite((change) => handleWrite(change));
exports.decryptField = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed. Use POST." }); return; }
    const { documentPath, field } = req.body;
    if (!documentPath || !field) { res.status(400).json({ error: "Missing required body fields: documentPath, field" }); return; }
    const encField = `${field}${ENCRYPTED_FIELD_SUFFIX}`;
    try {
        const snap = await admin.firestore().doc(documentPath).get();
        if (!snap.exists) { res.status(404).json({ error: "Document not found" }); return; }
        const data = snap.data();
        if (typeof data[encField] !== "string") { res.status(404).json({ error: `Encrypted field "${encField}" not found or not a string` }); return; }
        const plaintext = decrypt(data[encField]);
        res.status(200).json({ field, value: plaintext });
    }
    catch (err) {
        functions.logger.error("Decryption failed", { err, documentPath, field });
        res.status(500).json({ error: "Decryption failed" });
    }
});
