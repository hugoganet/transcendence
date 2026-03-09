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
