-- CreateTable
CREATE TABLE "top_feedback" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "feedbackId" TEXT,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "themes" TEXT NOT NULL,
    "representativeIds" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "model" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "top_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "top_feedback_restaurantId_type_idx" ON "top_feedback"("restaurantId", "type");

-- AddForeignKey
ALTER TABLE "top_feedback" ADD CONSTRAINT "top_feedback_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
