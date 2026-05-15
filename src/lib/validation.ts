import { z } from "zod";

export const emailSchema = z.string().trim().email("Invalid email address");

/** Signup POST body — unknown fields rejected */
export const signupRequestSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    email: emailSchema,
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .strict();

/** Login POST body */
export const loginRequestSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  })
  .strict();

/** Create project POST */
export const projectCreateRequestSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    description: z.string().trim().max(2000).optional().nullable(),
  })
  .strict();

/** Update project PATCH */
export const projectUpdateRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
  })
  .strict();

/** Invite member POST */
export const memberAddRequestSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

/** Change member role PATCH */
export const memberRoleUpdateRequestSchema = z
  .object({
    role: z.enum(["ADMIN", "MEMBER"]),
  })
  .strict();

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

const dueDateField = z
  .union([
    z.string().datetime({ offset: true, message: "Invalid due date" }),
    z.null(),
  ])
  .optional();

/** Create task POST */
export const taskCreateRequestSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().max(5000).optional().nullable(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueDate: dueDateField,
    assigneeId: z.union([z.string().cuid(), z.null()]).optional(),
  })
  .strict();

/** Admin full task PATCH */
export const taskUpdateRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).optional().nullable(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueDate: dueDateField,
    assigneeId: z.union([z.string().cuid(), z.null()]).optional(),
  })
  .strict();

/**
 * MEMBER assignee may only send `{ status }` — no other fields allowed.
 */
export const taskMemberStatusPatchRequestSchema = z
  .object({
    status: taskStatusSchema,
  })
  .strict();

const taskListStatus = taskStatusSchema.optional();
const taskListPriority = taskPrioritySchema.optional();
const assigneeFilter = z.union([z.literal("me"), z.string().cuid()]).optional();

/** GET /tasks list query (optional filters) */
export const taskListQuerySchema = z
  .object({
    status: taskListStatus,
    assigneeId: assigneeFilter,
    priority: taskListPriority,
    overdue: z.enum(["true", "false"]).optional(),
  })
  .strict();

export function formatZodError(err: z.ZodError) {
  return err.flatten().fieldErrors;
}

/** Build query object from URLSearchParams (empty strings omitted). */
export function searchParamsToRecord(searchParams: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (value !== "") out[key] = value;
  });
  return out;
}
