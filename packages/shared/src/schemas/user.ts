import { z } from "zod";

const ethereumWalletUpdate = z.union([
  z.null(),
  z
    .string()
    .trim()
    .max(42, "Wallet address is too long")
    .refine((s) => s.length === 0 || /^0x[a-fA-F0-9]{40}$/.test(s), {
      message: "Invalid Ethereum address",
    }),
]);

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
    locale: z.enum(["en", "fr", "es"]).optional(),
    ethereumWallet: ethereumWalletUpdate.optional(),
  })
  .refine(
    (data) =>
      data.displayName !== undefined ||
      data.bio !== undefined ||
      data.locale !== undefined ||
      data.ethereumWallet !== undefined,
    { message: "At least one field must be provided" },
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
