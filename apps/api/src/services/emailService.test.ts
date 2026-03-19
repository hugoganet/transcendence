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
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM_EMAIL = "noreply@test.com";
    mockSend.mockResolvedValue({ data: { id: "email-123" }, error: null });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ─── sendPasswordResetEmail ───────────────────────────────────────

  describe("sendPasswordResetEmail", () => {
    it("sends email with correct params when Resend is configured", async () => {
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
      const { sendPasswordResetEmail } = await import("./emailService.js");
      await sendPasswordResetEmail("user@example.com", "https://app.test/reset");

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("#FAF8F5");
      expect(call.html).toContain("Source Sans 3");
      expect(call.html).toContain("#2B9E9E");
    });

    it("sends French copy when locale is 'fr'", async () => {
      const { sendPasswordResetEmail } = await import("./emailService.js");
      await sendPasswordResetEmail(
        "user@example.com",
        "https://app.test/reset",
        "fr",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toBe("Réinitialisation de votre mot de passe");
      expect(call.html).toContain("Réinitialiser mon mot de passe");
      expect(call.html).toContain("Vous avez demandé à réinitialiser votre mot de passe");
      expect(call.html).toContain("Ce lien expire dans 1 heure");
      expect(call.text).toContain("Réinitialisation de votre mot de passe");
    });
  });

  // ─── sendGdprExportEmail ──────────────────────────────────────────

  describe("sendGdprExportEmail", () => {
    it("sends email with correct params when Resend is configured", async () => {
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
      const { sendGdprExportEmail } = await import("./emailService.js");
      await sendGdprExportEmail("user@example.com", "https://app.test/export");

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("#FAF8F5");
      expect(call.html).toContain("Source Sans 3");
      expect(call.html).toContain("#2B9E9E");
    });

    it("sends French copy when locale is 'fr'", async () => {
      const { sendGdprExportEmail } = await import("./emailService.js");
      await sendGdprExportEmail(
        "user@example.com",
        "https://app.test/export",
        "fr",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toBe("Votre export de données est prêt");
      expect(call.html).toContain("Télécharger mes données");
      expect(call.html).toContain("Vous avez demandé un export de vos données personnelles");
      expect(call.html).toContain("Ce lien expire dans 24 heures");
      expect(call.text).toContain("Votre export de données est prêt");
    });
  });

  // ─── sendGdprDeletionConfirmEmail ─────────────────────────────────

  describe("sendGdprDeletionConfirmEmail", () => {
    it("sends email with correct params when Resend is configured", async () => {
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
      const { sendGdprDeletionConfirmEmail } = await import("./emailService.js");
      await sendGdprDeletionConfirmEmail("user@example.com", "https://app.test/delete");

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("#D44D4D");
    });

    it("contains branding elements in HTML template", async () => {
      const { sendGdprDeletionConfirmEmail } = await import("./emailService.js");
      await sendGdprDeletionConfirmEmail("user@example.com", "https://app.test/delete");

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("#FAF8F5");
      expect(call.html).toContain("Source Sans 3");
    });

    it("sends French copy when locale is 'fr'", async () => {
      const { sendGdprDeletionConfirmEmail } = await import("./emailService.js");
      await sendGdprDeletionConfirmEmail(
        "user@example.com",
        "https://app.test/delete",
        "fr",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toBe("Confirmez la suppression de votre compte");
      expect(call.html).toContain("Confirmer la suppression");
      expect(call.html).toContain("Cette action est définitive");
      expect(call.html).toContain("#D44D4D");
      expect(call.text).toContain("Confirmez la suppression de votre compte");
    });
  });

  // ─── sendReEngagementEmail ────────────────────────────────────────

  describe("sendReEngagementEmail", () => {
    it("sends email with correct params when Resend is configured", async () => {
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

    it("sends French copy when locale is 'fr'", async () => {
      const { sendReEngagementEmail } = await import("./emailService.js");
      await sendReEngagementEmail(
        "user@example.com",
        "TestUser",
        { totalMissions: 5, totalChapters: 2, daysSinceLastMission: 10 },
        "https://app.test/curriculum",
        "fr",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toBe("Votre parcours vous attend");
      expect(call.html).toContain("Bon retour, TestUser !");
      expect(call.html).toContain("5 missions");
      expect(call.html).toContain("2 chapitres");
      expect(call.html).toContain("Reprendre l&#39;apprentissage");
      expect(call.text).toContain("Bon retour, TestUser !");
    });

    it("uses generic French greeting when displayName is null", async () => {
      const { sendReEngagementEmail } = await import("./emailService.js");
      await sendReEngagementEmail(
        "user@example.com",
        null,
        { totalMissions: 3, totalChapters: 1, daysSinceLastMission: 5 },
        "https://app.test/curriculum",
        "fr",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Bon retour !");
      expect(call.html).not.toContain("Bon retour, ");
      expect(call.text).toContain("Bon retour !");
    });
  });

  // ─── sendStreakReminderEmail ───────────────────────────────────────

  describe("sendStreakReminderEmail", () => {
    it("sends EN email for streak > 1 with displayName", async () => {
      const { sendStreakReminderEmail } = await import("./emailService.js");
      await sendStreakReminderEmail(
        "user@example.com",
        "en",
        "Alice",
        7,
        "https://app.test/mission",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toBe("Your 7-day streak is on the line");
      expect(call.html).toContain("Alice, you&#39;re on a 7-day streak");
      expect(call.html).toContain("Keep My Streak Alive");
      expect(call.html).toContain("turn off these reminders");
    });

    it("sends EN email for streak = 1 with displayName", async () => {
      const { sendStreakReminderEmail } = await import("./emailService.js");
      await sendStreakReminderEmail(
        "user@example.com",
        "en",
        "Bob",
        1,
        "https://app.test/mission",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toBe("One more day and you've got a streak");
      expect(call.html).toContain("Bob, you completed a mission yesterday");
      expect(call.html).toContain("Start Today&#39;s Mission");
    });

    it("sends EN email for streak > 1 without displayName", async () => {
      const { sendStreakReminderEmail } = await import("./emailService.js");
      await sendStreakReminderEmail(
        "user@example.com",
        "en",
        null,
        5,
        "https://app.test/mission",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("You&#39;re on a 5-day streak");
      expect(call.html).not.toContain("null");
    });

    it("sends EN email for streak = 1 without displayName", async () => {
      const { sendStreakReminderEmail } = await import("./emailService.js");
      await sendStreakReminderEmail(
        "user@example.com",
        "en",
        null,
        1,
        "https://app.test/mission",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("You completed a mission yesterday");
      expect(call.html).not.toContain("null");
    });

    it("sends FR email for streak > 1 with displayName", async () => {
      const { sendStreakReminderEmail } = await import("./emailService.js");
      await sendStreakReminderEmail(
        "user@example.com",
        "fr",
        "Alice",
        7,
        "https://app.test/mission",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toBe("Votre série de 7 jours est en jeu");
      expect(call.html).toContain("Alice, vous êtes sur une série de 7 jours");
      expect(call.html).toContain("Maintenir ma série");
      expect(call.html).toContain("désactiver ces rappels");
    });

    it("sends FR email for streak = 1 with displayName", async () => {
      const { sendStreakReminderEmail } = await import("./emailService.js");
      await sendStreakReminderEmail(
        "user@example.com",
        "fr",
        "Bob",
        1,
        "https://app.test/mission",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toBe("Encore un jour et vous avez une série");
      expect(call.html).toContain("Bob, vous avez complété une mission hier");
      expect(call.html).toContain("Commencer la mission du jour");
    });

    it("sends FR email for streak > 1 without displayName", async () => {
      const { sendStreakReminderEmail } = await import("./emailService.js");
      await sendStreakReminderEmail(
        "user@example.com",
        "fr",
        null,
        3,
        "https://app.test/mission",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Vous êtes sur une série de 3 jours");
      expect(call.html).not.toContain("null");
    });

    it("contains the resume link in html and text", async () => {
      const { sendStreakReminderEmail } = await import("./emailService.js");
      await sendStreakReminderEmail(
        "user@example.com",
        "en",
        "Alice",
        5,
        "https://app.test/mission",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("https://app.test/mission");
      expect(call.text).toContain("https://app.test/mission");
    });
  });

  // ─── sendAchievementEmail ─────────────────────────────────────────

  describe("sendAchievementEmail", () => {
    it("sends EN email with displayName", async () => {
      const { sendAchievementEmail } = await import("./emailService.js");
      await sendAchievementEmail(
        "user@example.com",
        "en",
        "Alice",
        "First Steps",
        "Complete your first mission.",
        "https://app.test/achievements",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toBe("You earned: First Steps");
      expect(call.html).toContain("Alice, you just unlocked First Steps.");
      expect(call.html).toContain("Complete your first mission.");
      expect(call.html).toContain("View Your Achievement");
      expect(call.html).toContain("https://app.test/achievements");
    });

    it("sends EN email without displayName", async () => {
      const { sendAchievementEmail } = await import("./emailService.js");
      await sendAchievementEmail(
        "user@example.com",
        "en",
        null,
        "First Steps",
        "Complete your first mission.",
        "https://app.test/achievements",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("You just unlocked First Steps.");
      expect(call.html).not.toContain("null");
      expect(call.text).toContain("You just unlocked First Steps.");
    });

    it("sends FR email with displayName", async () => {
      const { sendAchievementEmail } = await import("./emailService.js");
      await sendAchievementEmail(
        "user@example.com",
        "fr",
        "Alice",
        "Premiers Pas",
        "Complétez votre première mission.",
        "https://app.test/achievements",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toBe("Vous avez débloqué : Premiers Pas");
      expect(call.html).toContain("Alice, vous venez de débloquer Premiers Pas.");
      expect(call.html).toContain("Complétez votre première mission.");
      expect(call.html).toContain("Voir mon accomplissement");
    });

    it("sends FR email without displayName", async () => {
      const { sendAchievementEmail } = await import("./emailService.js");
      await sendAchievementEmail(
        "user@example.com",
        "fr",
        null,
        "Premiers Pas",
        "Complétez votre première mission.",
        "https://app.test/achievements",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Vous venez de débloquer Premiers Pas.");
      expect(call.html).not.toContain("null");
    });

    it("escapes HTML in achievement name and body", async () => {
      const { sendAchievementEmail } = await import("./emailService.js");
      await sendAchievementEmail(
        "user@example.com",
        "en",
        "Alice",
        "<script>alert('xss')</script>",
        "Description with <b>html</b>",
        "https://app.test/achievements",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).not.toContain("<script>");
      expect(call.html).toContain("&lt;script&gt;");
      expect(call.html).toContain("&lt;b&gt;html&lt;/b&gt;");
    });

    it("contains the resume link in html and text", async () => {
      const { sendAchievementEmail } = await import("./emailService.js");
      await sendAchievementEmail(
        "user@example.com",
        "en",
        null,
        "Badge",
        "You did it.",
        "https://app.test/achievements",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("https://app.test/achievements");
      expect(call.text).toContain("https://app.test/achievements");
    });
  });

  // ─── sendWelcomeEmail ─────────────────────────────────────────────

  describe("sendWelcomeEmail", () => {
    it("sends EN email with displayName", async () => {
      const { sendWelcomeEmail } = await import("./emailService.js");
      await sendWelcomeEmail(
        "user@example.com",
        "en",
        "Alice",
        "https://app.test/start",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toBe("You're in. Let's start.");
      expect(call.html).toContain("Welcome to Transcendence, Alice.");
      expect(call.html).toContain("blockchain actually works");
      expect(call.html).toContain("Start Your First Mission");
      expect(call.html).toContain("https://app.test/start");
    });

    it("sends EN email without displayName", async () => {
      const { sendWelcomeEmail } = await import("./emailService.js");
      await sendWelcomeEmail(
        "user@example.com",
        "en",
        null,
        "https://app.test/start",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Welcome to Transcendence.");
      expect(call.html).not.toContain("Welcome to Transcendence, ");
      expect(call.html).not.toContain("null");
      expect(call.text).toContain("Welcome to Transcendence.");
    });

    it("sends FR email with displayName", async () => {
      const { sendWelcomeEmail } = await import("./emailService.js");
      await sendWelcomeEmail(
        "user@example.com",
        "fr",
        "Alice",
        "https://app.test/start",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toBe("Vous êtes inscrit·e. C'est parti.");
      expect(call.html).toContain("Bienvenue sur Transcendence, Alice.");
      expect(call.html).toContain("la blockchain fonctionne vraiment");
      expect(call.html).toContain("Commencer ma première mission");
    });

    it("sends FR email without displayName", async () => {
      const { sendWelcomeEmail } = await import("./emailService.js");
      await sendWelcomeEmail(
        "user@example.com",
        "fr",
        null,
        "https://app.test/start",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Bienvenue sur Transcendence.");
      expect(call.html).not.toContain("Bienvenue sur Transcendence, ");
      expect(call.html).not.toContain("null");
    });

    it("escapes HTML in displayName", async () => {
      const { sendWelcomeEmail } = await import("./emailService.js");
      await sendWelcomeEmail(
        "user@example.com",
        "en",
        "<script>xss</script>",
        "https://app.test/start",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).not.toContain("<script>");
      expect(call.html).toContain("&lt;script&gt;xss&lt;/script&gt;");
    });

    it("contains branding elements in HTML template", async () => {
      const { sendWelcomeEmail } = await import("./emailService.js");
      await sendWelcomeEmail(
        "user@example.com",
        "en",
        null,
        "https://app.test/start",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("#FAF8F5");
      expect(call.html).toContain("Source Sans 3");
      expect(call.html).toContain("#2B9E9E");
    });

    it("contains the start link in html and text", async () => {
      const { sendWelcomeEmail } = await import("./emailService.js");
      await sendWelcomeEmail(
        "user@example.com",
        "en",
        null,
        "https://app.test/start",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("https://app.test/start");
      expect(call.text).toContain("https://app.test/start");
    });
  });

  describe("sendCompletionEmail", () => {
    it("sends EN completion email with display name", async () => {
      const { sendCompletionEmail } = await import("./emailService.js");
      await sendCompletionEmail(
        "grad@example.com",
        "en",
        "Alice",
        "https://app.test/certificate",
      );

      expect(mockSend).toHaveBeenCalledOnce();
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe("grad@example.com");
      expect(call.subject).toBe("You completed Transcendence");
      expect(call.html).toContain("Congratulations, Alice.");
      expect(call.html).toContain("all 69 missions");
      expect(call.html).toContain("https://app.test/certificate");
    });

    it("sends FR completion email with display name", async () => {
      const { sendCompletionEmail } = await import("./emailService.js");
      await sendCompletionEmail(
        "grad@example.com",
        "fr",
        "Alice",
        "https://app.test/certificate",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toBe("Vous avez terminé Transcendence");
      expect(call.html).toContain("Félicitations, Alice.");
      expect(call.html).toContain("69 missions");
      expect(call.html).toContain("Voir mon certificat");
    });

    it("sends EN completion email without display name", async () => {
      const { sendCompletionEmail } = await import("./emailService.js");
      await sendCompletionEmail(
        "grad@example.com",
        "en",
        null,
        "https://app.test/certificate",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Congratulations.");
      expect(call.html).not.toContain("Congratulations, .");
    });

    it("contains the certificate link in html and text", async () => {
      const { sendCompletionEmail } = await import("./emailService.js");
      await sendCompletionEmail(
        "grad@example.com",
        "en",
        null,
        "https://app.test/certificate",
      );

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("https://app.test/certificate");
      expect(call.text).toContain("https://app.test/certificate");
    });
  });
});
