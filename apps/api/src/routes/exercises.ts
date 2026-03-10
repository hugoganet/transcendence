import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { exerciseSubmissionSchema, missionIdParamSchema } from "@transcendence/shared";
import {
  submitExercise,
  getMissionExerciseStatus,
} from "../services/exerciseService.js";

export const exercisesRouter = Router();

// POST /api/v1/exercises/:exerciseId/submit — authenticated, submit exercise answer
exercisesRouter.post(
  "/:exerciseId/submit",
  requireAuth,
  validate({ body: exerciseSubmissionSchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const locale = user.locale ?? "en";
    const exerciseId = req.params.exerciseId as string;
    const data = await submitExercise(user.id, exerciseId, req.body, locale);
    res.json({ data });
  },
);

// GET /api/v1/exercises/missions/:missionId/status — authenticated, get mission exercise status
exercisesRouter.get(
  "/missions/:missionId/status",
  requireAuth,
  validate({ params: missionIdParamSchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const missionId = req.params.missionId as string;
    const data = await getMissionExerciseStatus(user.id, missionId);
    res.json({ data });
  },
);
