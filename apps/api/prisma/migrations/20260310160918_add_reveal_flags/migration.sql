-- AlterTable
ALTER TABLE "User" ADD COLUMN     "revealDashboard" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "revealGas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "revealTokens" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "revealWallet" BOOLEAN NOT NULL DEFAULT false;
