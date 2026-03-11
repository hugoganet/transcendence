import type { z } from "zod";
import type {
  friendListEntrySchema,
  friendRequestEntrySchema,
  friendshipResponseSchema,
} from "../schemas/friend.js";

export type FriendListEntry = z.infer<typeof friendListEntrySchema>;
export type FriendRequestEntry = z.infer<typeof friendRequestEntrySchema>;
export type FriendshipResponse = z.infer<typeof friendshipResponseSchema>;
