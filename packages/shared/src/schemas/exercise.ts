import { z } from "zod";

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  isCorrect: z.boolean(),
  explanation: z.string().min(1),
});

export const siExerciseContentSchema = z.object({
  scenario: z.string().min(1),
  question: z.string().min(1),
  options: z.array(optionSchema).min(2),
  placeholder: z.boolean().optional(),
});

export const cmExerciseContentSchema = z.object({
  instruction: z.string().min(1),
  pairs: z.array(
    z.object({
      id: z.string().min(1),
      term: z.string().min(1),
      definition: z.string().min(1),
      analogy: z.string().optional(),
    }),
  ).min(2),
  placeholder: z.boolean().optional(),
});

export const ipExerciseContentSchema = z.object({
  instruction: z.string().min(1),
  items: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      correctPosition: z.number().int().min(0),
    }),
  ).min(2),
  zones: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
    }),
  ).optional(),
  placeholder: z.boolean().optional(),
});

export const stExerciseContentSchema = z.object({
  instruction: z.string().min(1),
  steps: z.array(
    z.object({
      id: z.string().min(1),
      prompt: z.string().min(1),
      options: z.array(optionSchema).min(2),
      microExplanation: z.string().min(1),
    }),
  ).min(1),
  placeholder: z.boolean().optional(),
});

export const exerciseContentSchema = z.union([
  siExerciseContentSchema,
  cmExerciseContentSchema,
  ipExerciseContentSchema,
  stExerciseContentSchema,
]);

// --- Exercise Submission Schemas (user input) ---

export const siSubmissionSchema = z.object({
  type: z.literal("SI"),
  submission: z.object({
    selectedOptionId: z.string().min(1),
  }),
});

export const cmSubmissionSchema = z.object({
  type: z.literal("CM"),
  submission: z.object({
    matches: z.array(
      z.object({
        termId: z.string().min(1),
        definitionId: z.string().min(1),
      }),
    ).min(1),
  }),
});

export const ipSubmissionSchema = z.object({
  type: z.literal("IP"),
  submission: z.object({
    positions: z.array(
      z.object({
        itemId: z.string().min(1),
        position: z.number().int().min(0),
      }),
    ).min(1),
  }),
});

export const stSubmissionSchema = z.object({
  type: z.literal("ST"),
  submission: z.object({
    stepAnswers: z.array(
      z.object({
        stepId: z.string().min(1),
        selectedOptionId: z.string().min(1),
      }),
    ).min(1),
  }),
});

export const exerciseSubmissionSchema = z.discriminatedUnion("type", [
  siSubmissionSchema,
  cmSubmissionSchema,
  ipSubmissionSchema,
  stSubmissionSchema,
]);

// --- Exercise Result Schema (API response) ---

export const exerciseFeedbackItemSchema = z.object({
  itemId: z.string(),
  correct: z.boolean(),
  explanation: z.string(),
  correctAnswer: z.string().nullable(),
});

export const exerciseResultSchema = z.object({
  correct: z.boolean(),
  score: z.number().int().min(0),
  totalPoints: z.number().int().min(1),
  feedback: z.array(exerciseFeedbackItemSchema),
  gasFee: z.number().int().optional(),
  tokenBalance: z.number().int().optional(),
});

// --- Mission Status Schema (GET /missions/:missionId/status response) ---

export const missionExerciseStatusSchema = z.object({
  missionId: z.string(),
  completable: z.boolean(),
  attempts: z.number().int().min(0),
  lastAttemptCorrect: z.boolean().nullable(),
});
