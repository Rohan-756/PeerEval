-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "targetStudentId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_assignmentId_respondentId_targetStudentId_key" ON "SurveyResponse"("assignmentId", "respondentId", "targetStudentId");

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "SurveyAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_targetStudentId_fkey" FOREIGN KEY ("targetStudentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
