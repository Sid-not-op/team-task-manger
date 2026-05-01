import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { z } from "zod/v4";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// ─── GET /api/projects/:projectId ───────────────────────────
// Fetch a single project with its members and tasks
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const { session } = auth;
  const { projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: { id: true, name: true, email: true, role: true },
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // MEMBER can only see projects they belong to
    if (session.user.role === "MEMBER") {
      const isMember = project.members.some((m) => m.id === session.user.id);
      if (!isMember) {
        return NextResponse.json(
          { error: "Forbidden: You are not a member of this project" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// ─── PUT /api/projects/:projectId ───────────────────────────
// ADMIN only: update project details
const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  memberIds: z.array(z.string()).optional(),
});

export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireRole("ADMIN");
  if (!auth.authorized) return auth.response;

  const { session } = auth;
  const { projectId } = await params;

  try {
    // Verify project exists
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = updateProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: z.prettifyError(result.error) },
        { status: 400 }
      );
    }

    const { name, description, memberIds } = result.data;

    // Build the update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    if (memberIds !== undefined) {
      // Always include the admin
      const allMemberIds = [...new Set([session.user.id, ...memberIds])];
      updateData.members = {
        set: allMemberIds.map((id) => ({ id })),
      };
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json({ message: "Project updated", project });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/projects/:projectId ────────────────────────
// ADMIN only: delete a project (cascades to tasks)
export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireRole("ADMIN");
  if (!auth.authorized) return auth.response;

  const { projectId } = await params;

  try {
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
