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

    it("contains branding elements in HTML template", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({ data: { id: "email-123" }, error: null });

      const { sendPasswordResetEmail } = await import("./emailService.js");
      await sendPasswordResetEmail("user@example.com", "https://app.test/reset");

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("#FAF8F5");
      expect(call.html).toContain("Source Sans 3");
      expect(call.html).toContain("#2B9E9E");
    });
  });

  describe("sendGdprExportEmail", () => {
    it("sends email with correct params when Resend is configured", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      process.env.RESEND_FROM_EMAIL = "noreply@test.com";
      mockSend.mockResolvedValue({ data: { id: "email-456" }, error: null });

      const { sendGdprExportEmail } = await import("./emailService.js");
      await sendGdprExportEmail(
        "user@example.com",
        "https://app.test/export/download?token=xyz",
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: "Your Data Export Is Ready",
        }),
      );
      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("https://app.test/export/download?token=xyz");
      expect(call.text).toContain("https://app.test/export/download?token=xyz");
    });

    it("logs warning and does not throw when Resend is not configured", async () => {
      delete process.env.RESEND_API_KEY;
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { sendGdprExportEmail } = await import("./emailService.js");
      await expect(
        sendGdprExportEmail("user@example.com", "https://app.test/export"),
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
        error: { message: "Rate limited" },
      });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { sendGdprExportEmail } = await import("./emailService.js");
      await expect(
        sendGdprExportEmail("user@example.com", "https://app.test/export"),
      ).resolves.toBeUndefined();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send"),
        expect.objectContaining({ message: "Rate limited" }),
      );
      errorSpy.mockRestore();
    });

    it("contains branding elements in HTML template", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({ data: { id: "email-456" }, error: null });

      const { sendGdprExportEmail } = await import("./emailService.js");
      await sendGdprExportEmail("user@example.com", "https://app.test/export");

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("#FAF8F5");
      expect(call.html).toContain("Source Sans 3");
      expect(call.html).toContain("#2B9E9E");
    });
  });

  describe("sendGdprDeletionConfirmEmail", () => {
    it("sends email with correct params when Resend is configured", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      process.env.RESEND_FROM_EMAIL = "noreply@test.com";
      mockSend.mockResolvedValue({ data: { id: "email-789" }, error: null });

      const { sendGdprDeletionConfirmEmail } = await import("./emailService.js");
      await sendGdprDeletionConfirmEmail(
        "user@example.com",
        "https://app.test/delete/confirm?token=del123",
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: "Confirm Account Deletion",
        }),
      );
      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("https://app.test/delete/confirm?token=del123");
      expect(call.text).toContain("https://app.test/delete/confirm?token=del123");
    });

    it("logs warning and does not throw when Resend is not configured", async () => {
      delete process.env.RESEND_API_KEY;
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { sendGdprDeletionConfirmEmail } = await import("./emailService.js");
      await expect(
        sendGdprDeletionConfirmEmail("user@example.com", "https://app.test/delete"),
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
        error: { message: "Server error" },
      });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { sendGdprDeletionConfirmEmail } = await import("./emailService.js");
      await expect(
        sendGdprDeletionConfirmEmail("user@example.com", "https://app.test/delete"),
      ).resolves.toBeUndefined();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send"),
        expect.objectContaining({ message: "Server error" }),
      );
      errorSpy.mockRestore();
    });

    it("uses red #D44D4D button for destructive action", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({ data: { id: "email-789" }, error: null });

      const { sendGdprDeletionConfirmEmail } = await import("./emailService.js");
      await sendGdprDeletionConfirmEmail("user@example.com", "https://app.test/delete");

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("#D44D4D");
    });

    it("contains branding elements in HTML template", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({ data: { id: "email-789" }, error: null });

      const { sendGdprDeletionConfirmEmail } = await import("./emailService.js");
      await sendGdprDeletionConfirmEmail("user@example.com", "https://app.test/delete");

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("#FAF8F5");
      expect(call.html).toContain("Source Sans 3");
    });
  });

  describe("sendReEngagementEmail", () => {
    it("sends email with correct params when Resend is configured", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      process.env.RESEND_FROM_EMAIL = "noreply@test.com";
      mockSend.mockResolvedValue({ data: { id: "email-reengage" }, error: null });

      const { sendReEngagementEmail } = await import("./emailService.js");
      await sendReEngagementEmail(
        "user@example.com",
        "TestUser",
        { totalMissions: 5, totalChapters: 2, daysSinceLastMission: 10 },
        "https://app.test/curriculum",
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: "Your learning journey awaits",
        }),
      );
      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("https://app.test/curriculum");
      expect(call.html).toContain("Welcome back, TestUser!");
      expect(call.html).toContain("5 missions");
      expect(call.html).toContain("2 chapters");
      expect(call.text).toContain("https://app.test/curriculum");
      expect(call.text).toContain("Welcome back, TestUser!");
    });

    it("uses generic greeting when displayName is null", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({ data: { id: "email-reengage" }, error: null });

      const { sendReEngagementEmail } = await import("./emailService.js");
      await sendReEngagementEmail(
        "user@example.com",
        null,
        { totalMissions: 1, totalChapters: 0, daysSinceLastMission: 8 },
        "https://app.test/curriculum",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Welcome back!");
      expect(call.html).not.toContain("Welcome back, ");
      expect(call.text).toContain("Welcome back!");
    });

    it("handles singular mission/chapter correctly", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({ data: { id: "email-reengage" }, error: null });

      const { sendReEngagementEmail } = await import("./emailService.js");
      await sendReEngagementEmail(
        "user@example.com",
        "User",
        { totalMissions: 1, totalChapters: 1, daysSinceLastMission: 7 },
        "https://app.test/curriculum",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("1 mission");
      expect(call.html).not.toContain("1 missions");
      expect(call.html).toContain("1 chapter");
      expect(call.html).not.toContain("1 chapters");
    });

    it("logs warning and does not throw when Resend is not configured", async () => {
      delete process.env.RESEND_API_KEY;
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { sendReEngagementEmail } = await import("./emailService.js");
      await expect(
        sendReEngagementEmail(
          "user@example.com",
          "TestUser",
          { totalMissions: 5, totalChapters: 2, daysSinceLastMission: 10 },
          "https://app.test/curriculum",
        ),
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
        error: { message: "Resend error" },
      });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { sendReEngagementEmail } = await import("./emailService.js");
      await expect(
        sendReEngagementEmail(
          "user@example.com",
          "TestUser",
          { totalMissions: 5, totalChapters: 2, daysSinceLastMission: 10 },
          "https://app.test/curriculum",
        ),
      ).resolves.toBeUndefined();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send"),
        expect.objectContaining({ message: "Resend error" }),
      );
      errorSpy.mockRestore();
    });

    it("contains branding elements in HTML template", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockResolvedValue({ data: { id: "email-reengage" }, error: null });

      const { sendReEngagementEmail } = await import("./emailService.js");
      await sendReEngagementEmail(
        "user@example.com",
        "TestUser",
        { totalMissions: 5, totalChapters: 2, daysSinceLastMission: 10 },
        "https://app.test/curriculum",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("#FAF8F5");
      expect(call.html).toContain("Source Sans 3");
      expect(call.html).toContain("#2B9E9E");
      expect(call.html).toContain("Continue Learning");
    });
  });
});
