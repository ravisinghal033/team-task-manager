# Ethara WorkBoard — Team Task Manager

Ethara WorkBoard is a production-style full-stack project management and task tracking application built with Next.js, TypeScript, PostgreSQL, Prisma, JWT authentication, project-level role-based access control, Docker support, and Railway deployment readiness.

The application is designed for internal teams that need a simple but secure way to manage projects, assign tasks, track progress, and control user permissions at the project level.

---

## Project Highlights

- Full-stack Next.js 14 App Router application
- Secure JWT authentication using HTTP-only cookies
- PostgreSQL database with Prisma ORM
- Project-level RBAC with ADMIN and MEMBER roles
- Task assignment, filtering, overdue tracking, and status updates
- Optimized dashboard with KPI cards and progress summaries
- Notifications page and lightweight notification count API
- Zod validation for strict API request handling
- Docker support for consistent local setup and easier contribution
- Railway-ready deployment configuration
- Clean, responsive, dark-themed UI

---

## Core Features

### Authentication

- User signup, login, logout, and session validation
- Password hashing with bcrypt
- JWT signed with jose
- JWT stored in secure HTTP-only cookies
- Protected API routes and protected application pages
- `/api/auth/me` endpoint for session-aware UI

### Project Management

- Create, view, update, and delete projects
- Project creator automatically becomes ADMIN
- Users only see projects where they are members
- Admins can invite members by email
- Duplicate member protection
- Last-admin protection to prevent a project from losing all admins

### Role-Based Access Control

Each project supports two roles:

#### ADMIN

An ADMIN can:

- Manage project settings
- Add and remove members
- Change member roles
- Create, update, assign, and delete tasks
- Assign tasks only to existing project members
- View dashboard and team workload summaries

#### MEMBER

A MEMBER can:

- View projects where they are a member
- View project tasks
- Update only the status of tasks assigned to them

A MEMBER cannot:

- Manage project settings
- Add or remove members
- Create or delete tasks
- Edit tasks assigned to another user
- Update task fields other than status

### Task Management

- Create and manage tasks with title, description, status, priority, due date, and assignee
- Status workflow for TODO, IN_PROGRESS, and DONE
- Priority support
- Due date and overdue task tracking
- Filters for status, assignee, priority, and overdue tasks
- Assignee validation to ensure tasks are assigned only to project members
- Audit-friendly task ownership and assignment rules

### Dashboard and Notifications

- Personalized dashboard greeting
- KPI cards for projects, total tasks, created tasks, overdue tasks, and team members
- Per-project progress bars
- Task status breakdown
- Due soon and overdue task sections
- Optimized `/api/dashboard` aggregation
- Notification bell using lightweight `/api/notifications?countOnly=1`
- Dedicated `/notifications` page for assigned, due soon, and overdue items
- Dedicated `/profile` page showing account and project role summary

---

## Performance and UX Improvements

The dashboard and navigation flow were optimized to reduce unnecessary network requests and improve reliability.

Implemented improvements:

- Dashboard data is loaded through a single optimized API call
- Dashboard API uses batched Prisma queries instead of repeated count/groupBy query storms
- Dashboard response shape standardized as `{ ok: true, dashboard }`
- React Strict Mode abort handling fixed using `AbortController` and ignore flags
- Aborted requests no longer incorrectly show the retry/error UI
- Repeated `/api/dashboard` calls on route change and tab visibility change were removed
- Shared user provider reduces repeated `/api/auth/me` calls
- Notification bell uses count-only API instead of loading full dashboard data
- Removed Google Font network dependency to avoid local development font fetch abort errors
- Prisma singleton is used to avoid multiple Prisma clients during development hot reload

---

## Tech Stack

### Frontend

- Next.js 14 App Router
- React
- TypeScript
- Tailwind CSS

### Backend

- Next.js API Routes
- Prisma ORM
- PostgreSQL
- JWT authentication with jose
- bcrypt password hashing
- Zod validation

### DevOps

- GitHub for version control
- Docker / Docker Compose for consistent local setup
- Railway for deployment
- Railway PostgreSQL for production database

---

## Docker Support

Docker support is included to make contribution easier and to reduce environment mismatch between developers.

Benefits:

- Consistent setup across different machines
- Easier onboarding for contributors
- Local PostgreSQL can be managed with Docker Compose
- Reduces “works on my machine” issues
- Helpful foundation for future CI/CD workflows

### Docker Quick Start

Create a `.env` file first, then run:

```bash
docker compose up --build
```

If the project uses a Docker Compose app service named `app`, migrations and seed can be run with:

```bash
docker compose exec app npx prisma migrate dev
docker compose exec app npm run prisma:seed
```

Then open:

```text
http://localhost:3000
```

---

## Local Setup

### Prerequisites

- Node.js 18 or higher
- npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd team-task-manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Required environment variables:

