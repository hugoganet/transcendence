/**
 * @module passport
 * @description Passport.js authentication configuration.
 *
 * Registers three authentication strategies:
 * - **Local** — email + password login with bcrypt verification.
 * - **Google** — OAuth 2.0 via Google (conditional on env vars).
 * - **Facebook** — OAuth 2.0 via Facebook (conditional on env vars).
 *
 * Also configures session serialization/deserialization so that only
 * the user ID is stored in Redis, and the full user object is reloaded
 * from PostgreSQL on each request.
 */

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import bcrypt from "bcryptjs";
import { prisma } from "./database.js";
import { findOrCreateOAuthUser } from "../services/authService.js";

/**
 * Tracks which OAuth strategies are configured (env vars present).
 * Used by auth routes to conditionally expose OAuth endpoints.
 * @type {Set<string>}
 */
export const configuredStrategies = new Set<string>();

/**
 * Augments the Express.User interface so that `req.user` is fully typed
 * across all route handlers and middlewares.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      id: string;
      email: string | null;
      passwordHash: string | null;
      authProvider: string;
      displayName: string | null;
      bio: string | null;
      avatarUrl: string | null;
      ethereumWallet: string | null;
      locale: string;
      ageConfirmed: boolean;
      twoFactorEnabled: boolean;
      twoFactorSecret: string | null;
      disclaimerAcceptedAt: Date | null;
      tokenBalance: number;
      currentStreak: number;
      longestStreak: number;
      lastMissionCompletedAt: Date | null;
      revealTokens: boolean;
      revealWallet: boolean;
      revealGas: boolean;
      revealDashboard: boolean;
      notificationPreferences: unknown;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

/**
 * Local strategy — authenticates users with email + password.
 *
 * Flow:
 * 1. Looks up the user by email in PostgreSQL via Prisma.
 * 2. If user not found or has no passwordHash (OAuth-only account), rejects.
 * 3. Compares the provided password against the stored bcrypt hash.
 * 4. If valid, returns the user object to Passport (triggers serializeUser).
 *
 * @param {string} email - The email submitted in the login form.
 * @param {string} password - The plain-text password to verify against the hash.
 * @param {Function} done - Passport callback: done(error, user|false).
 */
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        if (!email) return done(null, false);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
          return done(null, false);
        }
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

/**
 * Google OAuth 2.0 strategy — registered only if GOOGLE_CLIENT_ID and
 * GOOGLE_CLIENT_SECRET environment variables are set.
 *
 * Flow:
 * 1. User is redirected to Google's consent screen.
 * 2. Google redirects back to our callback URL with an authorization code.
 * 3. Passport exchanges the code for access/refresh tokens.
 * 4. {@link findOrCreateOAuthUser} finds or creates the user in our DB.
 *
 * @see {@link findOrCreateOAuthUser} for account linking logic.
 */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  configuredStrategies.add("google");
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.OAUTH_CALLBACK_BASE_URL ?? "http://localhost:3000"}/api/v1/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? null;
          const user = await findOrCreateOAuthUser(
            "GOOGLE",
            {
              providerAccountId: profile.id,
              email,
              displayName: profile.displayName ?? null,
              avatarUrl: profile.photos?.[0]?.value ?? null,
            },
            {
              accessToken: _accessToken,
              refreshToken: _refreshToken,
            },
          );
          return done(null, user as Express.User);
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );
}

/**
 * Facebook OAuth 2.0 strategy — registered only if FACEBOOK_APP_ID and
 * FACEBOOK_APP_SECRET environment variables are set.
 *
 * Flow is identical to Google OAuth. Uses `enableProof: true` for
 * additional security (Facebook verifies the app secret hash).
 *
 * @see {@link findOrCreateOAuthUser} for account linking logic.
 */
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  configuredStrategies.add("facebook");
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.OAUTH_CALLBACK_BASE_URL ?? "http://localhost:3000"}/api/v1/auth/facebook/callback`,
        profileFields: ["id", "displayName", "photos", "email"],
        enableProof: true,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? null;
          const user = await findOrCreateOAuthUser(
            "FACEBOOK",
            {
              providerAccountId: profile.id,
              email,
              displayName: profile.displayName ?? null,
              avatarUrl: profile.photos?.[0]?.value ?? null,
            },
            {
              accessToken: _accessToken,
              refreshToken: _refreshToken,
            },
          );
          return done(null, user as Express.User);
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );
}

/**
 * Serializes the user for session storage.
 *
 * Only the user ID is stored in Redis (via express-session + connect-redis).
 * This keeps session data small and ensures that user changes (name, avatar,
 * etc.) are reflected immediately without session invalidation.
 *
 * @param {Express.User} user - The authenticated user object.
 * @param {Function} done - Callback: done(error, userId).
 */
passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

/**
 * Deserializes the user from session on each request.
 *
 * Called by Passport after express-session loads the session from Redis.
 * Reads the user ID stored by {@link serializeUser} and fetches the full
 * user object from PostgreSQL via Prisma. The result is attached to `req.user`.
 *
 * @param {string} id - The user ID stored in the session.
 * @param {Function} done - Callback: done(error, user|null).
 */
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
