import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { z } from "zod/v4";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// ─── POST /api/projects/:projectId/members ──────────────────
// ADMIN only: add members to a project
const addMembersSchema = z.object({
  memberIds: z.array(z.string()).min(1, "At least one member ID is required"),
});

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireRole("ADMIN");
  if (!auth.authorized) return auth.response;

  const { projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { select: { id: true } } },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = addMembersSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: z.prettifyError(result.error) },
        { status: 400 }
      );
    }

    const { memberIds } = result.data;

    // Verify all member IDs exist
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true },
    });

    if (existingUsers.length !== memberIds.length) {
      return NextResponse.json(
        { error: "One or more user IDs are invalid" },
        { status: 400 }
      );
    }

    // Connect the new members (Prisma `connect` is additive, won't duplicate)
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: memberIds.map((id) => ({ id })),
        },
      },
      include: {
        members: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({
      message: "Members added successfully",
      members: updatedProject.members,
    });
  } catch (error) {
    console.error("Error adding members:", error);
    return NextResponse.json(
      { error: "Failed to add members" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/projects/:projectId/members ────────────────
// ADMIN only: remove a member from a project
// Body: { memberId: string }
export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireRole("ADMIN");
  if (!auth.authorized) return auth.response;

  const { session } = auth;
  const { projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { select: { id: true } },
        tasks: {
          where: { assigneeId: { not: null } },
          select: { id: true, assigneeId: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const memberId = body.memberId;

    if (!memberId || typeof memberId !== "string") {
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 }
      );
    }

    // Prevent removing yourself (the admin) — they should always be a member
    if (memberId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the project" },
        { status: 400 }
      );
    }

    // Check if the member is actually in the project
    const isMember = project.members.some((m) => m.id === memberId);
    if (!isMember) {
      return NextResponse.json(
        { error: "User is not a member of this project" },
        { status: 400 }
      );
    }

    // Unassign any tasks assigned to this member within the project
    const assignedTasks = project.tasks.filter((t) => t.assigneeId === memberId);
    if (assignedTasks.length > 0) {
      await prisma.task.updateMany({
        where: {
          id: { in: assignedTasks.map((t) => t.id) },
        },
        data: { assigneeId: null },
      });
    }

    // Remove the member
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          disconnect: { id: memberId },
        },
      },
      include: {
        members: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({
      message: "Member removed successfully",
      members: updatedProject.members,
      unassignedTasks: assignedTasks.length,
    });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
