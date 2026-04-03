/**
 * @file Email Service — sends transactional emails via Resend (welcome, reset, GDPR, etc.).
 * FR: Service email — envoie les emails transactionnels via Resend (bienvenue, reinitialisation, RGPD, etc.).
 */

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
  locale: string = "en",
): Promise<void> {
  const isFr = locale === "fr";
  const isEs = locale === "es";

  const subject = isFr
    ? "Réinitialisation de votre mot de passe"
    : isEs
      ? "Restablece tu contraseña"
      : "Reset Your Password";

  const bodyText = isFr
    ? "Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau."
    : isEs
      ? "Solicitaste restablecer tu contraseña. Haz clic en el botón de abajo para elegir una nueva."
      : "You requested a password reset. Click the button below to choose a new password.";

  const ctaLabel = isFr
    ? "Réinitialiser mon mot de passe"
    : isEs
      ? "Restablecer contraseña"
      : "Reset Password";

  const footerText = isFr
    ? "Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email — votre compte reste intact."
    : isEs
      ? "Este enlace expira en 1 hora. Si no solicitaste esto, puedes ignorar este correo."
      : "This link expires in 1 hour. If you didn't request this, you can safely ignore this email.";

  const contentHtml = `
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
      ${escapeHtml(bodyText)}
    </p>
    ${buildCtaButton(resetLink, ctaLabel)}
    <p style="color: #8A817A; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
      ${escapeHtml(footerText)}
    </p>`;

  const plainBodyText = isFr
    ? "Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour en choisir un nouveau :"
    : isEs
      ? "Solicitaste restablecer tu contraseña. Visita el enlace de abajo para elegir una nueva:"
      : "You requested a password reset. Visit the link below to choose a new password:";

  const text = `${subject}

${plainBodyText}

${resetLink}

${footerText}`;

  await sendEmail(to, subject, buildEmailWrapper(subject, contentHtml), text);
}

export async function sendGdprExportEmail(
  to: string,
  downloadLink: string,
  locale: string = "en",
): Promise<void> {
  const isFr = locale === "fr";
  const isEs = locale === "es";

  const subject = isFr
    ? "Votre export de données est prêt"
    : isEs
      ? "Tu exportación de datos está lista"
      : "Your Data Export Is Ready";

  const bodyText = isFr
    ? "Vous avez demandé un export de vos données personnelles. Cliquez sur le bouton ci-dessous pour télécharger votre fichier JSON."
    : isEs
      ? "Solicitaste una exportación de tus datos personales. Haz clic en el botón de abajo para descargar tu archivo JSON."
      : "You requested an export of your personal data. Click the button below to download your data as a JSON file.";

  const ctaLabel = isFr
    ? "Télécharger mes données"
    : isEs
      ? "Descargar mis datos"
      : "Download Your Data";

  const footerText = isFr
    ? "Ce lien expire dans 24 heures et ne peut être utilisé qu'une seule fois. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email."
    : isEs
      ? "Este enlace expira en 24 horas y solo puede usarse una vez. Si no solicitaste esto, puedes ignorar este correo."
      : "This link expires in 24 hours and can only be used once. If you didn't request this, you can safely ignore this email.";

  const contentHtml = `
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
      ${escapeHtml(bodyText)}
    </p>
    ${buildCtaButton(downloadLink, ctaLabel)}
    <p style="color: #8A817A; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
      ${escapeHtml(footerText)}
    </p>`;

  const plainBodyText = isFr
    ? "Vous avez demandé un export de vos données personnelles. Cliquez sur le lien ci-dessous pour télécharger vos données :"
    : isEs
      ? "Solicitaste una exportación de tus datos personales. Visita el enlace de abajo para descargarlos:"
      : "You requested an export of your personal data. Visit the link below to download your data:";

  const text = `${subject}

${plainBodyText}

${downloadLink}

${footerText}`;

  await sendEmail(to, subject, buildEmailWrapper(subject, contentHtml), text);
}

