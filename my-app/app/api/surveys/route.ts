import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

// If you are getting the error "Property 'survey' does not exist on type 'PrismaClient<...>'",
// you must run 'npx prisma generate' in your terminal inside the 'my-app' directory.

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user || user.role !== "instructor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, questions } = await req.json();

    if (!projectId || !questions || questions.length === 0) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if the instructor owns the project (good practice)
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.instructorId !== user.id) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 403 });
    }


    const survey = await prisma.survey.create({ // Correctly uses prisma.survey
      data: {
        projectId,
        instructorId: user.id,
        title: "Peer Evaluation Survey", // Default title as it's not captured in UI yet
        criteria: {
          create: questions.map((q: any) => ({
            text: q.text,
          })),
        },
      },
      include: { criteria: true },
    });

    return NextResponse.json(survey, { status: 201 });
  } catch (err) {
    console.error("Error creating survey:", err);
    return NextResponse.json({ error: "Failed to create survey" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const surveys = await prisma.survey.findMany({ // Correctly uses prisma.survey
      where: { projectId },
      include: { criteria: true },
      orderBy: { createdAt: "desc" },
    });

    // Always return a structure the frontend expects on success
    return NextResponse.json({ surveys });
  } catch (err) {
    console.error("Error fetching surveys:", err);
    // Always return a consistent error structure with an empty array
    return NextResponse.json({ error: "Failed to fetch surveys", surveys: [] }, { status: 500 });
  }
}