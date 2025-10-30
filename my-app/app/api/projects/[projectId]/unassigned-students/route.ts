import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // This is the optimal Prisma query for your use case.
    // It finds all Users who...
    const availableStudents = await prisma.user.findMany({
      where: {
        // 1. ...have an 'accepted' invite for this specific project
        invites: {
          some: {
            projectId: projectId,
            status: "accepted",
          },
        },
        // 2. ...and are NOT a member of any team for this specific project
        teamMemberships: {
          none: {
            team: {
              projectId: projectId,
            },
          },
        },
      },
      // 3. ...and we only select the fields the frontend needs.
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