import { prisma } from "../config/database.js";
import { getContent } from "../utils/contentLoader.js";
import { AppError } from "../utils/AppError.js";
import type {
  CurriculumWithProgress,
  MissionDetailResponse,
  MissionStatusValue,
  ChapterStatusValue,
  CategoryStatusValue,
  CategoryProgressOverlay,
  ChapterProgressOverlay,
  MissionProgressOverlay,
  CompleteMissionResponse,
  ResumeResponse,
  ChainBlock,
  LearningChainResponse,
} from "@transcendence/shared";
import type { Category, Chapter, Mission } from "@transcendence/shared";
import { creditMissionTokensWithClient } from "./tokenService.js";
import { updateStreakWithClient } from "./streakService.js";
import { checkAndAwardAchievementsWithClient, type AwardedAchievement } from "./achievementService.js";
import { triggerRevealWithClient } from "./revealService.js";

export async function getCurriculumWithProgress(
  userId: string,
): Promise<CurriculumWithProgress> {
  const content = getContent();
  const curriculum = content.curriculum;

  // Batch-fetch all progress rows (2 queries, no N+1)
  const [userProgressRows, chapterProgressRows] = await Promise.all([
    prisma.userProgress.findMany({ where: { userId } }),
    prisma.chapterProgress.findMany({ where: { userId } }),
  ]);

  // Index by ID for O(1) lookup
  const missionProgressMap = new Map(
    userProgressRows.map((row) => [row.missionId, row]),
  );
  const chapterProgressMap = new Map(
    chapterProgressRows.map((row) => [row.chapterId, row]),
  );

  let completedMissions = 0;
  let totalMissions = 0;
  const categories: CategoryProgressOverlay[] = [];
  let prevCategoryLastChapterCompleted = true; // Category 1 is always available

  for (const category of curriculum) {
    const categoryAvailable = prevCategoryLastChapterCompleted;
    const chapters: ChapterProgressOverlay[] = [];
    let prevChapterCompleted = true; // First chapter in available category is available
    let categoryHasAnyCompleted = false;
    let categoryAllChaptersCompleted = true;

    for (let ci = 0; ci < category.chapters.length; ci++) {
      const chapter = category.chapters[ci];
      const chapterAvailable =
        categoryAvailable && (ci === 0 ? true : prevChapterCompleted);

      const missions: MissionProgressOverlay[] = [];
      let prevMissionCompleted = true;
      let chapterCompletedCount = 0;

      for (let mi = 0; mi < chapter.missions.length; mi++) {
        const mission = chapter.missions[mi];
        totalMissions++;

        const progressRow = missionProgressMap.get(mission.id);
        let status: MissionStatusValue;

        if (progressRow?.status === "COMPLETED") {
          status = "completed";
          completedMissions++;
          chapterCompletedCount++;
          prevMissionCompleted = true;
        } else if (progressRow?.status === "IN_PROGRESS") {
          status = "inProgress";
          prevMissionCompleted = false;
        } else {
          // No progress row — compute from position
          const isAvailable =
            chapterAvailable && (mi === 0 ? true : prevMissionCompleted);
          status = isAvailable ? "available" : "locked";
          prevMissionCompleted = false;
        }

        missions.push({
          missionId: mission.id,
          status,
          completedAt: progressRow?.completedAt?.toISOString() ?? null,
        });
      }

      // Determine chapter status
      const chapterRow = chapterProgressMap.get(chapter.id);
      let chapterStatus: ChapterStatusValue;
      const allMissionsCompleted =
        chapterCompletedCount === chapter.missions.length;

      if (chapterRow?.status === "COMPLETED" || allMissionsCompleted) {
        chapterStatus = "completed";
        prevChapterCompleted = true;
        categoryHasAnyCompleted = true;
      } else if (!chapterAvailable) {
        chapterStatus = "locked";
        prevChapterCompleted = false;
        categoryAllChaptersCompleted = false;
      } else if (chapterCompletedCount > 0) {
        chapterStatus = "inProgress";
        prevChapterCompleted = false;
        categoryAllChaptersCompleted = false;
        categoryHasAnyCompleted = true;
      } else {
        chapterStatus = "available";
        prevChapterCompleted = false;
        categoryAllChaptersCompleted = false;
      }

      chapters.push({
        chapterId: chapter.id,
        status: chapterStatus,
        completedAt: chapterRow?.completedAt?.toISOString() ?? null,
        missions,
      });
    }

    // Determine category status
    let categoryStatus: CategoryStatusValue;
    if (!categoryAvailable) {
      categoryStatus = "locked";
    } else if (categoryAllChaptersCompleted && categoryHasAnyCompleted) {
      categoryStatus = "completed";
    } else if (categoryHasAnyCompleted) {
      categoryStatus = "inProgress";
    } else {
      categoryStatus = "available";
    }

    // For next category: check if this category's last chapter is completed
    const lastChapter = chapters[chapters.length - 1];
    prevCategoryLastChapterCompleted = lastChapter?.status === "completed";

    categories.push({
      categoryId: category.id,
      status: categoryStatus,
      chapters,
    });
  }

  const completionPercentage =
    totalMissions > 0
      ? Math.round((completedMissions / totalMissions) * 1000) / 10
      : 0;

  return {
    categories,
    completionPercentage,
    totalMissions,
    completedMissions,
  };
}

