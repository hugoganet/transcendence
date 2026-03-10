import type { z } from "zod";
import type {
  exerciseTypeSchema,
  progressiveRevealSchema,
  missionSchema,
  chapterSchema,
  categorySchema,
  curriculumStructureSchema,
} from "../schemas/curriculum.js";
import type {
  siExerciseContentSchema,
  cmExerciseContentSchema,
  ipExerciseContentSchema,
  stExerciseContentSchema,
  exerciseContentSchema,
  exerciseSubmissionSchema,
  siSubmissionSchema,
  cmSubmissionSchema,
  ipSubmissionSchema,
  stSubmissionSchema,
  exerciseResultSchema,
  exerciseFeedbackItemSchema,
  missionExerciseStatusSchema,
} from "../schemas/exercise.js";
import type { tooltipSchema, tooltipCollectionSchema } from "../schemas/tooltip.js";

export type ExerciseType = z.infer<typeof exerciseTypeSchema>;
export type ProgressiveReveal = z.infer<typeof progressiveRevealSchema>;
export type Mission = z.infer<typeof missionSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type Category = z.infer<typeof categorySchema>;
export type CurriculumStructure = z.infer<typeof curriculumStructureSchema>;

export type SIExerciseContent = z.infer<typeof siExerciseContentSchema>;
export type CMExerciseContent = z.infer<typeof cmExerciseContentSchema>;
export type IPExerciseContent = z.infer<typeof ipExerciseContentSchema>;
export type STExerciseContent = z.infer<typeof stExerciseContentSchema>;
export type ExerciseContent = z.infer<typeof exerciseContentSchema>;

export type Tooltip = z.infer<typeof tooltipSchema>;
export type TooltipCollection = z.infer<typeof tooltipCollectionSchema>;

export type TooltipResponse = Tooltip;

export interface GlossaryResponse {
  terms: TooltipResponse[];
}

export type ExerciseSubmission = z.infer<typeof exerciseSubmissionSchema>;
export type SISubmission = z.infer<typeof siSubmissionSchema>;
export type CMSubmission = z.infer<typeof cmSubmissionSchema>;
export type IPSubmission = z.infer<typeof ipSubmissionSchema>;
export type STSubmission = z.infer<typeof stSubmissionSchema>;
export type ExerciseResult = z.infer<typeof exerciseResultSchema>;
export type ExerciseFeedbackItem = z.infer<typeof exerciseFeedbackItemSchema>;
export type MissionExerciseStatus = z.infer<typeof missionExerciseStatusSchema>;

export interface MissionContent {
  title: string;
  description: string;
  learningObjective: string;
  exerciseContent: ExerciseContent;
}

export type MissionContentCollection = Record<string, MissionContent>;

export interface UIStrings {
  categories: Record<string, string>;
  chapters: Record<string, string>;
  exerciseTypes: Record<string, string>;
  labels: Record<string, string>;
}
