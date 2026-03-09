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
} from "@transcendence/shared";
import type { Category, Chapter, Mission } from "@transcendence/shared";

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
