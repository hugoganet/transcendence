-- CreateIndex
CREATE UNIQUE INDEX "TokenTransaction_userId_missionId_type_key" ON "TokenTransaction"("userId", "missionId", "type");
