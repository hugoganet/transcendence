-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('AVAILABLE', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ChapterStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "status" "MissionStatus" NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "status" "ChapterStatus" NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserProgress_userId_idx" ON "UserProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_userId_missionId_key" ON "UserProgress"("userId", "missionId");

-- CreateIndex
CREATE INDEX "ChapterProgress_userId_idx" ON "ChapterProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterProgress_userId_chapterId_key" ON "ChapterProgress"("userId", "chapterId");

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterProgress" ADD CONSTRAINT "ChapterProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