/**
 * Determines a single mission's access status with targeted DB queries
 * instead of computing the full curriculum overlay.
 * At most 2 small queries: 1 for direct progress + 1 for prerequisite check.
 */
export async function getMissionAccessStatus(
  userId: string,
  missionId: string,
): Promise<MissionStatusValue> {
  const content = getContent();
  const curriculum = content.curriculum;

  // Check if user has direct progress on this mission
  const directProgress = await prisma.userProgress.findUnique({
    where: { userId_missionId: { userId, missionId } },
  });

  if (directProgress?.status === "COMPLETED") return "completed";
  if (directProgress?.status === "IN_PROGRESS") return "inProgress";

  // No progress row — determine accessibility from curriculum position
  let catIdx = -1,
    chapIdx = -1,
    missIdx = -1;
  for (let ci = 0; ci < curriculum.length; ci++) {
    for (let chi = 0; chi < curriculum[ci].chapters.length; chi++) {
      const mi = curriculum[ci].chapters[chi].missions.findIndex(
        (m) => m.id === missionId,
      );
      if (mi !== -1) {
        catIdx = ci;
        chapIdx = chi;
        missIdx = mi;
        break;
      }
    }
    if (catIdx !== -1) break;
  }

  if (catIdx === -1) return "locked";

  // First mission of first chapter of first category — always available
  if (catIdx === 0 && chapIdx === 0 && missIdx === 0) return "available";

  // Not first mission in chapter — check if previous mission is completed
  if (missIdx > 0) {
    const prevMissionId =
      curriculum[catIdx].chapters[chapIdx].missions[missIdx - 1].id;
    const prevProgress = await prisma.userProgress.findUnique({
      where: { userId_missionId: { userId, missionId: prevMissionId } },
    });
    return prevProgress?.status === "COMPLETED" ? "available" : "locked";
  }

  // First mission in non-first chapter — check if previous chapter's missions are all completed
  if (chapIdx > 0) {
    const prevChapter = curriculum[catIdx].chapters[chapIdx - 1];
    const completedCount = await prisma.userProgress.count({
      where: {
        userId,
        missionId: { in: prevChapter.missions.map((m) => m.id) },
        status: "COMPLETED",
      },
    });
    return completedCount === prevChapter.missions.length
      ? "available"
      : "locked";
  }

  // First mission of first chapter of non-first category
  const prevCategory = curriculum[catIdx - 1];
  const lastChapter = prevCategory.chapters[prevCategory.chapters.length - 1];
  const completedCount = await prisma.userProgress.count({
    where: {
      userId,
      missionId: { in: lastChapter.missions.map((m) => m.id) },
      status: "COMPLETED",
    },
  });
  return completedCount === lastChapter.missions.length
    ? "available"
    : "locked";
}

