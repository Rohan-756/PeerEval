import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

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

    const survey = await prisma.survey.create({
      data: {
        projectId,
        questions: {
          create: questions.map((q: any) => ({
            text: q.text,
            type: q.type,
            options: q.options || [],
          })),
        },
      },
      include: { questions: true },
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

    const surveys = await prisma.survey.findMany({
      where: { projectId },
      include: { questions: true },
    });

    return NextResponse.json(surveys);
  } catch (err) {
    console.error("Error fetching surveys:", err);
    return NextResponse.json({ error: "Failed to fetch surveys" }, { status: 500 });
  }
}
