-- Add missing indexes on foreign keys and frequently-filtered columns.
-- Index names follow Prisma's default convention (<Table>_<col...>_idx) so that
-- `prisma migrate dev` / `migrate deploy` stay consistent with schema.prisma.

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expires_at_idx" ON "RefreshToken"("expires_at");

-- CreateIndex
CREATE INDEX "Application_userId_idx" ON "Application"("userId");

-- CreateIndex
CREATE INDEX "Folder_userId_idx" ON "Folder"("userId");

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

-- CreateIndex
CREATE INDEX "Document_folderId_idx" ON "Document"("folderId");

-- CreateIndex
CREATE INDEX "Document_status_docType_idx" ON "Document"("status", "docType");

-- CreateIndex
CREATE INDEX "Notification_userId_created_at_idx" ON "Notification"("userId", "created_at");

-- CreateIndex
CREATE INDEX "Objective_promoId_idx" ON "Objective"("promoId");

-- CreateIndex
CREATE INDEX "ObjectiveCompletion_userId_idx" ON "ObjectiveCompletion"("userId");

-- CreateIndex
CREATE INDEX "Communication_senderId_idx" ON "Communication"("senderId");

-- CreateIndex
CREATE INDEX "Communication_recipientId_idx" ON "Communication"("recipientId");

-- CreateIndex
CREATE INDEX "User_promoId_idx" ON "User"("promoId");

-- CreateIndex
CREATE INDEX "User_verificationToken_idx" ON "User"("verificationToken");

-- CreateIndex
CREATE INDEX "User_resetPasswordToken_idx" ON "User"("resetPasswordToken");

-- CreateIndex
CREATE INDEX "User_last_seen_at_idx" ON "User"("last_seen_at");