export async function sendGdprDeletionConfirmEmail(
  to: string,
  confirmLink: string,
  locale: string = "en",
): Promise<void> {
  const isFr = locale === "fr";
  const isEs = locale === "es";

  const subject = isFr
    ? "Confirmez la suppression de votre compte"
    : isEs
      ? "Confirma la eliminación de tu cuenta"
      : "Confirm Account Deletion";

  const bodyText = isFr
    ? "Vous avez demandé la suppression de votre compte et de toutes vos données personnelles. Cette action est définitive."
    : isEs
      ? "Solicitaste eliminar tu cuenta y todos tus datos personales. Esta acción es permanente e irreversible."
      : "You requested to delete your account and all personal data. This action is permanent and cannot be undone.";

  const ctaLabel = isFr
    ? "Confirmer la suppression"
    : isEs
      ? "Confirmar eliminación"
      : "Confirm Deletion";

  const footerText = isFr
    ? "Ce lien expire dans 24 heures. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email — votre compte ne sera pas supprimé."
    : isEs
      ? "Este enlace expira en 24 horas. Si no solicitaste esto, puedes ignorar este correo — tu cuenta no será eliminada."
      : "This link expires in 24 hours. If you didn't request this, you can safely ignore this email — your account will not be deleted.";

  const contentHtml = `
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
      ${escapeHtml(bodyText)}
    </p>
    ${buildCtaButton(confirmLink, ctaLabel, "#D44D4D")}
    <p style="color: #8A817A; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
      ${escapeHtml(footerText)}
    </p>`;

  const plainBodyText = isFr
    ? "Vous avez demandé la suppression de votre compte et de toutes vos données personnelles. Cette action est définitive.\n\nCliquez sur le lien ci-dessous pour confirmer la suppression :"
    : isEs
      ? "Solicitaste eliminar tu cuenta y todos tus datos personales. Esta acción es permanente e irreversible.\n\nVisita el enlace de abajo para confirmar la eliminación:"
      : "You requested to delete your account and all personal data. This action is permanent and cannot be undone.\n\nVisit the link below to confirm deletion:";

  const text = `${subject}

${plainBodyText}

${confirmLink}

${footerText}`;

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
  locale: string = "en",
): Promise<void> {
  const isFr = locale === "fr";
  const isEs = locale === "es";

  const greeting = isFr
    ? displayName
      ? `Bon retour, ${displayName} !`
      : "Bon retour !"
    : isEs
      ? displayName
        ? `¡Bienvenido de vuelta, ${displayName}!`
        : "¡Bienvenido de vuelta!"
      : displayName
        ? `Welcome back, ${displayName}!`
        : "Welcome back!";

  const subject = isFr
    ? "Votre parcours vous attend"
    : isEs
      ? "Tu viaje de aprendizaje te espera"
      : "Your learning journey awaits";

  const statsText = isFr
    ? `Vous avez terminé ${stats.totalMissions} mission${stats.totalMissions !== 1 ? "s" : ""} et maîtrisé ${stats.totalChapters} chapitre${stats.totalChapters !== 1 ? "s" : ""}. Tout votre avancement est intact — reprenez là où vous vous êtes arrêté·e.`
    : isEs
      ? `Has completado ${stats.totalMissions} ${stats.totalMissions !== 1 ? "misiones" : "misión"} y dominado ${stats.totalChapters} ${stats.totalChapters !== 1 ? "capítulos" : "capítulo"}. Tu progreso sigue aquí — retoma donde lo dejaste.`
      : `You've completed ${stats.totalMissions} mission${stats.totalMissions !== 1 ? "s" : ""} and mastered ${stats.totalChapters} chapter${stats.totalChapters !== 1 ? "s" : ""}. Your progress is still here — pick up where you left off!`;

  const ctaLabel = isFr
    ? "Reprendre l'apprentissage"
    : isEs
      ? "Continuar aprendiendo"
      : "Continue Learning";

  const footerText = isFr
    ? "Vous préférez ne plus recevoir ces emails ? Gérez vos préférences de notification dans les paramètres."
    : isEs
      ? "¿No te interesa? Puedes gestionar tus preferencias de notificación en los ajustes."
      : "Not interested? You can manage your notification preferences in settings.";

  const contentHtml = `
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
      ${escapeHtml(greeting)} ${escapeHtml(statsText)}
    </p>
    ${buildCtaButton(resumeLink, ctaLabel)}
    <p style="color: #8A817A; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
      ${escapeHtml(footerText)}
    </p>`;

  const plainFooterText = isFr
    ? "Vous préférez ne plus recevoir ces emails ? Gérez vos préférences de notification dans les paramètres."
    : isEs
      ? "¿No te interesa? Gestiona tus preferencias de notificación en los ajustes."
      : "Not interested? Manage your notification preferences in settings.";

  const text = `${greeting}

${statsText}

${resumeLink}

${plainFooterText}`;

  await sendEmail(to, subject, buildEmailWrapper(subject, contentHtml), text);
}

