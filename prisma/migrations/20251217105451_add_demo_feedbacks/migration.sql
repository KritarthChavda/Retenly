-- CreateTable
CREATE TABLE "public"."demo_feedbacks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "experience" TEXT,
    "sentiment" TEXT NOT NULL DEFAULT 'neutral',
    "rating" INTEGER DEFAULT 3,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_feedbacks_pkey" PRIMARY KEY ("id")
);
