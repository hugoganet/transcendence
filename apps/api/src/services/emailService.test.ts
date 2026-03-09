import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

// Mock Resend before importing emailService
vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: mockSend };
  },
}));

describe("emailService", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("sendPasswordResetEmail", () => {
    it("sends email with correct params when Resend is configured", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      process.env.RESEND_FROM_EMAIL = "noreply@test.com";
      mockSend.mockResolvedValue({ data: { id: "email-123" }, error: null });

      const { sendPasswordResetEmail } = await import("./emailService.js");
      await sendPasswordResetEmail(
        "user@example.com",
        "https://app.test/reset-password?token=abc123",
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: "Reset Your Password",
        }),
      );
      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("https://app.test/reset-password?token=abc123");
      expect(call.text).toContain("https://app.test/reset-password?token=abc123");
    });

    it("logs warning and does not throw when Resend is not configured", async () => {
      delete process.env.RESEND_API_KEY;
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { sendPasswordResetEmail } = await import("./emailService.js");
      await expect(
        sendPasswordResetEmail("user@example.com", "https://app.test/reset"),
      ).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("RESEND_API_KEY not configured"),
      );
      expect(mockSend).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("logs error but does not throw when Resend returns an error", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({
        data: null,
        error: { message: "Invalid API key" },
      });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { sendPasswordResetEmail } = await import("./emailService.js");
      await expect(
        sendPasswordResetEmail("user@example.com", "https://app.test/reset"),
      ).resolves.toBeUndefined();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send"),
        expect.objectContaining({ message: "Invalid API key" }),
      );
      errorSpy.mockRestore();
    });
  });
});
