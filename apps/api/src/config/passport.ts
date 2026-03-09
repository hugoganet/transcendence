import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import bcrypt from "bcryptjs";
import { prisma } from "./database.js";
import { findOrCreateOAuthUser } from "../services/authService.js";

/** Tracks which OAuth strategies are configured (env vars present). */
export const configuredStrategies = new Set<string>();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      id: string;
      email: string | null;
      displayName: string | null;
      bio: string | null;
      avatarUrl: string | null;
      locale: string;
      ageConfirmed: boolean;
      twoFactorEnabled: boolean;
      twoFactorSecret: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

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

// Google OAuth strategy (only if credentials configured)
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

// Facebook OAuth strategy (only if credentials configured)
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

passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
