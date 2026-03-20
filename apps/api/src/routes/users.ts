import { Router, type Request, type Response } from "express";
import express from "express";
import multer, { MulterError } from "multer";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema, userIdParamSchema } from "@transcendence/shared";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
} from "../services/userService.js";
import { getReveals } from "../services/revealService.js";
import { getPublicProfile } from "../services/publicProfileService.js";
import { getCertificate, getShareableUrl } from "../services/certificateService.js";
import { AppError } from "../utils/AppError.js";

const AVATAR_UPLOAD_DIR =
  process.env.AVATAR_UPLOAD_DIR ?? "./uploads/avatars";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          400,
          "INVALID_FILE_TYPE",
          "Only JPEG, PNG, and WebP images are accepted",
        ),
      );
    }
  },
});

export const usersRouter = Router();

// Serve avatar files as static assets
usersRouter.use("/avatars", express.static(AVATAR_UPLOAD_DIR));

// GET /api/v1/users/me — return authenticated user profile
usersRouter.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response) => {
    const profile = await getProfile((req.user as Express.User).id);
    res.json({ data: profile });
  },
);

// PATCH /api/v1/users/me — update profile fields
usersRouter.patch(
  "/me",
  requireAuth,
  validate({ body: updateProfileSchema }),
  async (req: Request, res: Response) => {
    const profile = await updateProfile(
      (req.user as Express.User).id,
      req.body,
    );
    res.json({ data: profile });
  },
);

// GET /api/v1/users/me/reveals — return progressive reveal status
usersRouter.get(
  "/me/reveals",
  requireAuth,
  async (req: Request, res: Response) => {
    const revealStatus = await getReveals((req.user as Express.User).id);
    res.json({ data: revealStatus });
  },
);

// POST /api/v1/users/me/avatar — upload avatar image
usersRouter.post(
  "/me/avatar",
  requireAuth,
  (req: Request, res: Response, next) => {
    avatarUpload.single("avatar")(req, res, (err) => {
      if (err instanceof MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            new AppError(400, "FILE_TOO_LARGE", "Avatar must be under 2MB"),
          );
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return next(
            new AppError(400, "INVALID_FILE", "Only one file allowed"),
          );
        }
        return next(
          new AppError(400, "INVALID_FILE", err.message),
        );
      }
      if (err) {
        return next(err);
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError(400, "NO_FILE", "No avatar file provided");
    }
    const profile = await uploadAvatar(
      (req.user as Express.User).id,
      req.file,
    );
    res.json({ data: profile });
  },
);

// GET /api/v1/users/me/certificate — return authenticated user's certificate
usersRouter.get(
  "/me/certificate",
  requireAuth,
  async (req: Request, res: Response) => {
    const certificate = await getCertificate((req.user as Express.User).id);
    res.json({ data: certificate });
  },
);

// GET /api/v1/users/me/certificate/share — return shareable certificate URL
usersRouter.get(
  "/me/certificate/share",
  requireAuth,
  async (req: Request, res: Response) => {
    const result = await getShareableUrl((req.user as Express.User).id);
    res.json({ data: result });
  },
);

// GET /api/v1/users/:userId/profile — return public profile
usersRouter.get(
  "/:userId/profile",
  requireAuth,
  validate({ params: userIdParamSchema }),
  async (req: Request, res: Response) => {
    const profile = await getPublicProfile(String(req.params.userId));
    res.json({ data: profile });
  },
);
