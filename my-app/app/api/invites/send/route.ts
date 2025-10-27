import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { projectId, studentEmail, instructorId } = await req.json();

    // 🔒 Validate inputs
    if (!projectId || !studentEmail || !instructorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 🔍 Verify instructor
    const instructor = await prisma.user.findUnique({ where: { id: instructorId } });
    if (!instructor || instructor.role !== "instructor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 🔍 Verify project belongs to this instructor
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.instructorId !== instructor.id) {
      return NextResponse.json({ error: "This project does not belong to you" }, { status: 403 });
    }

    // 🔍 Check student existence and role
    const student = await prisma.user.findUnique({ where: { email: studentEmail } });
    if (!student || student.role !== "student") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // 🚫 Prevent duplicate invites
    const existingInvite = await prisma.invite.findFirst({
      where: {
        projectId,
        studentId: student.id,
      },
    });
    if (existingInvite) {
      return NextResponse.json({ error: "Invite already sent to this student" }, { status: 400 });
    }

    // ✅ Create invite
    const invite = await prisma.invite.create({
      data: {
        projectId,
        studentId: student.id,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, invite });
  } catch (err: any) {
    console.error("❌ Error in /api/invites/send:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
