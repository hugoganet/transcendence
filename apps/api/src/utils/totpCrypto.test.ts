import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Valid 256-bit key (64 hex chars)
const TEST_KEY = "a".repeat(64);

describe("totpCrypto", () => {
  const originalEnv = process.env.TOTP_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.TOTP_ENCRYPTION_KEY = TEST_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.TOTP_ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.TOTP_ENCRYPTION_KEY;
    }
  });

  async function loadModule() {
    return import("./totpCrypto.js");
  }

  describe("encrypt/decrypt round-trip", () => {
    it("should encrypt and decrypt back to original value", async () => {
      const { encryptTotpSecret, decryptTotpSecret } = await loadModule();
      const secret = "JBSWY3DPEHPK3PXP";
      const encrypted = encryptTotpSecret(secret);
      const decrypted = decryptTotpSecret(encrypted);
      expect(decrypted).toBe(secret);
    });

    it("should handle empty strings", async () => {
      const { encryptTotpSecret, decryptTotpSecret } = await loadModule();
      const encrypted = encryptTotpSecret("");
      const decrypted = decryptTotpSecret(encrypted);
      expect(decrypted).toBe("");
    });

    it("should handle long strings", async () => {
      const { encryptTotpSecret, decryptTotpSecret } = await loadModule();
      const longSecret = "A".repeat(500);
      const encrypted = encryptTotpSecret(longSecret);
      const decrypted = decryptTotpSecret(encrypted);
      expect(decrypted).toBe(longSecret);
    });
  });

  describe("unique IVs", () => {
    it("should produce different ciphertexts for the same plaintext", async () => {
      const { encryptTotpSecret } = await loadModule();
      const secret = "JBSWY3DPEHPK3PXP";
      const encrypted1 = encryptTotpSecret(secret);
      const encrypted2 = encryptTotpSecret(secret);
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe("tampered ciphertext detection", () => {
    it("should throw on tampered ciphertext (GCM integrity)", async () => {
      const { encryptTotpSecret, decryptTotpSecret } = await loadModule();
      const encrypted = encryptTotpSecret("JBSWY3DPEHPK3PXP");
      // Tamper with the ciphertext portion (after iv + authTag = 28 bytes = 56 hex chars)
      const tampered =
        encrypted.substring(0, 56) +
        "ff" +
        encrypted.substring(58);
      expect(() => decryptTotpSecret(tampered)).toThrow();
    });

    it("should throw on tampered auth tag", async () => {
      const { encryptTotpSecret, decryptTotpSecret } = await loadModule();
      const encrypted = encryptTotpSecret("JBSWY3DPEHPK3PXP");
      // Tamper with auth tag (bytes 12-28 = hex chars 24-56)
      const tampered =
        encrypted.substring(0, 24) +
        "ff".repeat(16) +
        encrypted.substring(56);
      expect(() => decryptTotpSecret(tampered)).toThrow();
    });
  });

  describe("missing encryption key", () => {
    it("should throw clear error when TOTP_ENCRYPTION_KEY is not set", async () => {
      delete process.env.TOTP_ENCRYPTION_KEY;
      const { encryptTotpSecret } = await loadModule();
      expect(() => encryptTotpSecret("test")).toThrow(
        "TOTP_ENCRYPTION_KEY environment variable is not set",
      );
    });

    it("should throw clear error when key is wrong length", async () => {
      process.env.TOTP_ENCRYPTION_KEY = "aabbcc"; // too short
      const { encryptTotpSecret } = await loadModule();
      expect(() => encryptTotpSecret("test")).toThrow(
        "TOTP_ENCRYPTION_KEY must be exactly 64 hex characters",
      );
    });

    it("should throw clear error on decrypt when key is missing", async () => {
      const { encryptTotpSecret } = await loadModule();
      const encrypted = encryptTotpSecret("test");

      delete process.env.TOTP_ENCRYPTION_KEY;
      const { decryptTotpSecret } = await loadModule();
      expect(() => decryptTotpSecret(encrypted)).toThrow(
        "TOTP_ENCRYPTION_KEY environment variable is not set",
      );
    });
  });
});
