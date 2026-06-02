-- CreateIndex
CREATE INDEX "feedbacks_formId_idx" ON "feedbacks"("formId");

-- CreateIndex
CREATE INDEX "feedbacks_formId_createdAt_idx" ON "feedbacks"("formId", "createdAt");

-- CreateIndex
CREATE INDEX "feedbacks_createdAt_idx" ON "feedbacks"("createdAt");
