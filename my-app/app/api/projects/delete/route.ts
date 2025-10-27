import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request) {
  try {
    const { projectId, instructorId } = await req.json();

    console.log("🗑️ Attempting to delete:", projectId, "by", instructorId);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      console.log("❌ Project not found in DB");
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.instructorId !== instructorId) {
      console.log("🚫 Unauthorized delete attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    console.log("✅ Deleted project successfully");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("💥 Error deleting project:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
