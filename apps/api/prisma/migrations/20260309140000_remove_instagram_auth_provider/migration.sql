-- AlterEnum: Remove INSTAGRAM from AuthProvider
-- Instagram Basic Display API shut down December 4, 2024
ALTER TYPE "AuthProvider" RENAME TO "AuthProvider_old";
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK');
ALTER TABLE "User" ALTER COLUMN "authProvider" TYPE "AuthProvider" USING "authProvider"::text::"AuthProvider";
ALTER TABLE "OAuthAccount" ALTER COLUMN "provider" TYPE "AuthProvider" USING "provider"::text::"AuthProvider";
DROP TYPE "AuthProvider_old";