export async function getMissionDetail(
  userId: string,
  missionId: string,
  locale: string,
): Promise<MissionDetailResponse> {
  const content = getContent();
  const curriculum = content.curriculum;

  // Find mission in curriculum structure
  let foundMission: Mission | undefined;

  for (const category of curriculum) {
    for (const chapter of category.chapters) {
      for (const mission of chapter.missions) {
        if (mission.id === missionId) {
          foundMission = mission;
          break;
        }
      }
      if (foundMission) break;
    }
    if (foundMission) break;
  }

  if (!foundMission) {
    throw new AppError(404, "MISSION_NOT_FOUND", `Mission ${missionId} not found`);
  }

  // Targeted access check — 1-2 small queries instead of full curriculum overlay
  const missionStatus = await getMissionAccessStatus(userId, missionId);

  if (missionStatus === "locked") {
    throw new AppError(403, "MISSION_LOCKED", `Mission ${missionId} is locked`);
  }

  // Load mission content, fallback to "en"
  let missionsContent = content.missions.get(locale);
  if (!missionsContent) {
    missionsContent = content.missions.get("en");
  }
  if (!missionsContent) {
    throw new AppError(500, "CONTENT_UNAVAILABLE", "Mission content not available");
  }

  const missionContent = missionsContent[missionId];
  if (!missionContent) {
    throw new AppError(500, "CONTENT_UNAVAILABLE", `Content for mission ${missionId} not available`);
  }

  return {
    id: foundMission.id,
    title: missionContent.title,
    description: missionContent.description,
    learningObjective: missionContent.learningObjective,
    exerciseType: foundMission.exerciseType,
    exerciseContent: missionContent.exerciseContent,
    estimatedMinutes: foundMission.estimatedMinutes,
    status: missionStatus,
    progressiveReveal: foundMission.progressiveReveal,
  };
}

/**
 * Finds a mission in the curriculum structure by ID.
 * Returns the mission object and its position (catIdx, chapIdx, missIdx).
 */
function findMissionInCurriculum(
  curriculum: Category[],
  missionId: string,
): { mission: Mission; catIdx: number; chapIdx: number; missIdx: number } | null {
  for (let catIdx = 0; catIdx < curriculum.length; catIdx++) {
    for (let chapIdx = 0; chapIdx < curriculum[catIdx].chapters.length; chapIdx++) {
      const missIdx = curriculum[catIdx].chapters[chapIdx].missions.findIndex(
        (m) => m.id === missionId,
      );
      if (missIdx !== -1) {
        return {
          mission: curriculum[catIdx].chapters[chapIdx].missions[missIdx],
          catIdx,
          chapIdx,
          missIdx,
        };
      }
    }
  }
  return null;
}

/**
 * Returns the next mission ID in the sequential curriculum order.
 * Within chapter → next mission by order.
 * End of chapter → first mission of next chapter in same category.
 * End of category → first mission of next category.
 * End of curriculum → null.
 */
export function getNextMissionId(
  curriculum: Category[],
  currentMissionId: string,
): string | null {
  const found = findMissionInCurriculum(curriculum, currentMissionId);
  if (!found) return null;

  const { catIdx, chapIdx, missIdx } = found;
  const chapter = curriculum[catIdx].chapters[chapIdx];

  // Next mission in same chapter
  if (missIdx + 1 < chapter.missions.length) {
    return chapter.missions[missIdx + 1].id;
  }

  // Next chapter in same category
  if (chapIdx + 1 < curriculum[catIdx].chapters.length) {
    return curriculum[catIdx].chapters[chapIdx + 1].missions[0].id;
  }

  // Next category
  if (catIdx + 1 < curriculum.length) {
    return curriculum[catIdx + 1].chapters[0].missions[0].id;
  }

  // End of curriculum
  return null;
}

