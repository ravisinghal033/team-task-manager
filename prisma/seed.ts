import type { TaskPriority, TaskStatus } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const ROUNDS = 12;

async function upsertUser(email: string, name: string, password: string) {
  const passwordHash = await bcrypt.hash(password, ROUNDS);
  const normalized = email.toLowerCase();
  return prisma.user.upsert({
    where: { email: normalized },
    update: { name, passwordHash },
    create: { email: normalized, name, passwordHash },
  });
}

async function ensureProject(ownerId: string, name: string, description: string | null) {
  let project = await prisma.project.findFirst({
    where: { ownerId, name },
  });
  if (!project) {
    project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId,
        members: {
          create: [{ userId: ownerId, role: "ADMIN" }],
        },
      },
    });
  } else {
    project = await prisma.project.update({
      where: { id: project.id },
      data: { description },
    });
  }
  return project;
}

async function ensureMember(projectId: string, userId: string, role: "ADMIN" | "MEMBER") {
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    create: { projectId, userId, role },
    update: { role },
  });
}

async function ensureTask(
  projectId: string,
  title: string,
  data: {
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date | null;
    assigneeId: string | null;
    createdById: string;
  },
) {
  const existing = await prisma.task.findFirst({
    where: { projectId, title },
  });
  if (existing) {
    await prisma.task.update({
      where: { id: existing.id },
      data: {
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate,
        assigneeId: data.assigneeId,
        createdById: data.createdById,
      },
    });
  } else {
    await prisma.task.create({
      data: {
        projectId,
        title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate,
        assigneeId: data.assigneeId,
        createdById: data.createdById,
      },
    });
  }
}

async function main() {
  const admin = await upsertUser("admin@example.com", "Admin User", "Admin@12345");
  const member = await upsertUser("member@example.com", "Member User", "Member@12345");
  const bharat = await upsertUser("bharat.patidar@ethara.ai", "Bharat Patidar", "Bharat@12345");
  const ravi = await upsertUser("ravi.singhal033@ethara.ai", "Ravi Singhal", "Ravi@12345");

  const productLaunch = await ensureProject(
    admin.id,
    "Product Launch",
    "Coordinate launch tasks across design, engineering, and marketing.",
  );
  await ensureMember(productLaunch.id, admin.id, "ADMIN");
  await ensureMember(productLaunch.id, member.id, "MEMBER");

  const soon = new Date();
  soon.setDate(soon.getDate() + 3);
  const past = new Date();
  past.setDate(past.getDate() - 5);

  await ensureTask(productLaunch.id, "Draft announcement blog post", {
    description: "Outline key messaging and CTA.",
    status: "TODO",
    priority: "HIGH",
    dueDate: soon,
    assigneeId: member.id,
    createdById: admin.id,
  });
  await ensureTask(productLaunch.id, "QA regression suite", {
    description: "Run smoke tests on staging.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    dueDate: soon,
    assigneeId: admin.id,
    createdById: admin.id,
  });
  await ensureTask(productLaunch.id, "Ship checklist sign-off", {
    description: "Final approvals from stakeholders.",
    status: "DONE",
    priority: "LOW",
    dueDate: soon,
    assigneeId: admin.id,
    createdById: admin.id,
  });
  await ensureTask(productLaunch.id, "Update pricing page (overdue)", {
    description: "This task is intentionally overdue for demo purposes.",
    status: "TODO",
    priority: "HIGH",
    dueDate: past,
    assigneeId: member.id,
    createdById: admin.id,
  });

  const etharaDescription =
    "Internal task tracker for custom repo trajectory work: prepare repos, create dataset JSON, collect test IDs, build Docker, run pipeline, and evaluate results.";

  const kaijus = await ensureProject(bharat.id, "Ethara AI - Kaijus", etharaDescription);
  await ensureMember(kaijus.id, bharat.id, "ADMIN");
  await ensureMember(kaijus.id, ravi.id, "MEMBER");

  await ensureTask(kaijus.id, "Prepare repo fork and stubbing", {
    description:
      "Fork target repo, clone it, record reference commit, stub source code, push base branch, and generate dataset entry.",
    status: "TODO",
    priority: "HIGH",
    dueDate: null,
    assigneeId: ravi.id,
    createdById: bharat.id,
  });
  await ensureTask(kaijus.id, "Create dataset JSON and test IDs", {
    description: "Generate dataset JSON, collect pytest test IDs, and install test IDs for evaluation.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueDate: null,
    assigneeId: ravi.id,
    createdById: bharat.id,
  });
  await ensureTask(kaijus.id, "Build Docker image", {
    description: "Build isolated Docker container with Python, dependencies, pytest, and mounted source.",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: null,
    assigneeId: ravi.id,
    createdById: bharat.id,
  });
  await ensureTask(kaijus.id, "Run trajectory pipeline and evaluate", {
    description:
      "Run the 3-stage pipeline and check patch.diff, report.json, passed tests, cost, and final pass rate.",
    status: "DONE",
    priority: "HIGH",
    dueDate: null,
    assigneeId: bharat.id,
    createdById: bharat.id,
  });

  console.log(
    "Seed complete (idempotent): example.com users; Ethara demo (bharat.patidar@ethara.ai / Bharat@12345, ravi.singhal033@ethara.ai / Ravi@12345).",
  );
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
