/*
  Warnings:

  - Added the required column `formId` to the `feedbacks` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "public"."admins" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."restaurants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forms" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."questions" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "public"."admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_username_key" ON "public"."restaurants"("username");

-- AddForeignKey
ALTER TABLE "public"."forms" ADD CONSTRAINT "forms_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "public"."forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default restaurant and form for existing feedback data
INSERT INTO "public"."restaurants" ("id", "name", "username", "password", "createdAt", "updatedAt") 
VALUES ('default-restaurant', 'Default Restaurant', 'default', '$2b$10$default', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "public"."forms" ("id", "restaurantId", "title", "createdAt", "updatedAt") 
VALUES ('default-form', 'default-restaurant', 'Default Feedback Form', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add formId column to feedbacks table
ALTER TABLE "public"."feedbacks" ADD COLUMN "formId" TEXT;

-- Update existing feedback records to use the default form
UPDATE "public"."feedbacks" SET "formId" = 'default-form';

-- Make formId required
ALTER TABLE "public"."feedbacks" ALTER COLUMN "formId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."feedbacks" ADD CONSTRAINT "feedbacks_formId_fkey" FOREIGN KEY ("formId") REFERENCES "public"."forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