```env
DATABASE_URL=""
JWT_SECRET=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

| Variable | Purpose |
|---|---|
| DATABASE_URL | PostgreSQL connection string used by Prisma |
| JWT_SECRET | Secret key used to sign JWT tokens |
| NEXT_PUBLIC_APP_URL | Public application URL |

### 4. Generate Prisma client

```bash
npx prisma generate
```

### 5. Apply database migrations

For local development:

```bash
npx prisma migrate dev
```

For production-like environments:

```bash
npx prisma migrate deploy
```

### 6. Seed demo data

```bash
npm run prisma:seed
```

### 7. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Demo Credentials

After running the seed command, the demo users can be used for testing:

| Role | Email | Password |
|---|---|---|
| Admin | bharat.patidar@ethara.ai | Bharat@12345 |
| Member | ravi.singhal033@ethara.ai | Ravi@12345 |

The seeded data includes demo projects, project memberships, and sample tasks to test dashboard, RBAC, task assignment, and notification workflows.

---

## API Overview

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create a new user |
| POST | `/api/auth/login` | Login and set auth cookie |
| POST | `/api/auth/logout` | Logout and clear auth cookie |
| GET | `/api/auth/me` | Get current authenticated user |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Get dashboard analytics and summaries |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications?countOnly=1` | Get lightweight notification count |
| GET | `/api/notifications` | Get full notification lists |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List user projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:projectId` | Get project details |
| PATCH | `/api/projects/:projectId` | Update project, admin only |
| DELETE | `/api/projects/:projectId` | Delete project, admin only |

### Members

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:projectId/members` | List project members |
| POST | `/api/projects/:projectId/members` | Add member by email, admin only |
| PATCH | `/api/projects/:projectId/members/:memberId` | Update member role, admin only |
| DELETE | `/api/projects/:projectId/members/:memberId` | Remove member, admin only |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:projectId/tasks` | List project tasks with filters |
| POST | `/api/projects/:projectId/tasks` | Create task, admin only |
| GET | `/api/tasks/:taskId` | Get task details |
| PATCH | `/api/tasks/:taskId` | Update task based on role rules |
| DELETE | `/api/tasks/:taskId` | Delete task, admin only |

---

## Railway Deployment

### 1. Push code to GitHub

```bash
git add .
git commit -m "Prepare production deployment"
git push origin main
```

### 2. Create Railway project

- Open Railway
- Create a new project
- Select Deploy from GitHub repo
- Choose this repository

### 3. Add PostgreSQL

- Add a Railway PostgreSQL service
- Copy or reference the PostgreSQL `DATABASE_URL`

### 4. Add environment variables

Set these variables in the Railway app service:

```env
DATABASE_URL=""
JWT_SECRET=""
NEXT_PUBLIC_APP_URL=""
```

### 5. Configure Railway commands

| Railway Setting | Value |
|---|---|
| Build Command | `npm run build` |
| Pre-deploy Command | `npm run prisma:migrate` |
| Start Command | `npm run start` |

### 6. Generate public URL

In Railway Networking settings:

- Generate a public domain
- Copy the live URL
- Set `NEXT_PUBLIC_APP_URL` to that live URL

### 7. Seed production demo data, optional

Run this only if demo data is required in the deployed app:

```bash
npm run prisma:seed
```

---

## NPM Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start local development server |
| `npm run build` | Generate Prisma client and build Next.js app |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Apply production migrations |
| `npm run prisma:seed` | Seed demo data |

---

## Manual Testing Checklist

### Authentication

- Signup validates email and password
- Login with wrong password returns 401
- Logout clears the session
- `/api/auth/me` returns 401 without cookie
- Protected pages redirect logged-out users to login

### Projects and Members

- Users see only projects where they are members
- Admin can update and delete projects
- Admin can invite members by email
- Duplicate member invite is blocked
- Last admin cannot be removed
- Last admin cannot be demoted

### Tasks

- Admin can create, update, assign, and delete tasks
- Task assignee must be a project member
- Member can update only assigned task status
- Member cannot update title, description, priority, assignee, or due date
- Non-assignee member cannot update another user’s task
- Invalid task filters return validation errors

### Dashboard and Notifications

- Dashboard loads KPI cards successfully
- Dashboard does not show retry UI when API returns 200
- Route navigation does not repeatedly refetch dashboard data
- Notification badge uses count-only API
- Notifications page shows assigned, due soon, and overdue items

---

## Security Notes

- `.env` must never be committed to GitHub
- Use a strong `JWT_SECRET`
- Rotate database credentials if they are accidentally exposed
- Keep local and production database credentials separate
- Do not expose `passwordHash` in API responses
- Use HTTP-only cookies for authentication
- Validate request bodies and query parameters with Zod

---

## Folder Structure

```text
src/
  app/
    api/
    dashboard/
    notifications/
    profile/
    projects/
    tasks/
  components/
  lib/
prisma/
  schema.prisma
  seed.ts
public/
```

Important files:

| File | Purpose |
|---|---|
| `src/lib/auth.ts` | Authentication helpers |
| `src/lib/jwt.ts` | JWT signing and verification |
| `src/lib/auth-cookie.ts` | Cookie helpers |
| `src/lib/project-access.ts` | Project role and membership checks |
| `src/lib/prisma.ts` | Prisma singleton |
| `src/lib/dashboard-aggregate.ts` | Optimized dashboard aggregation |
| `src/lib/validation.ts` | Zod schemas |
| `src/middleware.ts` | Protected route middleware |
| `prisma/schema.prisma` | Database schema |
| `prisma/seed.ts` | Demo data seed |

---

## Submission Notes

This project demonstrates:

- Production-style full-stack development
- Secure authentication and authorization
- Project-level role-based access control
- PostgreSQL schema design with Prisma
- API validation and clean error handling
- Performance optimization for dashboard data
- Docker-ready contribution workflow
- Railway deployment readiness
- Clean and user-friendly interface

The application is ready for GitHub submission and Railway deployment after environment variables are configured correctly.
