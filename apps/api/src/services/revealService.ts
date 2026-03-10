import { prisma } from "../config/database.js";
import type { RevealStatus } from "@transcendence/shared";

/** Minimal interface for a Prisma-like client (real or transaction). */
type DbClient = Pick<typeof prisma, "user">;

/** Maps API mechanic names to DB column names on the User model. */
const MECHANIC_TO_FIELD: Record<
  string,
  "revealTokens" | "revealWallet" | "revealGas" | "revealDashboard"
> = {
  tokensRevealed: "revealTokens",
  walletRevealed: "revealWallet",
  gasRevealed: "revealGas",
  dashboardRevealed: "revealDashboard",
};

/**
 * Trigger a progressive reveal for a user using the provided DB client.
 * Designed to be called inside an existing interactive transaction.
 *
 * Note: The read-then-write pattern is safe here because this function is always
 * called inside completeMission's $transaction, which provides isolation.
 *
 * @returns `true` if the flag was newly set (was `false` before), `false` if already set or unknown mechanic.
 */
export async function triggerRevealWithClient(
  client: DbClient,
  userId: string,
  mechanic: string,
): Promise<boolean> {
  const field = MECHANIC_TO_FIELD[mechanic];
  if (!field) {
    console.warn(`Unknown reveal mechanic: "${mechanic}" — ignoring.`);
    return false;
  }

  const user = await client.user.findUniqueOrThrow({
    where: { id: userId },
    select: { [field]: true },
  });

  if ((user as Record<string, boolean>)[field]) {
    return false;
  }

  await client.user.update({
    where: { id: userId },
    data: { [field]: true },
  });

  return true;
}

/**
 * Get the current reveal status for a user.
 */
export async function getReveals(userId: string): Promise<RevealStatus> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      revealTokens: true,
      revealWallet: true,
      revealGas: true,
      revealDashboard: true,
    },
  });

  return {
    tokensRevealed: user.revealTokens,
    walletRevealed: user.revealWallet,
    gasRevealed: user.revealGas,
    dashboardRevealed: user.revealDashboard,
  };
}
