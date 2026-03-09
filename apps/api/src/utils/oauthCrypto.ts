import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV (GCM standard)
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

function getKey(): Buffer {
  const hex = process.env.OAUTH_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      "OAUTH_ENCRYPTION_KEY environment variable is not set. " +
        "Generate one with: openssl rand -hex 32",
    );
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error(
      `OAUTH_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Got ${hex.length} hex characters.`,
    );
  }
  return key;
}

export function encryptOAuthToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // Pack: iv(12) + authTag(16) + ciphertext → hex string
  return Buffer.concat([iv, authTag, encrypted]).toString("hex");
}

export function decryptOAuthToken(stored: string): string {
  const key = getKey();
  const data = Buffer.from(stored, "hex");
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8",
  );
}