export async function sendStreakReminderEmail(
  to: string,
  locale: string = "en",
  displayName: string | null,
  currentStreak: number,
  resumeLink: string,
): Promise<void> {
  const isFr = locale === "fr";
  const isEs = locale === "es";
  const isMultiDay = currentStreak > 1;
  const safeName = displayName ? escapeHtml(displayName) : null;

  let subject: string;
  let bodyText: string;
  let ctaLabel: string;
  let footerText: string;

  if (isFr) {
    if (isMultiDay) {
      subject = `Votre série de ${currentStreak} jours est en jeu`;
      bodyText = safeName
        ? `${safeName}, vous êtes sur une série de ${currentStreak} jours. Une mission aujourd'hui et elle continue.`
        : `Vous êtes sur une série de ${currentStreak} jours. Une mission aujourd'hui et elle continue.`;
      ctaLabel = "Maintenir ma série";
      footerText = "Vous pouvez désactiver ces rappels dans les paramètres.";
    } else {
      subject = "Encore un jour et vous avez une série";
      bodyText = safeName
        ? `${safeName}, vous avez complété une mission hier. Une de plus aujourd'hui et votre série est lancée.`
        : "Vous avez complété une mission hier. Une de plus aujourd'hui et votre série est lancée.";
      ctaLabel = "Commencer la mission du jour";
      footerText = "Vous pouvez désactiver ces rappels dans les paramètres.";
    }
  } else if (isEs) {
    if (isMultiDay) {
      subject = `Tu racha de ${currentStreak} días está en riesgo`;
      bodyText = safeName
        ? `${safeName}, llevas una racha de ${currentStreak} días. Una misión hoy y sigue adelante.`
        : `Llevas una racha de ${currentStreak} días. Una misión hoy y sigue adelante.`;
      ctaLabel = "Mantener mi racha";
      footerText = "Puedes desactivar estos recordatorios en los ajustes.";
    } else {
      subject = "Un día más y tendrás una racha";
      bodyText = safeName
        ? `${safeName}, completaste una misión ayer. Una más hoy y tu racha habrá comenzado.`
        : "Completaste una misión ayer. Una más hoy y tu racha habrá comenzado.";
      ctaLabel = "Empezar la misión de hoy";
      footerText = "Puedes desactivar estos recordatorios en los ajustes.";
    }
  } else {
    if (isMultiDay) {
      subject = `Your ${currentStreak}-day streak is on the line`;
      bodyText = safeName
        ? `${safeName}, you're on a ${currentStreak}-day streak. One mission today keeps it going.`
        : `You're on a ${currentStreak}-day streak. One mission today keeps it going.`;
      ctaLabel = "Keep My Streak Alive";
      footerText = "You can turn off these reminders in settings.";
    } else {
      subject = "One more day and you've got a streak";
      bodyText = safeName
        ? `${safeName}, you completed a mission yesterday. One more today and your streak is officially started.`
        : "You completed a mission yesterday. One more today and your streak is officially started.";
      ctaLabel = "Start Today's Mission";
      footerText = "You can turn off these reminders in settings.";
    }
  }

  const contentHtml = `
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
      ${bodyText}
    </p>
    ${buildCtaButton(resumeLink, ctaLabel)}
    <p style="color: #8A817A; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
      ${escapeHtml(footerText)}
    </p>`;

  const text = `${bodyText}

${resumeLink}

${footerText}`;

  await sendEmail(to, subject, buildEmailWrapper(subject, contentHtml), text);
}

export async function sendAchievementEmail(
  to: string,
  locale: string = "en",
  displayName: string | null,
  achievementName: string,
  achievementBody: string,
  resumeLink: string,
): Promise<void> {
  const isFr = locale === "fr";
  const isEs = locale === "es";
  const safeName = displayName ? escapeHtml(displayName) : null;
  const safeAchievementName = escapeHtml(achievementName);
  const safeAchievementBody = escapeHtml(achievementBody);

  const subject = isFr
    ? `Vous avez débloqué : ${achievementName}`
    : isEs
      ? `Has desbloqueado: ${achievementName}`
      : `You earned: ${achievementName}`;

  const bodyLine = isFr
    ? safeName
      ? `${safeName}, vous venez de débloquer ${safeAchievementName}.`
      : `Vous venez de débloquer ${safeAchievementName}.`
    : isEs
      ? safeName
        ? `${safeName}, acabas de desbloquear ${safeAchievementName}.`
        : `Acabas de desbloquear ${safeAchievementName}.`
      : safeName
        ? `${safeName}, you just unlocked ${safeAchievementName}.`
        : `You just unlocked ${safeAchievementName}.`;

  const ctaLabel = isFr
    ? "Voir mon accomplissement"
    : isEs
      ? "Ver mi logro"
      : "View Your Achievement";

  const contentHtml = `
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 8px;">
      ${bodyLine}
    </p>
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
      ${safeAchievementBody}
    </p>
    ${buildCtaButton(resumeLink, ctaLabel)}`;

  const text = `${isFr ? (safeName ? `${displayName}, vous venez de débloquer ${achievementName}.` : `Vous venez de débloquer ${achievementName}.`) : isEs ? (safeName ? `${displayName}, acabas de desbloquear ${achievementName}.` : `Acabas de desbloquear ${achievementName}.`) : (safeName ? `${displayName}, you just unlocked ${achievementName}.` : `You just unlocked ${achievementName}.`)}

${achievementBody}

${resumeLink}`;

  await sendEmail(to, subject, buildEmailWrapper(subject, contentHtml), text);
}

