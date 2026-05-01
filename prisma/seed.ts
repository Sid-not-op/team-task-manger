import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create Admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Create Member user
  const memberPassword = await bcrypt.hash("member123", 12);
  const member = await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: {},
    create: {
      name: "Jane Member",
      email: "member@example.com",
      password: memberPassword,
      role: "MEMBER",
    },
  });

  // Create a sample project
  const project = await prisma.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      name: "Website Redesign",
      description:
        "Redesign the company website with a modern look and improved UX.",
      createdById: admin.id,
      members: {
        connect: [{ id: admin.id }, { id: member.id }],
      },
    },
  });

  // Create sample tasks
  await prisma.task.upsert({
    where: { id: "seed-task-1" },
    update: {},
    create: {
      id: "seed-task-1",
      title: "Design homepage mockup",
      description: "Create wireframes and high-fidelity mockups for the new homepage.",
      status: "TODO",
      dueDate: new Date("2026-05-15"),
      projectId: project.id,
      assigneeId: member.id,
    },
  });

  await prisma.task.upsert({
    where: { id: "seed-task-2" },
    update: {},
    create: {
      id: "seed-task-2",
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions for automated testing and deployment.",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-05-10"),
      projectId: project.id,
      assigneeId: admin.id,
    },
  });

  await prisma.task.upsert({
    where: { id: "seed-task-3" },
    update: {},
    create: {
      id: "seed-task-3",
      title: "Write API documentation",
      description: "Document all REST API endpoints with request/response examples.",
      status: "DONE",
      dueDate: new Date("2026-04-30"),
      projectId: project.id,
      assigneeId: member.id,
    },
  });

  console.log("✅ Seed data created:");
  console.log(`   Admin:   ${admin.email} (password: admin123)`);
  console.log(`   Member:  ${member.email} (password: member123)`);
  console.log(`   Project: ${project.name}`);
  console.log(`   Tasks:   3 sample tasks`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
