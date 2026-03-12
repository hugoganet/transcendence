-- CreateTable
CREATE TABLE "GdprExportToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GdprExportToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GdprDeletionToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GdprDeletionToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GdprAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GdprAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GdprExportToken_token_key" ON "GdprExportToken"("token");

-- CreateIndex
CREATE INDEX "GdprExportToken_token_idx" ON "GdprExportToken"("token");

-- CreateIndex
CREATE INDEX "GdprExportToken_userId_idx" ON "GdprExportToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GdprDeletionToken_token_key" ON "GdprDeletionToken"("token");

-- CreateIndex
CREATE INDEX "GdprDeletionToken_token_idx" ON "GdprDeletionToken"("token");

-- CreateIndex
CREATE INDEX "GdprDeletionToken_userId_idx" ON "GdprDeletionToken"("userId");

-- CreateIndex
CREATE INDEX "GdprAuditLog_userId_idx" ON "GdprAuditLog"("userId");

-- CreateIndex
CREATE INDEX "GdprAuditLog_createdAt_idx" ON "GdprAuditLog"("createdAt");
