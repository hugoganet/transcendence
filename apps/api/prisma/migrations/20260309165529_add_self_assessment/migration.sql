-- CreateTable
CREATE TABLE "SelfAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "confidenceRating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SelfAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SelfAssessment_userId_idx" ON "SelfAssessment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SelfAssessment_userId_categoryId_key" ON "SelfAssessment"("userId", "categoryId");

-- AddForeignKey
ALTER TABLE "SelfAssessment" ADD CONSTRAINT "SelfAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