export async function sendCompletionEmail(
  to: string,
  locale: string = "en",
  displayName: string | null,
  certificateLink: string,
): Promise<void> {
  const isFr = locale === "fr";
  const isEs = locale === "es";
  const safeName = displayName ? escapeHtml(displayName) : null;

  const subject = isFr
    ? "Vous avez terminé Transcendence"
    : isEs
      ? "Has completado Transcendence"
      : "You completed Transcendence";

  const greetingLine = isFr
    ? safeName
      ? `Félicitations, ${safeName}.`
      : "Félicitations."
    : isEs
      ? safeName
        ? `Felicidades, ${safeName}.`
        : "Felicidades."
      : safeName
        ? `Congratulations, ${safeName}.`
        : "Congratulations.";

  const bodyText = isFr
    ? "Vous avez terminé les 69 missions et maîtrisé chaque concept. Votre certificat est prêt — partagez-le avec le monde."
    : isEs
      ? "Has completado las 69 misiones y dominado cada concepto. Tu certificado está listo — compártelo con el mundo."
      : "You've completed all 69 missions and mastered every concept. Your certificate is ready — share it with the world.";

  const ctaLabel = isFr
    ? "Voir mon certificat"
    : isEs
      ? "Ver mi certificado"
      : "View My Certificate";

  const contentHtml = `
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 8px;">
      ${greetingLine}
    </p>
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
      ${escapeHtml(bodyText)}
    </p>
    ${buildCtaButton(certificateLink, ctaLabel)}`;

  const plainGreeting = isFr
    ? displayName
      ? `Félicitations, ${displayName}.`
      : "Félicitations."
    : isEs
      ? displayName
        ? `Felicidades, ${displayName}.`
        : "Felicidades."
      : displayName
        ? `Congratulations, ${displayName}.`
        : "Congratulations.";

  const text = `${plainGreeting}

${bodyText}

${certificateLink}`;

  await sendEmail(to, subject, buildEmailWrapper(subject, contentHtml), text);
}

export async function sendWelcomeEmail(
  to: string,
  locale: string = "en",
  displayName: string | null,
  startLink: string,
): Promise<void> {
  const isFr = locale === "fr";
  const isEs = locale === "es";
  const safeName = displayName ? escapeHtml(displayName) : null;

  const subject = isFr
    ? "Vous êtes inscrit·e. C'est parti."
    : isEs
      ? "Ya estás dentro. Comencemos."
      : "You're in. Let's start.";

  const greetingLine = isFr
    ? safeName
      ? `Bienvenue sur Transcendence, ${safeName}.`
      : "Bienvenue sur Transcendence."
    : isEs
      ? safeName
        ? `Bienvenido a Transcendence, ${safeName}.`
        : "Bienvenido a Transcendence."
      : safeName
        ? `Welcome to Transcendence, ${safeName}.`
        : "Welcome to Transcendence.";

  const contentText = isFr
    ? "Vous allez apprendre comment la blockchain fonctionne vraiment — sans jargon inutile, sans buzz. Des explications claires et des missions concrètes. À la fin, vous maîtriserez une technologie que la plupart des gens font semblant de comprendre."
    : isEs
      ? "Vas a aprender cómo funciona realmente blockchain — sin jerga, sin exageraciones, solo explicaciones claras y misiones prácticas. Al final, comprenderás una tecnología que la mayoría solo finge entender."
      : "You're about to learn how blockchain actually works — no jargon, no hype, just clear explanations and hands-on missions. By the end, you'll understand a technology that most people only pretend to.";

  const ctaLabel = isFr
    ? "Commencer ma première mission"
    : isEs
      ? "Empezar mi primera misión"
      : "Start Your First Mission";

  const contentHtml = `
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 8px;">
      ${greetingLine}
    </p>
    <p style="color: #5C534D; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
      ${escapeHtml(contentText)}
    </p>
    ${buildCtaButton(startLink, ctaLabel)}`;

  const plainGreeting = isFr
    ? displayName
      ? `Bienvenue sur Transcendence, ${displayName}.`
      : "Bienvenue sur Transcendence."
    : isEs
      ? displayName
        ? `Bienvenido a Transcendence, ${displayName}.`
        : "Bienvenido a Transcendence."
      : displayName
        ? `Welcome to Transcendence, ${displayName}.`
        : "Welcome to Transcendence.";

  const text = `${plainGreeting}

${contentText}

${startLink}`;

  await sendEmail(to, subject, buildEmailWrapper(subject, contentHtml), text);
}