export async function completeMission(
  userId: string,
  missionId: string,
  confidenceRating?: number,
): Promise<CompleteMissionResponse> {
  const content = getContent();
  const curriculum = content.curriculum;

  // 1. Find mission in curriculum structure
  const found = findMissionInCurriculum(curriculum, missionId);
  if (!found) {
    throw new AppError(404, "MISSION_NOT_FOUND", `Mission ${missionId} not found`);
  }

  const { mission, catIdx, chapIdx } = found;
  const chapter = curriculum[catIdx].chapters[chapIdx];
  const category = curriculum[catIdx];

  // 2. Check access status
  const accessStatus = await getMissionAccessStatus(userId, missionId);
  if (accessStatus === "locked") {
    throw new AppError(403, "MISSION_LOCKED", `Mission ${missionId} is locked`);
  }
  if (accessStatus === "completed") {
    throw new AppError(409, "MISSION_ALREADY_COMPLETED", `Mission ${missionId} is already completed`);
  }

  // 3. Determine if this is a self-assessment mission (last mission of the category)
  const lastChapter = category.chapters[category.chapters.length - 1];
  const lastMission = lastChapter.missions[lastChapter.missions.length - 1];
  const isSelfAssessmentMission = mission.id === lastMission.id;

  // 4. Transaction: upsert progress + check chapter/category completion + credit tokens atomically
  const chapterMissionIds = chapter.missions.map((m) => m.id);
  const missionTitle = content.missions.get("en")?.[missionId]?.title ?? missionId;

  const txResult = await prisma.$transaction(async (tx) => {
    // a. Upsert UserProgress
    await tx.userProgress.upsert({
      where: { userId_missionId: { userId, missionId } },
      update: { status: "COMPLETED", completedAt: new Date() },
      create: { userId, missionId, status: "COMPLETED", completedAt: new Date() },
    });

    // b. Check if all missions in the chapter are now completed
    const completedInChapter = await tx.userProgress.count({
      where: {
        userId,
        missionId: { in: chapterMissionIds },
        status: "COMPLETED",
      },
    });
    const chapterJustCompleted = completedInChapter === chapterMissionIds.length;

    if (chapterJustCompleted) {
      await tx.chapterProgress.upsert({
        where: { userId_chapterId: { userId, chapterId: chapter.id } },
        update: { status: "COMPLETED", completedAt: new Date() },
        create: { userId, chapterId: chapter.id, status: "COMPLETED", completedAt: new Date() },
      });
    }

    // c. If confidenceRating provided AND this is a self-assessment mission, store it
    if (confidenceRating !== undefined && isSelfAssessmentMission) {
      await tx.selfAssessment.upsert({
        where: { userId_categoryId: { userId, categoryId: category.id } },
        update: { confidenceRating },
        create: { userId, categoryId: category.id, confidenceRating },
      });
    }

    // d. Count total completed missions (inside transaction for consistency)
    const totalCompleted = await tx.userProgress.count({
      where: { userId, status: "COMPLETED" },
    });

    // e. Check category completion if chapter just completed
    let categoryCompleted = false;
    if (chapterJustCompleted) {
      const completedChapters = await tx.chapterProgress.findMany({
        where: {
          userId,
          chapterId: { in: category.chapters.map((ch) => ch.id) },
          status: "COMPLETED",
        },
      });
      categoryCompleted = completedChapters.length === category.chapters.length;
    }

    // f. Credit tokens for mission completion (inside transaction — atomic with progress update)
    await creditMissionTokensWithClient(tx, userId, missionId, missionTitle);

    // g. Update streak (inside transaction — atomic with progress + tokens)
    await updateStreakWithClient(tx, userId);

    // h. Check and award achievements (inside transaction — atomic with all above)
    const updatedUser = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { tokenBalance: true, currentStreak: true },
    });

    const categoryIndex = categoryCompleted ? catIdx + 1 : undefined;
    const newAchievements = await checkAndAwardAchievementsWithClient(tx, userId, {
      categoryCompleted: categoryIndex,
      tokenBalance: updatedUser.tokenBalance,
      currentStreak: updatedUser.currentStreak,
    });

    // i. Trigger progressive reveal if this mission has one (atomic with all above)
    let revealTriggered = false;
    if (mission.progressiveReveal) {
      revealTriggered = await triggerRevealWithClient(tx, userId, mission.progressiveReveal.mechanic);
    }

    return { chapterJustCompleted, categoryCompleted, totalCompleted, newAchievements, revealTriggered };
  });

  // 6. Compute response fields (pure computation, no DB queries)
  const nextMissionId = getNextMissionId(curriculum, missionId);

  const totalMissions = curriculum.reduce(
    (sum, cat) =>
      sum + cat.chapters.reduce((s, ch) => s + ch.missions.length, 0),
    0,
  );

  const completionPercentage =
    totalMissions > 0
      ? Math.round((txResult.totalCompleted / totalMissions) * 1000) / 10
      : 0;

  return {
    missionId,
    status: "completed",
    chapterCompleted: txResult.chapterJustCompleted,
    categoryCompleted: txResult.categoryCompleted,
    nextMissionId,
    completionPercentage,
    progressiveReveal: mission.progressiveReveal,
    revealTriggered: txResult.revealTriggered,
    newAchievements: txResult.newAchievements,
  };
}

