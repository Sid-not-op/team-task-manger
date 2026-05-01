import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// ─── GET /api/dashboard ─────────────────────────────────────
// Returns aggregated stats for the dashboard
// ADMIN: sees stats for all tasks across all projects
// MEMBER: sees stats for tasks assigned to them
export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const { session } = auth;
  const isAdmin = session.user.role === "ADMIN";

  try {
    // Base filter: admin sees all, member sees only assigned tasks
    const taskFilter = isAdmin ? {} : { assigneeId: session.user.id };

    // Count tasks by status
    const [totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks] =
      await Promise.all([
        prisma.task.count({ where: taskFilter }),
        prisma.task.count({ where: { ...taskFilter, status: "TODO" } }),
        prisma.task.count({ where: { ...taskFilter, status: "IN_PROGRESS" } }),
        prisma.task.count({ where: { ...taskFilter, status: "DONE" } }),
        prisma.task.count({
          where: {
            ...taskFilter,
            status: { not: "DONE" },
            dueDate: { lt: new Date() },
          },
        }),
      ]);

    // Count projects
    const totalProjects = await prisma.project.count({
      where: isAdmin
        ? {}
        : { members: { some: { id: session.user.id } } },
    });

    // Recent tasks (last 5)
    const recentTasks = await prisma.task.findMany({
      where: taskFilter,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    // Team members count (admin only)
    const totalMembers = isAdmin
      ? await prisma.user.count()
      : undefined;

    return NextResponse.json({
      stats: {
        totalTasks,
        todoTasks,
        inProgressTasks,
        doneTasks,
        overdueTasks,
        totalProjects,
        totalMembers,
      },
      recentTasks,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
