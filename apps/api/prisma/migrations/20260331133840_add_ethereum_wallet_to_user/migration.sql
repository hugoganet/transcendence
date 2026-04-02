/*
  Warnings:

  - A unique constraint covering the columns `[ethereumWallet]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ethereumWallet" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_ethereumWallet_key" ON "User"("ethereumWallet");
