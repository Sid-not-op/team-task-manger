import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { z } from "zod/v4";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// ─── GET /api/projects/:projectId/tasks ─────────────────────
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const { session } = auth;
  const { projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { select: { id: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (session.user.role === "MEMBER") {
      const isMember = project.members.some((m) => m.id === session.user.id);
      if (!isMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { projectId };
    if (status) where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignees: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// ─── POST /api/projects/:projectId/tasks ────────────────────
const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional().default("TODO"),
  dueDate: z.string().optional(),
  assigneeIds: z.array(z.string()).optional().default([]),
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
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const result = createTaskSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: z.prettifyError(result.error) },
        { status: 400 }
      );
    }

    const { title, description, status, dueDate, assigneeIds } = result.data;

    // Verify all assignees are project members
    if (assigneeIds.length > 0) {
      const memberIds = new Set(project.members.map((m) => m.id));
      const invalid = assigneeIds.filter((id) => !memberIds.has(id));
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: "All assignees must be members of this project" },
          { status: 400 }
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assignees: assigneeIds.length > 0
          ? { connect: assigneeIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        assignees: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ message: "Task created successfully", task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
