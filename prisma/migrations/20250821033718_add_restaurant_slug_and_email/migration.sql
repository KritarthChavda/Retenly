/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `restaurants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `restaurants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `restaurants` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add columns as nullable first
ALTER TABLE "public"."restaurants" ADD COLUMN "email" TEXT,
ADD COLUMN "slug" TEXT;

-- Step 2: Update existing records with generated values
UPDATE "public"."restaurants" 
SET 
  "email" = 'restaurant' || id || '@example.com',
  "slug" = 'restaurant-' || id;

-- Step 3: Make columns required
ALTER TABLE "public"."restaurants" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "public"."restaurants" ALTER COLUMN "slug" SET NOT NULL;

-- Step 4: Create unique index
CREATE UNIQUE INDEX "restaurants_slug_key" ON "public"."restaurants"("slug");
