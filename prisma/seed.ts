import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await bcrypt.hash("Admin@12345", 12);
  const memberHash = await bcrypt.hash("Member@12345", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      passwordHash: adminHash,
    },
  });

  const member = await prisma.user.create({
    data: {
      name: "Member User",
      email: "member@example.com",
      passwordHash: memberHash,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "Product Launch",
      description: "Coordinate launch tasks across design, engineering, and marketing.",
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: "ADMIN" },
          { userId: member.id, role: "MEMBER" },
        ],
      },
    },
  });

  const past = new Date();
  past.setDate(past.getDate() - 5);

  const soon = new Date();
  soon.setDate(soon.getDate() + 3);

  await prisma.task.createMany({
    data: [
      {
        title: "Draft announcement blog post",
        description: "Outline key messaging and CTA.",
        status: "TODO",
        priority: "HIGH",
        dueDate: soon,
        projectId: project.id,
        assigneeId: member.id,
        createdById: admin.id,
      },
      {
        title: "QA regression suite",
        description: "Run smoke tests on staging.",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        dueDate: soon,
        projectId: project.id,
        assigneeId: admin.id,
        createdById: admin.id,
      },
      {
        title: "Ship checklist sign-off",
        description: "Final approvals from stakeholders.",
        status: "DONE",
        priority: "LOW",
        dueDate: soon,
        projectId: project.id,
        assigneeId: admin.id,
        createdById: admin.id,
      },
      {
        title: "Update pricing page (overdue)",
        description: "This task is intentionally overdue for demo purposes.",
        status: "TODO",
        priority: "HIGH",
        dueDate: past,
        projectId: project.id,
        assigneeId: member.id,
        createdById: admin.id,
      },
    ],
  });

  console.log("Seed complete: admin@example.com / Admin@12345, member@example.com / Member@12345");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
