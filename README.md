# Team Task Manager

Production-style internal hiring assignment: **projects**, **per-project roles (ADMIN / MEMBER)**, **tasks**, **JWT in HTTP-only cookies** (no session server), **PostgreSQL + Prisma**, and a **polished Next.js App Router** UI.

## Auth & access helpers

Implemented in `src/lib/auth.ts` and `src/lib/project-access.ts`:

- `getCurrentUser()` / `requireAuth()` — `src/lib/auth.ts` (JWT cookie via `auth-cookie.ts` + `jose` in `jwt.ts`).
- `getProjectRole(userId, projectId)` — `ADMIN` / `MEMBER` / `null`.
- `requireProjectMember(userId, projectId)` — membership gate with `{ ok, project, role }` or `not_found` / `forbidden`.
- `requireProjectAdmin(userId, projectId)` — admin gate on top of membership.

## Features

- Secure authentication (signup, login, logout, `/api/auth/me`) with **bcrypt** password hashing and **HTTP-only** cookies storing a **JWT**.
- **Per-project RBAC**: project creator becomes **ADMIN**; admins manage members, roles, project lifecycle, and all tasks; **MEMBER** users view the project and may **only update status** on tasks **assigned to them**.
- **Projects**: create, list (membership-scoped), detail, edit, delete, invite members by email, duplicate-member protection.
- **Tasks**: full fields (title, description, status, priority, due date, assignee, audit fields), assignee must be a project member, filters (status, assignee including “me”, priority, overdue), overdue highlighting.
- **Dashboard** with KPI cards, status breakdown, per-project completion bars, overdue list, and recent tasks.
- **Zod** on every mutating handler and on task list **query** params (`.strict()` bodies reject unknown keys; invalid JSON → **400**).
- **RBAC**: last **ADMIN** cannot be removed or demoted; task assignee must be a project member; **MEMBER** PATCH uses `taskMemberStatusPatchRequestSchema` only (`{ status }`).

## Tech stack

- Next.js 14 (App Router) + TypeScript  
- Tailwind CSS  
- PostgreSQL + Prisma ORM  
- bcrypt + `jose` (HS256 JWT)  
- Zod validation  

## Screenshots

_Add screenshots of the dashboard, project board, and task detail here after you run the app locally._

## Local setup

1. **Install dependencies**

```bash
cd team-task-manager
npm install
```

2. **Configure environment**

Copy `.env.example` to `.env` and set:

- `DATABASE_URL` — local or cloud PostgreSQL connection string  
- `JWT_SECRET` — long random secret (minimum 16 characters)  
- `NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000`  

3. **Create database schema**

```bash
npx prisma migrate deploy
```

For iterative local development you can instead use:

```bash
npx prisma migrate dev
```

4. **Seed demo data**

```bash
npm run prisma:seed
```

(Equivalent: `npx prisma db seed`.)

5. **Start the dev server**

```bash
npm run dev
```

Open `http://localhost:3000` — you will be redirected to `/login` or `/dashboard` based on your session.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL URL for Prisma |
| `JWT_SECRET` | Signing key for session JWT (≥ 16 chars) |
| `NEXT_PUBLIC_APP_URL` | Public site URL (used in docs / absolute links if you extend the app) |

## Prisma commands

```bash
npx prisma migrate dev       # create/apply migrations in development
npx prisma migrate deploy    # apply migrations in production / Railway build
npx prisma db seed           # populate demo users + sample project/tasks
npx prisma studio            # browse data
```

## Railway deployment