export async function getLearningChain(
  userId: string,
  locale: string,
): Promise<LearningChainResponse> {
  const completedMissions = await prisma.userProgress.findMany({
    where: { userId, status: "COMPLETED" },
    orderBy: { completedAt: "asc" },
    select: { missionId: true, completedAt: true },
  });

  if (completedMissions.length === 0) {
    return { blocks: [], totalBlocks: 0, categoriesReached: 0, latestBlockAt: null };
  }

  const content = getContent();
  let missions = content.missions.get(locale);
  if (!missions) {
    missions = content.missions.get("en");
  }
  if (!missions) {
    throw new AppError(500, "CONTENT_UNAVAILABLE", "Mission content not available");
  }

  const structure = content.curriculum;
  const uiStrings = content.uiStrings.get(locale) ?? content.uiStrings.get("en");
  const categorySet = new Set<string>();

  const blocks: ChainBlock[] = completedMissions.map((progress, index) => {
    const categoryId = progress.missionId.split(".")[0];
    categorySet.add(categoryId);
    const category = structure.find((c) => c.id === categoryId);
    const missionContent = missions[progress.missionId];
    const categoryName = (category && uiStrings?.categories[category.name])
      ?? category?.name
      ?? `Category ${categoryId}`;

    return {
      index,
      missionId: progress.missionId,
      missionTitle: missionContent?.title ?? `Mission ${progress.missionId}`,
      categoryId,
      categoryName,
      completedAt: progress.completedAt?.toISOString() ?? new Date().toISOString(),
      previousMissionId: index > 0 ? completedMissions[index - 1].missionId : null,
    };
  });

  return {
    blocks,
    totalBlocks: blocks.length,
    categoriesReached: categorySet.size,
    latestBlockAt: blocks[blocks.length - 1].completedAt,
  };
}

export async function getResumePoint(
  userId: string,
  locale: string,
): Promise<ResumeResponse | null> {
  const content = getContent();
  const curriculum = content.curriculum;

  // Find last completed mission
  const lastCompleted = await prisma.userProgress.findFirst({
    where: { userId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });

  let resumeMissionId: string;

  if (!lastCompleted) {
    // New user → first mission
    resumeMissionId = curriculum[0].chapters[0].missions[0].id;
  } else {
    const nextId = getNextMissionId(curriculum, lastCompleted.missionId);
    if (!nextId) {
      // Curriculum complete
      return null;
    }
    resumeMissionId = nextId;
  }

  // Find the mission and its context in curriculum structure
  const found = findMissionInCurriculum(curriculum, resumeMissionId);
  if (!found) return null;

  const { catIdx, chapIdx } = found;
  const chapter = curriculum[catIdx].chapters[chapIdx];
  const category = curriculum[catIdx];

  // Get titles from content cache (locale-aware with fallback)
  let missionsContent = content.missions.get(locale);
  if (!missionsContent) {
    missionsContent = content.missions.get("en");
  }

  const missionTitle = missionsContent?.[resumeMissionId]?.title ?? resumeMissionId;
  const chapterTitle = chapter.name;

  // Compute completion percentage
  const totalCompleted = await prisma.userProgress.count({
    where: { userId, status: "COMPLETED" },
  });

  const totalMissions = curriculum.reduce(
    (sum, cat) =>
      sum + cat.chapters.reduce((s, ch) => s + ch.missions.length, 0),
    0,
  );

  const completionPercentage =
    totalMissions > 0
      ? Math.round((totalCompleted / totalMissions) * 1000) / 10
      : 0;

  return {
    missionId: resumeMissionId,
    missionTitle,
    chapterId: chapter.id,
    chapterTitle,
    categoryId: category.id,
    completionPercentage,
  };
}
