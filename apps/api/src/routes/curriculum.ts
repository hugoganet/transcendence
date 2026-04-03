/**
 * @module routes/curriculum
 * @description Curriculum routes: full curriculum with progress overlay,
 * mission details, mission completion, resume point, and learning chain.
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { missionIdParamSchema, completeMissionBodySchema } from "@transcendence/shared";
import {
  getCurriculumWithProgress,
  getMissionDetail,
  completeMission,
  getResumePoint,
  getLearningChain,
} from "../services/curriculumService.js";

export const curriculumRouter = Router();

/** GET /api/v1/curriculum — Returns full curriculum tree with user's progress overlay. */
curriculumRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getCurriculumWithProgress(user.id);
    res.json({ data });
  },
);

/** GET /api/v1/curriculum/chain — Returns learning chain visualization (node map). */
curriculumRouter.get(
  "/chain",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const locale = user.locale ?? "en";
    const data = await getLearningChain(user.id, locale);
    res.json({ data });
  },
);

/** GET /api/v1/curriculum/missions/:missionId — Returns mission content + exercise for the user's locale. */
curriculumRouter.get(
  "/missions/:missionId",
  requireAuth,
  validate({ params: missionIdParamSchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const locale = user.locale ?? "en";
    const missionId = req.params.missionId as string;
    const data = await getMissionDetail(user.id, missionId, locale);
    res.json({ data });
  },
);

/** POST /api/v1/curriculum/missions/:missionId/complete — Marks mission as completed, awards tokens, checks achievements. */
curriculumRouter.post(
  "/missions/:missionId/complete",
  requireAuth,
  validate({ params: missionIdParamSchema, body: completeMissionBodySchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const missionId = req.params.missionId as string;
    const { confidenceRating } = req.body;
    const data = await completeMission(user.id, missionId, confidenceRating);
    res.json({ data });
  },
);

/** GET /api/v1/curriculum/resume — Returns the next mission the user should work on. */
curriculumRouter.get(
  "/resume",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const locale = user.locale ?? "en";
    const data = await getResumePoint(user.id, locale);
    res.json({ data });
  },
);
