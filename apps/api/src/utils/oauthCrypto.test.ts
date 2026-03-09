import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Valid 256-bit key (64 hex chars)
const TEST_KEY = "b".repeat(64);

describe("oauthCrypto", () => {
  const originalEnv = process.env.OAUTH_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.OAUTH_ENCRYPTION_KEY = TEST_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.OAUTH_ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.OAUTH_ENCRYPTION_KEY;
    }
  });

  async function loadModule() {
    return import("./oauthCrypto.js");
  }

  describe("encrypt/decrypt round-trip", () => {
    it("should encrypt and decrypt back to original value", async () => {
      const { encryptOAuthToken, decryptOAuthToken } = await loadModule();
      const token = "ya29.a0AfH6SMBx-example-access-token";
      const encrypted = encryptOAuthToken(token);
      const decrypted = decryptOAuthToken(encrypted);
      expect(decrypted).toBe(token);
    });

    it("should handle empty strings", async () => {
      const { encryptOAuthToken, decryptOAuthToken } = await loadModule();
      const encrypted = encryptOAuthToken("");
      const decrypted = decryptOAuthToken(encrypted);
      expect(decrypted).toBe("");
    });

    it("should handle long tokens", async () => {
      const { encryptOAuthToken, decryptOAuthToken } = await loadModule();
      const longToken = "A".repeat(2048);
      const encrypted = encryptOAuthToken(longToken);
      const decrypted = decryptOAuthToken(encrypted);
      expect(decrypted).toBe(longToken);
    });
  });

  describe("unique IVs", () => {
    it("should produce different ciphertexts for the same plaintext", async () => {
      const { encryptOAuthToken } = await loadModule();
      const token = "ya29.a0AfH6SMBx-example-access-token";
      const encrypted1 = encryptOAuthToken(token);
      const encrypted2 = encryptOAuthToken(token);
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe("tampered ciphertext detection", () => {
    it("should throw on tampered ciphertext (GCM integrity)", async () => {
      const { encryptOAuthToken, decryptOAuthToken } = await loadModule();
      const encrypted = encryptOAuthToken("some-oauth-token");
      const tampered =
        encrypted.substring(0, 56) +
        "ff" +
        encrypted.substring(58);
      expect(() => decryptOAuthToken(tampered)).toThrow();
    });

    it("should throw on tampered auth tag", async () => {
      const { encryptOAuthToken, decryptOAuthToken } = await loadModule();
      const encrypted = encryptOAuthToken("some-oauth-token");
      const tampered =
        encrypted.substring(0, 24) +
        "ff".repeat(16) +
        encrypted.substring(56);
      expect(() => decryptOAuthToken(tampered)).toThrow();
    });
  });

  describe("missing encryption key", () => {
    it("should throw clear error when OAUTH_ENCRYPTION_KEY is not set", async () => {
      delete process.env.OAUTH_ENCRYPTION_KEY;
      const { encryptOAuthToken } = await loadModule();
      expect(() => encryptOAuthToken("test")).toThrow(
        "OAUTH_ENCRYPTION_KEY environment variable is not set",
      );
    });

    it("should throw clear error when key is wrong length", async () => {
      process.env.OAUTH_ENCRYPTION_KEY = "aabbcc"; // too short
      const { encryptOAuthToken } = await loadModule();
      expect(() => encryptOAuthToken("test")).toThrow(
        "OAUTH_ENCRYPTION_KEY must be exactly 64 hex characters",
      );
    });

    it("should throw clear error on decrypt when key is missing", async () => {
      const { encryptOAuthToken } = await loadModule();
      const encrypted = encryptOAuthToken("test");

      delete process.env.OAUTH_ENCRYPTION_KEY;
      const { decryptOAuthToken } = await loadModule();
      expect(() => decryptOAuthToken(encrypted)).toThrow(
        "OAUTH_ENCRYPTION_KEY environment variable is not set",
      );
    });
  });
});
