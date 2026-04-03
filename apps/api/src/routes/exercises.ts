/**
 * @file Exercise Routes — handles exercise submission and mission exercise status.
 * FR: Routes d'exercices — gere la soumission des exercices et le statut par mission.
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { exerciseSubmissionSchema, missionIdParamSchema } from "@transcendence/shared";
import {
  submitExercise,
  getMissionExerciseStatus,
} from "../services/exerciseService.js";

/** Exercises router — all /api/v1/exercises endpoints. / FR: Routeur d'exercices. */
export const exercisesRouter = Router();

/** POST /:exerciseId/submit — validate answer, record attempt, deduct gas fee. / FR: Valide la reponse, enregistre la tentative, deduit les frais de gas. */
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

/** GET /missions/:missionId/status — return attempt count and completability. / FR: Retourne le nombre de tentatives et si la mission est completable. */
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
