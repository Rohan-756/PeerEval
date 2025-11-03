import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, creatorId, title, description, deadline, criteria, surveyId } = body || {};

    if (!projectId || !creatorId || !title || !deadline) {
      return NextResponse.json(
        { error: "projectId, creatorId, title, and deadline are required" },
        { status: 400 }
      );
    }

    // Verify instructor owns the project
    const project = await prisma.project.findFirst({
      where: { id: projectId, instructorId: creatorId },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found or not owned by instructor" },
        { status: 403 }
      );
    }

    // Create or fetch the survey without using a single transaction to avoid 25P02 aborts
    let survey: any = null;
    if (surveyId) {
      survey = await prisma.survey.findFirst({ where: { id: surveyId, creatorId } });
      if (!survey) {
        return NextResponse.json(
          { error: "Survey not found or not owned by instructor" },
          { status: 404 }
        );
      }
    } else {
      survey = await prisma.survey.create({
        data: { title, description: description ?? null, creatorId },
      });

      // Attempt to create criteria separately; ignore if table not migrated yet
      if (Array.isArray(criteria) && criteria.length > 0) {
        try {
          await prisma.surveyCriterion.createMany({
            data: criteria.map((c: any, index: number) => ({
              surveyId: survey.id,
              label: String(c.label || `Criterion ${index + 1}`),
              minRating: Number(c.minRating ?? 1),
              maxRating: Number(c.maxRating ?? 5),
              order: Number(c.order ?? index + 1),
            })),
          });
        } catch (e: any) {
          // Table missing, proceed without criteria
          if (!(e?.code === 'P2021' || /SurveyCriterion/.test(String(e?.message)))) {
            throw e;
          }
        }
      }
    }

    // Create assignment
    const assignmentBase = await prisma.surveyAssignment.create({
      data: {
        projectId,
        surveyId: survey.id,
        deadline: new Date(deadline),
      },
      include: { survey: true },
    });

    // Try to load criteria for response (optional)
    let criteriaList: any[] = [];
    try {
      criteriaList = await prisma.surveyCriterion.findMany({
        where: { surveyId: survey.id },
        orderBy: { order: 'asc' },
        select: { id: true, label: true, minRating: true, maxRating: true, order: true },
      });
    } catch {}

    const assignment = { ...assignmentBase, survey: { ...assignmentBase.survey, criteria: criteriaList } };

    return NextResponse.json({ success: true, survey, assignment }, { status: 201 });
  } catch (err) {
    console.error("Error assigning survey:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


