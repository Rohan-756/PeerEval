/*
  Warnings:

  - You are about to drop the column `criteria` on the `Survey` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Survey" DROP COLUMN "criteria";

-- CreateTable
CREATE TABLE "Criterion" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,

    CONSTRAINT "Criterion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Criterion" ADD CONSTRAINT "Criterion_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
