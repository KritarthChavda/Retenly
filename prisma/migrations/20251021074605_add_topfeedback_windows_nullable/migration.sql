-- CreateEnum
CREATE TYPE "public"."HighlightWindow" AS ENUM ('D7', 'D30', 'D90');

-- AlterTable
ALTER TABLE "public"."top_feedback" ADD COLUMN     "window" "public"."HighlightWindow",
ADD COLUMN     "windowEnd" TIMESTAMP(3),
ADD COLUMN     "windowStart" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "top_feedback_restaurantId_type_window_windowStart_windowEnd_idx" ON "public"."top_feedback"("restaurantId", "type", "window", "windowStart", "windowEnd");
