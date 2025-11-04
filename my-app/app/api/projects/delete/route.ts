import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request) {
  try {
    const { projectId, instructorId } = await req.json();

    console.log("🗑️ Attempting to delete:", projectId, "by", instructorId);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      // Eagerly fetch teams and survey assignments to correctly cascade the delete
      include: {
        teams: {
          select: {
            id: true
          }
        },
        surveyAssignments: {
          select: {
            id: true
          }
        }
      }
    });

    if (!project) {
      console.log("❌ Project not found in DB");
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.instructorId !== instructorId) {
      console.log("🚫 Unauthorized delete attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // --- Start: Manual Cascading Delete to resolve P2003 Foreign Key Error ---

    const teamIds = project.teams.map(t => t.id);
    const assignmentIds = project.surveyAssignments.map(s => s.id);

    // 1. Delete all Survey Responses related to this project's assignments
    if (assignmentIds.length > 0) {
      await prisma.surveyResponse.deleteMany({
        where: {
          assignmentId: {
            in: assignmentIds,
          },
        },
      });
      console.log(`🧹 Deleted ${assignmentIds.length} survey assignments' responses.`);
    }

    // 2. Delete all Survey Assignments related to this project
    await prisma.surveyAssignment.deleteMany({
      where: { projectId: projectId }
    });
    console.log(`🧹 Deleted ${project.surveyAssignments.length} survey assignments.`);


    // 3. Delete all Team Members from the teams of this project
    if (teamIds.length > 0) {
      await prisma.teamMember.deleteMany({
        where: {
          teamId: {
            in: teamIds,
          },
        },
      });
      console.log(`🧹 Deleted team members from ${teamIds.length} teams.`);
    }


    // 4. Delete all Teams associated with this project (Resolves Team_projectId_fkey)
    await prisma.team.deleteMany({
      where: { projectId: projectId }
    });
    console.log(`🧹 Deleted ${project.teams.length} teams.`);


    // --- End: Manual Cascading Delete ---


    // 5. Finally, delete the Project
    await prisma.project.delete({
      where: { id: projectId },
    });

    console.log("✅ Deleted project successfully");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("💥 Error deleting project:", err);
    // Use a specific status code for foreign key violation if possible, 
    // but 500 is fine if the above logic fails for any other reason.
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}