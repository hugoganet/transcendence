/**
 * @file Curriculum Routes — handles curriculum tree, mission details, completion, resume, and learning chain.
 * FR: Routes du curriculum — gere l'arbre, details des missions, completion, reprise et chaine d'apprentissage.
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

/** Curriculum router — all /api/v1/curriculum endpoints. / FR: Routeur du curriculum. */
export const curriculumRouter = Router();

/** GET / — return full curriculum tree with user progress. / FR: Retourne l'arbre complet du curriculum avec la progression. */
curriculumRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getCurriculumWithProgress(user.id);
    res.json({ data });
  },
);

/** GET /chain — return learning chain visualization. / FR: Retourne la visualisation de la chaine d'apprentissage. */
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

/** GET /missions/:missionId — return mission detail for user's locale. / FR: Retourne le detail de la mission selon la locale. */
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

/** POST /missions/:missionId/complete — mark mission completed, award tokens. / FR: Marque la mission terminee, attribue les tokens. */
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

/** GET /resume — return the next mission to work on. / FR: Retourne la prochaine mission a traiter. */
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
