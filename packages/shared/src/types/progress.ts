import type { z } from "zod";
import type {
  missionStatusSchema,
  chapterStatusSchema,
  categoryStatusSchema,
  completeMissionBodySchema,
} from "../schemas/progress.js";

export type MissionStatusValue = z.infer<typeof missionStatusSchema>;
export type ChapterStatusValue = z.infer<typeof chapterStatusSchema>;
export type CategoryStatusValue = z.infer<typeof categoryStatusSchema>;

export interface MissionProgressOverlay {
  missionId: string;
  status: MissionStatusValue;
  completedAt: string | null;
}

export interface ChapterProgressOverlay {
  chapterId: string;
  status: ChapterStatusValue;
  completedAt: string | null;
  missions: MissionProgressOverlay[];
}

export interface CategoryProgressOverlay {
  categoryId: string;
  status: CategoryStatusValue;
  chapters: ChapterProgressOverlay[];
}

export interface CurriculumWithProgress {
  categories: CategoryProgressOverlay[];
  completionPercentage: number;
  totalMissions: number;
  completedMissions: number;
}

export interface MissionDetailResponse {
  id: string;
  title: string;
  description: string;
  learningObjective: string;
  exerciseType: string;
  exerciseContent: unknown;
  estimatedMinutes: number;
  status: MissionStatusValue;
  progressiveReveal: { mechanic: string; description: string } | null;
  tooltipTerms?: string[];
}

export type CompleteMissionBody = z.infer<typeof completeMissionBodySchema>;

export interface CompleteMissionResponse {
  missionId: string;
  status: "completed";
  chapterCompleted: boolean;
  categoryCompleted: boolean;
  nextMissionId: string | null;
  completionPercentage: number;
  progressiveReveal: { mechanic: string; description: string } | null;
  newAchievements: Array<{ code: string; title: string; description: string }>;
}

export interface ResumeResponse {
  missionId: string;
  missionTitle: string;
  chapterId: string;
  chapterTitle: string;
  categoryId: string;
  completionPercentage: number;
}

export interface ChainBlock {
  index: number;
  missionId: string;
  missionTitle: string;
  categoryId: string;
  categoryName: string;
  completedAt: string;
  previousMissionId: string | null;
}

export interface LearningChainResponse {
  blocks: ChainBlock[];
  totalBlocks: number;
  categoriesReached: number;
  latestBlockAt: string | null;
}
