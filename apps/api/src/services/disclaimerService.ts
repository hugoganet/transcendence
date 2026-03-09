import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { getGeneralDisclaimer, getModuleDisclaimer } from "../content/disclaimers.js";
import { sanitizeUser } from "./authService.js";

export function getOnboardingDisclaimer() {
  return { text: getGeneralDisclaimer(), type: "onboarding" as const };
}

export function getGeneralDisclaimerResponse() {
  return { text: getGeneralDisclaimer(), type: "general" as const };
}

export function getModuleDisclaimerResponse(moduleId: string) {
  const text = getModuleDisclaimer(moduleId);
  if (!text) {
    throw new AppError(404, "NO_DISCLAIMER", "No disclaimer for this module");
  }
  return { text, type: "module" as const, moduleId };
}

export async function acceptDisclaimer(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound("User not found");
  }

  // Idempotent: if already accepted, return user without update.
  // Note: A benign TOCTOU race exists where concurrent requests may both
  // see null and both update. The result is still correct (both set a
  // timestamp), only the final timestamp value may differ slightly.
  if (user.disclaimerAcceptedAt) {
    return sanitizeUser(user);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { disclaimerAcceptedAt: new Date() },
  });

  return sanitizeUser(updated);
}
