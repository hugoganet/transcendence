import { prisma } from "../config/database.js";
import type { LeaderboardEntry, LeaderboardCurrentUser } from "@transcendence/shared";

interface LeaderboardResult {
  entries: LeaderboardEntry[];
  currentUser: LeaderboardCurrentUser;
  total: number;
}

/**
 * Returns Monday 00:00:00 UTC of the week containing the given date.
 */
export function getWeekStart(now: Date = new Date()): Date {
  const d = new Date(now);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  const daysSinceMonday = (day + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function getLeaderboard(
  userId: string,
  page: number,
  pageSize: number,
): Promise<LeaderboardResult> {
  const weekStart = getWeekStart();

  // Wrap all reads in a transaction for snapshot consistency
  return prisma.$transaction(async (tx) => {
    // Step 1: Find userIds active this week
    const activeUserRows = await tx.userProgress.findMany({
      where: { status: "COMPLETED", completedAt: { gte: weekStart } },
      distinct: ["userId"],
      select: { userId: true },
    });
    const activeUserIds = activeUserRows.map((r) => r.userId);
    const activeSet = new Set(activeUserIds);

    // Step 2: Get user data + total mission counts for active users
    let rankedUsers: {
      id: string;
      displayName: string | null;
      avatarUrl: string | null;
      missionsCompleted: number;
      lastCompletedAt: Date | null;
    }[] = [];

    if (activeUserIds.length > 0) {
      const users = await tx.user.findMany({
        where: { id: { in: activeUserIds } },
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          _count: { select: { userProgress: { where: { status: "COMPLETED" } } } },
          userProgress: {
            where: { status: "COMPLETED" },
            orderBy: { completedAt: "desc" },
            take: 1,
            select: { completedAt: true },
          },
        },
      });

      rankedUsers = users.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        missionsCompleted: u._count.userProgress,
        lastCompletedAt: u.userProgress[0]?.completedAt ?? null,
      }));
    }

    // Step 3: Sort by missionsCompleted DESC, then lastCompletedAt ASC (earlier = higher)
    rankedUsers.sort((a, b) => {
      if (b.missionsCompleted !== a.missionsCompleted) {
        return b.missionsCompleted - a.missionsCompleted;
      }
      // Tiebreak: earlier lastCompletedAt = higher rank
      const aTime = a.lastCompletedAt?.getTime() ?? Infinity;
      const bTime = b.lastCompletedAt?.getTime() ?? Infinity;
      return aTime - bTime;
    });

    // Step 4: Assign dense ranks
    const total = rankedUsers.length;
    let denseRank = 1;
    const entries: LeaderboardEntry[] = rankedUsers.map((user, idx) => {
      if (idx > 0 && user.missionsCompleted !== rankedUsers[idx - 1].missionsCompleted) {
        denseRank++;
      }
      return {
        rank: denseRank,
        userId: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        missionsCompleted: user.missionsCompleted,
      };
    });

    // Step 5: Paginate
    const skip = (page - 1) * pageSize;
    const paginatedEntries = entries.slice(skip, skip + pageSize);

    // Step 6: Compute current user's data
    // Reuse data from ranked list when user is active (avoids redundant queries + fixes M2 consistency)
    const activeEntry = activeSet.has(userId)
      ? entries.find((e) => e.userId === userId)
      : undefined;

    let currentUserRank: number | null = null;
    let currentUserDisplayName: string | null;
    let currentUserAvatarUrl: string | null;
    let currentUserMissions: number;

    if (activeEntry) {
      currentUserRank = activeEntry.rank;
      currentUserDisplayName = activeEntry.displayName;
      currentUserAvatarUrl = activeEntry.avatarUrl;
      currentUserMissions = activeEntry.missionsCompleted;
    } else {
      // User not active this week — fetch their profile and total count
      const [userData, missionCount] = await Promise.all([
        tx.user.findUnique({
          where: { id: userId },
          select: { id: true, displayName: true, avatarUrl: true },
        }),
        tx.userProgress.count({
          where: { userId, status: "COMPLETED" },
        }),
      ]);
      currentUserDisplayName = userData?.displayName ?? null;
      currentUserAvatarUrl = userData?.avatarUrl ?? null;
      currentUserMissions = missionCount;
    }

    const currentUser: LeaderboardCurrentUser = {
      rank: currentUserRank,
      userId,
      displayName: currentUserDisplayName,
      avatarUrl: currentUserAvatarUrl,
      missionsCompleted: currentUserMissions,
    };

    return { entries: paginatedEntries, currentUser, total };
  });
}
