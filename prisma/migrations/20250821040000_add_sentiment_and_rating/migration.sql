/*
  Migration: Add sentiment and rating fields to Feedback model
  Date: 2025-08-21
*/

-- Add sentiment and rating columns to feedbacks table
ALTER TABLE "public"."feedbacks" 
ADD COLUMN "sentiment" TEXT DEFAULT 'neutral',
ADD COLUMN "rating" INTEGER;

-- Update existing feedbacks with sentiment and rating based on experience
UPDATE "public"."feedbacks" 
SET 
  "sentiment" = CASE 
    WHEN "experience" = 'YO!' THEN 'positive'
    WHEN "experience" = 'Pretty good' THEN 'positive'
    WHEN "experience" = 'Okay-ish' THEN 'neutral'
    WHEN "experience" = 'Not great' THEN 'negative'
    WHEN "experience" = 'Poor' THEN 'negative'
    ELSE 'neutral'
  END,
  "rating" = CASE 
    WHEN "experience" = 'YO!' THEN 5
    WHEN "experience" = 'Pretty good' THEN 4
    WHEN "experience" = 'Okay-ish' THEN 3
    WHEN "experience" = 'Not great' THEN 2
    WHEN "experience" = 'Poor' THEN 1
    ELSE 3
  END;

-- Make sentiment required (it now has a default value)
ALTER TABLE "public"."feedbacks" ALTER COLUMN "sentiment" SET NOT NULL;
