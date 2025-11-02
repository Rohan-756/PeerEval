import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params; // await the promise

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const availableStudents = await prisma.user.findMany({
      where: {
        invites: {
          some: {
            projectId: projectId,
            status: "accepted",
          },
        },
        teamMemberships: {
          none: {
            team: {
              projectId: projectId,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(availableStudents);
  } catch (err) {
    console.error("Error fetching unassigned students:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}