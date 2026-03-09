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

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
): Promise<void> {
  const client = getResendClient();
  if (!client) {
    console.warn(
      "[emailService] RESEND_API_KEY not configured — skipping password reset email",
    );
    return;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const { error } = await client.emails.send({
    from: fromEmail,
    to,
    subject: "Reset Your Password",
    html: buildPasswordResetHtml(resetLink),
    text: buildPasswordResetText(resetLink),
  });

  if (error) {
    console.error("[emailService] Failed to send password reset email:", error);
  }
}

function buildPasswordResetHtml(resetLink: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Source Sans 3', Arial, sans-serif; background: #FAF8F5; padding: 40px 0;">
  <div style="max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
    <h1 style="color: #2B2522; font-size: 24px; margin: 0 0 16px;">Reset Your Password</h1>
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
      You requested a password reset. Click the button below to choose a new password.
    </p>
    <a href="${escapeHtml(resetLink)}" style="display: inline-block; background: #2B9E9E; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
      Reset Password
    </a>
    <p style="color: #8A817A; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
      This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`;
}

function buildPasswordResetText(resetLink: string): string {
  return `Reset Your Password

You requested a password reset. Visit the link below to choose a new password:

${resetLink}

This link expires in 1 hour. If you didn't request this, you can safely ignore this email.`;
}
