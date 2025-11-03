-- CreateTable
CREATE TABLE "SurveyCriterion" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minRating" INTEGER NOT NULL DEFAULT 1,
    "maxRating" INTEGER NOT NULL DEFAULT 5,
    "order" INTEGER NOT NULL,

    CONSTRAINT "SurveyCriterion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SurveyCriterion" ADD CONSTRAINT "SurveyCriterion_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
