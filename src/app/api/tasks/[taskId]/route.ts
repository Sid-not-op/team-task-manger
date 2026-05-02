import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { z } from "zod/v4";

interface RouteParams {
  params: Promise<{ taskId: string }>;
}

// ─── GET /api/tasks/:taskId ─────────────────────────────────
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const { session } = auth;
  const { taskId } = await params;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: { select: { id: true, name: true, email: true } },
        project: {
          select: { id: true, name: true, members: { select: { id: true } } },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (session.user.role === "MEMBER") {
      const isMember = task.project.members.some((m) => m.id === session.user.id);
      if (!isMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

// ─── PATCH /api/tasks/:taskId ───────────────────────────────
// ADMIN: can update all fields
// MEMBER: can only update the status of tasks assigned to them
const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  dueDate: z.string().nullable().optional(),
  assigneeIds: z.array(z.string()).optional(),
});

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const { session } = auth;
  const { taskId } = await params;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: { select: { id: true } },
        project: { include: { members: { select: { id: true } } } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const result = updateTaskSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: z.prettifyError(result.error) },
        { status: 400 }
      );
    }

    const { title, description, status, dueDate, assigneeIds } = result.data;

    // MEMBER restrictions: must be an assignee, can only update status
    if (session.user.role === "MEMBER") {
      const isAssignee = task.assignees.some((a) => a.id === session.user.id);
      if (!isAssignee) {
        return NextResponse.json(
          { error: "Forbidden: You can only update tasks assigned to you" },
          { status: 403 }
        );
      }
      if (title || description || dueDate !== undefined || assigneeIds !== undefined) {
        return NextResponse.json(
          { error: "Forbidden: Members can only update task status" },
          { status: 403 }
        );
      }
    }

    // If reassigning, verify all assignees are project members
    if (assigneeIds !== undefined) {
      const memberIds = new Set(task.project.members.map((m) => m.id));
      const invalid = assigneeIds.filter((id) => !memberIds.has(id));
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: "All assignees must be members of this project" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (assigneeIds !== undefined) {
      // Use `set` to replace all assignees
      updateData.assignees = {
        set: assigneeIds.map((id) => ({ id })),
      };
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignees: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ message: "Task updated", task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// ─── DELETE /api/tasks/:taskId ──────────────────────────────
export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireRole("ADMIN");
  if (!auth.authorized) return auth.response;

  const { taskId } = await params;

  try {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id: taskId } });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
