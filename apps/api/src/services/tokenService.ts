import { prisma } from "../config/database.js";
import { MISSION_COMPLETION_TOKEN_REWARD } from "@transcendence/shared";
import type { TokenBalance } from "@transcendence/shared";

/** Minimal interface for a Prisma-like client (real or transaction). */
type DbClient = Pick<typeof prisma, "tokenTransaction" | "user">;

/**
 * Credit tokens for completing a mission using the provided DB client.
 * Idempotent — safe to call multiple times for the same mission.
 * When called within an existing interactive transaction, pass `tx` as the client
 * so the check-then-write is atomic with the surrounding operations.
 */
export async function creditMissionTokensWithClient(
  client: DbClient,
  userId: string,
  missionId: string,
  missionTitle: string,
): Promise<void> {
  // Check if tokens were already credited for this mission
  const existing = await client.tokenTransaction.findFirst({
    where: { userId, type: "EARN", missionId },
  });

  if (existing) return; // Already credited — idempotent

  // Create transaction record + atomically increment balance
  await client.tokenTransaction.create({
    data: {
      userId,
      amount: MISSION_COMPLETION_TOKEN_REWARD,
      type: "EARN",
      missionId,
      description: `Completed mission: ${missionTitle}`,
    },
  });
  await client.user.update({
    where: { id: userId },
    data: { tokenBalance: { increment: MISSION_COMPLETION_TOKEN_REWARD } },
  });
}

/**
 * Standalone version: wraps in its own interactive transaction
 * so the idempotency check + write are atomic.
 */
export async function creditMissionTokens(
  userId: string,
  missionId: string,
  missionTitle: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await creditMissionTokensWithClient(tx, userId, missionId, missionTitle);
  });
}

/**
 * Get token balance summary for a user.
 */
export async function getTokenBalance(userId: string): Promise<TokenBalance> {
  const [user, aggregates, lastEarnTx] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { tokenBalance: true },
    }),
    prisma.tokenTransaction.groupBy({
      by: ["type"],
      where: { userId },
      _sum: { amount: true },
    }),
    prisma.tokenTransaction.findFirst({
      where: { userId, type: "EARN" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const totalEarned =
    aggregates.find((a) => a.type === "EARN")?._sum.amount ?? 0;
  const totalSpentRaw =
    aggregates.find((a) => a.type === "GAS_SPEND")?._sum.amount ?? 0;
  // GAS_SPEND amounts are stored as negative, so negate for totalSpent
  const totalSpent = Math.abs(totalSpentRaw);

  return {
    tokenBalance: user.tokenBalance,
    totalEarned,
    totalSpent,
    lastEarned: lastEarnTx?.createdAt.toISOString() ?? null,
  };
}

/**
 * Get paginated token transaction history for a user.
 */
export async function getTokenHistory(
  userId: string,
  page: number,
  pageSize: number,
): Promise<{
  transactions: Array<{
    id: string;
    amount: number;
    type: string;
    missionId: string | null;
    exerciseId: string | null;
    description: string;
    createdAt: string;
  }>;
  total: number;
}> {
  const skip = (page - 1) * pageSize;

  const [transactions, total] = await Promise.all([
    prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        amount: true,
        type: true,
        missionId: true,
        exerciseId: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.tokenTransaction.count({ where: { userId } }),
  ]);

  return {
    transactions: transactions.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
    total,
  };
}