1. Push this repository to **GitHub**.  
2. In [Railway](https://railway.app), **New Project → Deploy from GitHub** and select the repo.  
3. Add a **PostgreSQL** plugin/service; Railway injects `DATABASE_URL` into the app service.  
4. In the **app service variables**, set:  
   - `DATABASE_URL` (reference from the Postgres service if not auto-linked)  
   - `JWT_SECRET` (generate a strong random string)  
   - `NEXT_PUBLIC_APP_URL` (your Railway public URL, e.g. `https://your-app.up.railway.app`)  
5. **Build**: the default `npm run build` runs `prisma generate`, `prisma migrate deploy`, and `next build`, so migrations apply when `DATABASE_URL` is available at build time.  
6. **Release / start**: `npm run start` (Railway default).  
7. Under **Networking**, **Generate Domain** (or attach a custom domain).  
8. After first deploy, run a **one-off** seed if you want demo data:  
   `npm run prisma:seed` (Railway shell / `railway run npm run prisma:seed`).

Ensure the Node service has network access to Postgres and that all three env vars are set before the first successful build.

## Demo credentials

After `npm run prisma:seed`:

| Role | Email | Password |
|------|--------|----------|
| Admin (project owner / ADMIN) | `admin@example.com` | `Admin@12345` |
| Member | `member@example.com` | `Member@12345` |

The seed creates a shared **“Product Launch”** project, membership for both users, and sample tasks (including an **overdue** item).

## API endpoints

**Auth**

- `POST /api/auth/signup` — body: `{ name, email, password }`  
- `POST /api/auth/login` — body: `{ email, password }`  
- `POST /api/auth/logout`  
- `GET /api/auth/me`  

**Dashboard**

- `GET /api/dashboard`  

**Projects**

- `GET /api/projects`  
- `POST /api/projects` — body: `{ name, description? }`  
- `GET /api/projects/:projectId`  
- `PATCH /api/projects/:projectId` — admin only  
- `DELETE /api/projects/:projectId` — admin only  

**Members**

- `GET /api/projects/:projectId/members`  
- `POST /api/projects/:projectId/members` — admin; body `{ email }`  
- `PATCH /api/projects/:projectId/members/:memberId` — admin; body `{ role }`  
- `DELETE /api/projects/:projectId/members/:memberId` — admin  

**Tasks**

- `GET /api/projects/:projectId/tasks` — query: `status`, `assigneeId` (`me` allowed), `priority`, `overdue=true`  
- `POST /api/projects/:projectId/tasks` — admin only  
- `GET /api/tasks/:taskId`  
- `PATCH /api/tasks/:taskId` — admin (full update) or assignee (status only)  
- `DELETE /api/tasks/:taskId` — admin only  

## Role-based access (summary)

- **ADMIN** (per project): update/delete project, add/remove members, change roles, full CRUD on tasks, assign tasks to any **existing** project member.  
- **MEMBER**: read project and tasks; **cannot** manage members or delete the project; **cannot** edit someone else’s task; may **PATCH only `status`** on tasks where they are the **assignee**. Unassigned tasks cannot be status-updated by a member.

## Demo video flow (suggested)

1. Log in as **admin** — show dashboard stats.  
2. Open **Product Launch** — filters, overdue badge, new task.  
3. **Settings** — rename project, invite a user, change a role.  
4. Log in as **member** — same project read-only settings; open an assigned task and change **status** only.  
5. Attempt a forbidden action (e.g., member opens settings URL) — show **403** / UI message.  
6. Log out and log back in — session cookie behavior.

## NPM scripts

| Script | Command |
|--------|---------|
| `dev` | `next dev` |
| `build` | `prisma generate && prisma migrate deploy && next build` |
| `start` | `next start` |
| `lint` | `next lint` |
| `postinstall` | `prisma generate` (Railway install) |
| `prisma:generate` | `prisma generate` |
| `prisma:migrate` | `prisma migrate deploy` |
| `prisma:seed` | `prisma db seed` |

## Testing checklist (manual)

- [ ] **Auth**: signup validation (short password, bad email); login wrong password → **401**; `/api/auth/me` without cookie → **401**; logout clears access to `/dashboard`.
- [ ] **Middleware**: hit `/dashboard`, `/projects`, `/projects/x`, `/tasks/x` logged out → redirect to `/login`.
- [ ] **Projects**: non-member `GET /api/projects/:id` → **403**; missing id → **404**.
- [ ] **Admin**: member cannot `PATCH` project, `POST` task, `DELETE` task, or manage members → **403**.
- [ ] **Member task**: assignee `PATCH` with `{ "status": "DONE" }` succeeds; same user with `{ "status": "DONE", "title": "x" }` → **400** (strict schema); non-assignee member → **403**; unassigned task + member → **403**.
- [ ] **Last admin**: sole admin cannot be demoted to MEMBER or deleted as member → **400**.
- [ ] **Assignee**: `POST/PATCH` task with non-member `assigneeId` → **400**.
- [ ] **Task list query**: invalid `?status=FOO` → **400**.

## Features completed (hardening pass)

- JWT-only auth (`jose` + HTTP-only cookie); no `next-auth` / server session store.
- Central `parseJsonBody()` + strict Zod request schemas (`src/lib/validation.ts`, `src/lib/request-json.ts`).
- Page `middleware.ts` guards `/dashboard`, `/projects`, `/projects/*`, `/tasks`, `/tasks/*`.
- Prisma uniques, cascades on project delete, documented schema; APIs never return `passwordHash`.
- `requireAuth()` on protected APIs; project routes use `requireProjectMember` / `requireProjectAdmin` as appropriate; consistent **401 / 403 / 404**.

## License

Private / assessment use unless you choose otherwise.
