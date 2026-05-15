import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const userSelect = { id: true, name: true, email: true, createdAt: true, updatedAt: true };

export const taskListSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  dueDate: true,
  projectId: true,
  assigneeId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, name: true } },
  assignee: { select: userSelect },
  createdBy: { select: userSelect },
} as const;

export type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  projectId: string;
  assigneeId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  project: { id: string; name: string };
  assignee: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function withOverdue(tasks: TaskRow[], todayStart: Date) {
  return tasks.map((t) => ({
    ...t,
    overdue: !!t.dueDate && t.status !== "DONE" && t.dueDate < todayStart,
  }));
}

function serializeTask(t: TaskRow & { overdue?: boolean }) {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    projectId: t.projectId,
    assigneeId: t.assigneeId,
    createdById: t.createdById,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    project: t.project,
    assignee: t.assignee,
    createdBy: t.createdBy,
    overdue: t.overdue,
  };
}

export function buildNotifications(
  userId: string,
  isAdminOnAny: boolean,
  adminProjectIds: string[],
  tasks: Array<TaskRow & { overdue?: boolean }>,
  todayStart: Date,
  soonEnd: Date,
) {
  const adminSet = new Set(adminProjectIds);
  const seen = new Set<string>();
  const items: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: Date | null;
    overdue?: boolean;
    project: { id: string; name: string };
    kind: string;
  }> = [];

  const push = (t: (typeof tasks)[0], kind: string) => {
    const key = `${t.id}:${kind}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      overdue: t.overdue,
      project: t.project,
      kind,
    });
  };

  for (const t of tasks) {
    if (t.status === "DONE") continue;
    const dueSoon =
      !!t.dueDate && t.dueDate >= todayStart && t.dueDate <= soonEnd && !t.overdue;

    if (!isAdminOnAny && t.assigneeId === userId) {
      if (t.overdue) push(t, "overdue");
      else if (dueSoon) push(t, "due_soon");
      else push(t, "assigned");
    }
    if (isAdminOnAny && adminSet.has(t.projectId)) {
      if (t.overdue) push(t, "overdue");
      if (!t.assigneeId) push(t, "unassigned");
      if (dueSoon && !t.overdue) push(t, "due_soon");
    }
  }

  return items.slice(0, 50);
}

/** Loads dashboard data with exactly 3 Prisma queries (memberships, tasks, admin roster). */
export async function loadDashboardAggregate(user: User) {
  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    select: { projectId: true, role: true, project: { select: { id: true, name: true } } },
  });

  const projectIds = Array.from(new Set(memberships.map((m) => m.projectId)));
  const adminProjectIds = memberships
    .filter((m) => m.role === "ADMIN")
    .map((m) => m.projectId);
  const isAdminOnAny = adminProjectIds.length > 0;
  const isMemberOnly = !isAdminOnAny;

  if (projectIds.length === 0) {
    return {
      queryCount: 1,
      payload: {
        totalProjects: 0,
        totalTasks: 0,
        tasksAssignedToMe: 0,
        tasksCreatedByMe: 0,
        tasksByStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
        overdueCount: 0,
        dueSoonCount: 0,
        completedAssignedCount: 0,
        teamMemberCount: 0,
        isAdminOnAny,
        isMemberOnly,
        overdueTasks: [],
        dueSoonTasks: [],
        recentTasks: [],
        myCreatedTasks: [],
        assignedToMeTasks: [],
        unassignedTasks: [],
        workloadSummary: [],
        notifications: [],
        projectProgress: [],
        statusDistribution: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
      },
    };
  }

  const [tasksRaw, adminMembers] = await Promise.all([
    prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      select: taskListSelect,
    }),
    adminProjectIds.length > 0
      ? prisma.projectMember.findMany({
          where: { projectId: { in: adminProjectIds } },
          select: { userId: true, user: { select: { id: true, name: true } } },
        })
      : Promise.resolve([]),
  ]);

  const queryCount = adminProjectIds.length > 0 ? 3 : 2;

  const todayStart = startOfToday();
  const soonEnd = addDays(todayStart, 7);
  const tasks = withOverdue(tasksRaw, todayStart);

  const totalProjects = projectIds.length;
  const totalTasks = tasks.length;
  let tasksAssignedToMe = 0;
  let tasksCreatedByMe = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;
  let completedAssignedCount = 0;
  const tasksByStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  const progressByProject = new Map<
    string,
    { projectId: string; name: string; totalTasks: number; doneTasks: number }
  >();

  for (const m of memberships) {
    progressByProject.set(m.projectId, {
      projectId: m.project.id,
      name: m.project.name,
      totalTasks: 0,
      doneTasks: 0,
    });
  }

  const overdueTasks: typeof tasks = [];
  const dueSoonTasks: typeof tasks = [];
  const myCreatedTasks: typeof tasks = [];
  const assignedToMeTasks: typeof tasks = [];
  const unassignedTasks: typeof tasks = [];
  const adminSet = new Set(adminProjectIds);

  for (const t of tasks) {
    if (t.status === "TODO") tasksByStatus.TODO += 1;
    else if (t.status === "IN_PROGRESS") tasksByStatus.IN_PROGRESS += 1;
    else if (t.status === "DONE") tasksByStatus.DONE += 1;

    const prog = progressByProject.get(t.projectId);
    if (prog) {
      prog.totalTasks += 1;
      if (t.status === "DONE") prog.doneTasks += 1;
    }

    if (t.assigneeId === user.id) {
      tasksAssignedToMe += 1;
      if (t.status === "DONE") completedAssignedCount += 1;
      assignedToMeTasks.push(t);
    }
    if (t.createdById === user.id) {
      tasksCreatedByMe += 1;
      myCreatedTasks.push(t);
    }

    const isOverdue = !!t.overdue;
    const isDueSoon =
      !!t.dueDate && t.dueDate >= todayStart && t.dueDate <= soonEnd && t.status !== "DONE";

    if (isOverdue) {
      overdueCount += 1;
      overdueTasks.push(t);
    }
    if (isDueSoon) {
      dueSoonCount += 1;
      dueSoonTasks.push(t);
    }
    if (isAdminOnAny && adminSet.has(t.projectId) && !t.assigneeId && t.status !== "DONE") {
      unassignedTasks.push(t);
    }
  }

  myCreatedTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  assignedToMeTasks.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  overdueTasks.sort((a, b) => {
    if (!a.dueDate || !b.dueDate) return 0;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
  dueSoonTasks.sort((a, b) => {
    if (!a.dueDate || !b.dueDate) return 0;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  const recentTasks = Array.from(tasks)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 15);

  const projectProgress = Array.from(progressByProject.values())
    .map((p) => ({
      ...p,
      progressPercent: p.totalTasks === 0 ? 0 : Math.round((p.doneTasks / p.totalTasks) * 100),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const teamMemberCount = new Set(adminMembers.map((m) => m.userId)).size;

  const workloadMap = new Map<string, { userId: string; name: string; openTasks: number }>();
  for (const m of adminMembers) {
    workloadMap.set(m.userId, { userId: m.userId, name: m.user.name, openTasks: 0 });
  }
  for (const t of tasks) {
    if (!adminSet.has(t.projectId) || t.status === "DONE" || !t.assigneeId) continue;
    const row = workloadMap.get(t.assigneeId);
    if (row) row.openTasks += 1;
  }
  const workloadSummary = Array.from(workloadMap.values())
    .filter((w) => w.openTasks > 0)
    .sort((a, b) => b.openTasks - a.openTasks)
    .slice(0, 8);

  const notifications = buildNotifications(
    user.id,
    isAdminOnAny,
    adminProjectIds,
    tasks,
    todayStart,
    soonEnd,
  );

  const payload = {
    totalProjects,
    totalTasks,
    tasksAssignedToMe,
    tasksCreatedByMe,
    tasksByStatus,
    overdueCount,
    dueSoonCount,
    completedAssignedCount,
    teamMemberCount,
    isAdminOnAny,
    isMemberOnly,
    overdueTasks: overdueTasks.slice(0, 30).map(serializeTask),
    dueSoonTasks: dueSoonTasks.slice(0, 30).map(serializeTask),
    recentTasks: recentTasks.map(serializeTask),
    myCreatedTasks: myCreatedTasks.slice(0, 30).map(serializeTask),
    assignedToMeTasks: assignedToMeTasks.slice(0, 30).map(serializeTask),
    unassignedTasks: unassignedTasks.slice(0, 15).map(serializeTask),
    workloadSummary,
    notifications,
    projectProgress,
    statusDistribution: tasksByStatus,
  };

  return { queryCount, payload };
}

/** Lightweight notification count: 2 Prisma queries. */
export async function loadNotificationCount(userId: string) {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true, role: true },
  });
  const projectIds = memberships.map((m) => m.projectId);
  if (projectIds.length === 0) return { count: 0, queryCount: 1 };

  const adminProjectIds = memberships.filter((m) => m.role === "ADMIN").map((m) => m.projectId);
  const tasksRaw = await prisma.task.findMany({
    where: { projectId: { in: projectIds }, status: { not: "DONE" } },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      projectId: true,
      assigneeId: true,
      project: { select: { id: true, name: true } },
    },
  });

  const todayStart = startOfToday();
  const soonEnd = addDays(todayStart, 7);
  const tasks = withOverdue(tasksRaw as TaskRow[], todayStart);
  const isAdminOnAny = adminProjectIds.length > 0;
  const notifications = buildNotifications(
    userId,
    isAdminOnAny,
    adminProjectIds,
    tasks,
    todayStart,
    soonEnd,
  );

  return { count: notifications.length, queryCount: 2 };
}
