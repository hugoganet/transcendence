import { Resend } from "resend";

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (resend) return resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  resend = new Resend(apiKey);
  return resend;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// --- Shared helpers (private) ---

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  const client = getResendClient();
  if (!client) {
    console.warn(
      `[emailService] RESEND_API_KEY not configured — skipping ${subject}`,
    );
    return;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const { error } = await client.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error(`[emailService] Failed to send "${subject}":`, error);
  }
}

function buildEmailWrapper(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Source Sans 3', Arial, sans-serif; background: #FAF8F5; padding: 40px 0;">
  <div style="max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
    <h1 style="color: #2B2522; font-size: 24px; margin: 0 0 16px;">${escapeHtml(title)}</h1>
    ${contentHtml}
  </div>
</body>
</html>`;
}

function buildCtaButton(
  href: string,
  label: string,
  color: string = "#2B9E9E",
): string {
  return `<a href="${escapeHtml(href)}" style="display: inline-block; background: ${escapeHtml(color)}; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
      ${escapeHtml(label)}
    </a>`;
}

// --- Public email functions ---

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
): Promise<void> {
  const subject = "Reset Your Password";

  const contentHtml = `
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
      You requested a password reset. Click the button below to choose a new password.
    </p>
    ${buildCtaButton(resetLink, "Reset Password")}
    <p style="color: #8A817A; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
      This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
    </p>`;

  const text = `Reset Your Password

You requested a password reset. Visit the link below to choose a new password:

${resetLink}

This link expires in 1 hour. If you didn't request this, you can safely ignore this email.`;

  await sendEmail(to, subject, buildEmailWrapper(subject, contentHtml), text);
}

export async function sendGdprExportEmail(
  to: string,
  downloadLink: string,
): Promise<void> {
  const subject = "Your Data Export Is Ready";

  const contentHtml = `
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
      You requested an export of your personal data. Click the button below to download your data as a JSON file.
    </p>
    ${buildCtaButton(downloadLink, "Download Your Data")}
    <p style="color: #8A817A; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
      This link expires in 24 hours and can only be used once. If you didn't request this, you can safely ignore this email.
    </p>`;

  const text = `Your Data Export Is Ready

You requested an export of your personal data. Visit the link below to download your data:

${downloadLink}

This link expires in 24 hours and can only be used once. If you didn't request this, you can safely ignore this email.`;

  await sendEmail(to, subject, buildEmailWrapper(subject, contentHtml), text);
}

export async function sendGdprDeletionConfirmEmail(
  to: string,
  confirmLink: string,
): Promise<void> {
  const subject = "Confirm Account Deletion";

  const contentHtml = `
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
      You requested to delete your account and all personal data. This action is permanent and cannot be undone.
    </p>
    ${buildCtaButton(confirmLink, "Confirm Deletion", "#D44D4D")}
    <p style="color: #8A817A; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
      This link expires in 24 hours. If you didn't request this, you can safely ignore this email — your account will not be deleted.
    </p>`;

  const text = `Confirm Account Deletion

You requested to delete your account and all personal data. This action is permanent and cannot be undone.

Visit the link below to confirm deletion:

${confirmLink}

This link expires in 24 hours. If you didn't request this, you can safely ignore this email — your account will not be deleted.`;

  await sendEmail(to, subject, buildEmailWrapper(subject, contentHtml), text);
}

export async function sendReEngagementEmail(
  to: string,
  displayName: string | null,
  stats: {
    totalMissions: number;
    totalChapters: number;
    daysSinceLastMission: number;
  },
  resumeLink: string,
): Promise<void> {
  const greeting = displayName
    ? `Welcome back, ${displayName}!`
    : "Welcome back!";
  const subject = "Your learning journey awaits";

  const contentHtml = `
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
      ${escapeHtml(greeting)} You've completed ${stats.totalMissions} mission${stats.totalMissions !== 1 ? "s" : ""} and mastered ${stats.totalChapters} chapter${stats.totalChapters !== 1 ? "s" : ""}. Your progress is still here — pick up where you left off!
    </p>
    ${buildCtaButton(resumeLink, "Continue Learning")}
    <p style="color: #8A817A; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
      Not interested? You can manage your notification preferences in settings.
    </p>`;

  const text = `${greeting}

You've completed ${stats.totalMissions} mission${stats.totalMissions !== 1 ? "s" : ""} and mastered ${stats.totalChapters} chapter${stats.totalChapters !== 1 ? "s" : ""}. Your progress is still here — pick up where you left off!

${resumeLink}

Not interested? Manage your notification preferences in settings.`;

  await sendEmail(to, subject, buildEmailWrapper(subject, contentHtml), text);
}
