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

// GET /api/v1/curriculum — authenticated, returns full curriculum with progress overlay
curriculumRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getCurriculumWithProgress(user.id);
    res.json({ data });
  },
);

// GET /api/v1/curriculum/chain — authenticated, returns learning chain visualization
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

// GET /api/v1/curriculum/missions/:missionId — authenticated, returns mission detail
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

// POST /api/v1/curriculum/missions/:missionId/complete — authenticated, marks mission completed
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

// GET /api/v1/curriculum/resume — authenticated, returns resume point
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
