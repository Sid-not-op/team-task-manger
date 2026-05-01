import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { z } from "zod/v4";

// ─── GET /api/projects ──────────────────────────────────────
// ADMIN: sees all projects
// MEMBER: sees only projects they are a member of
export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const { session } = auth;

  try {
    const projects = await prisma.project.findMany({
      where:
        session.user.role === "ADMIN"
          ? {} // Admin sees all
          : { members: { some: { id: session.user.id } } }, // Member sees only their projects
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// ─── POST /api/projects ─────────────────────────────────────
// ADMIN only: create a new project
const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional(),
  memberIds: z.array(z.string()).optional().default([]),
});

export async function POST(request: Request) {
  const auth = await requireRole("ADMIN");
  if (!auth.authorized) return auth.response;

  const { session } = auth;

  try {
    const body = await request.json();
    const result = createProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: z.prettifyError(result.error) },
        { status: 400 }
      );
    }

    const { name, description, memberIds } = result.data;

    // Always include the admin as a member
    const allMemberIds = [...new Set([session.user.id, ...memberIds])];

    // Verify all member IDs exist
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: allMemberIds } },
      select: { id: true },
    });

    if (existingUsers.length !== allMemberIds.length) {
      return NextResponse.json(
        { error: "One or more member IDs are invalid" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        createdById: session.user.id,
        members: {
          connect: allMemberIds.map((id) => ({ id })),
        },
      },
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

    return NextResponse.json(
      { message: "Project created successfully", project },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
