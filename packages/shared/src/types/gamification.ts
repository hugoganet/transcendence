import type { z } from "zod";
import type { streakSchema } from "../schemas/gamification.js";

export type StreakStatus = z.infer<typeof streakSchema>;
