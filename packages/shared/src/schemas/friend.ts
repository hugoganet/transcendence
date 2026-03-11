import { z } from "zod";

export const friendUserIdParamSchema = z.object({
  userId: z.string().uuid(),
});

export const friendListEntrySchema = z.object({
  id: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  online: z.boolean(),
});

export const friendRequestEntrySchema = z.object({
  id: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
});

export const friendshipResponseSchema = z.object({
  id: z.string(),
  requesterId: z.string(),
  addresseeId: z.string(),
  status: z.enum(["PENDING", "ACCEPTED"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
