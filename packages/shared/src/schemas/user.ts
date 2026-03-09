import { z } from "zod";

export const updateProfileSchema = z
  .object({
    displayName: z
      .string()
      .min(1, "Display name cannot be empty")
      .max(50, "Display name must be under 50 characters")
      .trim()
      .optional(),
    bio: z
      .string()
      .max(300, "Bio must be under 300 characters")
      .trim()
      .optional(),
  })
  .refine((data) => data.displayName !== undefined || data.bio !== undefined, {
    message: "At least one field must be provided",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
