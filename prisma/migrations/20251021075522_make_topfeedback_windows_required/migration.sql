/*
  Warnings:

  - Made the column `window` on table `top_feedback` required. This step will fail if there are existing NULL values in that column.
  - Made the column `windowEnd` on table `top_feedback` required. This step will fail if there are existing NULL values in that column.
  - Made the column `windowStart` on table `top_feedback` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."top_feedback" ALTER COLUMN "window" SET NOT NULL,
ALTER COLUMN "windowEnd" SET NOT NULL,
ALTER COLUMN "windowStart" SET NOT NULL;
