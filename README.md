
# Ethara WorkBoard

> Project, task, and team tracking for AI operations.

<p align="center">
  <a href="https://team-task-manager-production-575e.up.railway.app">
    <strong>🚀 Live Demo</strong>
  </a>
  ·
  <a href="https://github.com/ravisinghal033/team-task-manager">
    <strong>GitHub Repository</strong>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2.35-black?style=for-the-badge&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/PostgreSQL-Railway-4169E1?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Deployment-Railway-7B3FE4?style=for-the-badge&logo=railway" />
</p>

---

## 📌 Overview

**Ethara WorkBoard** is a full-stack team task management platform built for the internal Full-Stack Developer assessment.

The app helps teams create projects, manage members, assign tasks, track project progress, monitor overdue work, and enforce project-level **Admin/Member role-based access control**.

It is designed around realistic AI operations workflows, including demo projects such as:

- **Ethara AI - Kaijus**
- **Ethara AI - Talos**
- **Ethara AI - Vindex**
- **Ethara AI - Educational AI Validation System**

These workflows demonstrate task tracking for AI evaluation, dataset preparation, prompt validation, trajectory review, and delivery management.

---

## 🔗 Live Links

| Resource | Link |
|---|---|
| Live Application | https://team-task-manager-production-575e.up.railway.app |
| GitHub Repository | https://github.com/ravisinghal033/team-task-manager |

---

## ✅ Assignment Alignment

| Requirement | Status |
|---|---|
| Authentication: Signup/Login | ✅ Completed |
| Project creation and management | ✅ Completed |
| Team/member management | ✅ Completed |
| Task creation and assignment | ✅ Completed |
| Task status tracking | ✅ Completed |
| Dashboard with task, status, and overdue tracking | ✅ Completed |
| REST APIs | ✅ Completed |
| SQL database with relationships | ✅ Completed |
| Validations | ✅ Completed |
| Role-based access control: Admin/Member | ✅ Completed |
| Railway deployment | ✅ Completed |
| README and demo flow | ✅ Completed |

---

## ✨ Key Features

### 🔐 Authentication and Security

- Public signup for any unique email.
- Secure login and logout.
- Password hashing with **bcrypt**.
- JWT authentication stored in **HTTP-only cookies**.
- Protected routes for dashboard, projects, tasks, notifications, and profile.
- API responses never expose `passwordHash`.

### 📁 Project Management

- Any authenticated user can create a project.
- Project creator automatically becomes **ADMIN** for that project.
- Project admins can update project details.
- Users can access only projects where they are members.

### 👥 Team Management

- Admins can add teammates by email.
- Users must sign up before they can be added to a project.
- Project roles are managed per project: **ADMIN** or **MEMBER**.
- The app prevents removing or demoting the final project admin.

### ✅ Task Management

- Admins can create, edit, assign, and delete tasks.
- Tasks include title, description, status, priority, due date/time, assignee, creator, and project.
- Tasks can only be assigned to existing project members.
- Members can update only the status of tasks assigned to them.
- Members cannot edit restricted fields such as title, description, priority, due date, assignee, project, or creator.

### 📊 Role-Aware Dashboard

- Admin dashboard focuses on projects, created tasks, overdue work, and team workload.
- Member dashboard focuses on assigned tasks, due soon tasks, overdue work, and completed tasks.
- Project progress is calculated from real task status.
- Tasks are sorted by urgency: overdue, priority, due date, status, and recency.

### 🔔 Notifications and Profile

- Notifications page shows task-related alerts, due soon items, and overdue work.
- Profile page displays user information and project role context.
- Navbar includes active navigation, notification count, and profile access.

### 🚀 Production Polish

- Deployed live on Railway.
- PostgreSQL database hosted on Railway.
- Next.js upgraded to a secure patched version.
- Optimized dashboard data loading.
- Clean empty states and loading screens.
- Professional dark SaaS-style interface.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js REST API Routes |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Authentication | JWT, HTTP-only cookies, bcrypt, jose |
| Deployment | Railway |
| Version Control | Git + GitHub |

---

## 🖼️ Screenshots

> Recommended: create a `docs/images/` folder and add your screenshots there.

### Dashboard

![Dashboard Screenshot](./docs/images/dashboard.png)

### Project Detail

![Project Detail Screenshot](./docs/images/project-detail.png)

### Task Detail

![Task Detail Screenshot](./docs/images/task-detail.png)

### Profile and Notifications

![Profile Screenshot](./docs/images/profile.png)

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    User[User Browser] --> UI[Next.js App Router UI]

    UI --> AuthAPI[Auth API Routes]
    UI --> ProjectAPI[Project API Routes]
    UI --> TaskAPI[Task API Routes]
    UI --> DashboardAPI[Dashboard API Route]
    UI --> NotificationAPI[Notification API Route]

    AuthAPI --> AuthLogic[JWT + HTTP-only Cookie Auth]
    ProjectAPI --> RBAC[Project-Level RBAC]
    TaskAPI --> RBAC
    DashboardAPI --> Aggregation[Dashboard Aggregation]
    NotificationAPI --> Notifications[Task-Based Notifications]

    AuthLogic --> Prisma[Prisma ORM]
    RBAC --> Prisma
    Aggregation --> Prisma
    Notifications --> Prisma

    Prisma --> DB[(Railway PostgreSQL)]

    subgraph Railway Deployment
      App[Railway App Service]
      Database[Railway PostgreSQL Service]
    end

    App --> UI
    Database --> DB
````

---

## 🔄 User Workflow

```mermaid
sequenceDiagram
    actor Admin
    actor Member
    participant App as Ethara WorkBoard
    participant API as REST API
    participant DB as PostgreSQL

    Admin->>App: Signup/Login
    App->>API: Authenticate user
    API->>DB: Verify credentials
    API-->>App: Set HTTP-only JWT cookie

    Admin->>App: Create project
    App->>API: POST /api/projects
    API->>DB: Create project + ADMIN membership

    Admin->>App: Add member by email
    App->>API: POST /api/projects/:id/members
    API->>DB: Add project member

    Admin->>App: Create and assign task
    App->>API: POST /api/projects/:id/tasks
    API->>DB: Save task with assignee

    Member->>App: View assigned work
    App->>API: GET /api/dashboard
    API->>DB: Fetch assigned tasks
    API-->>App: Member dashboard

    Member->>App: Update task status
    App->>API: PATCH /api/tasks/:taskId
    API->>DB: Update status only
```

---

## 🗄️ Database Model

```mermaid
erDiagram
    User ||--o{ ProjectMember : belongs_to
    Project ||--o{ ProjectMember : has
    Project ||--o{ Task : contains
    User ||--o{ Task : creates
    User ||--o{ Task : assigned_to

    User {
        string id
        string name
        string email
        string passwordHash
        datetime createdAt
        datetime updatedAt
    }

    Project {
        string id
        string name
        string description
        string createdById
        datetime createdAt
        datetime updatedAt
    }

    ProjectMember {
        string id
        string projectId
        string userId
        enum role
    }

    Task {
        string id
        string title
        string description
        enum status
        enum priority
        datetime dueDate
        string projectId
        string assigneeId
        string createdById
        datetime createdAt
        datetime updatedAt
    }
```

---

## 🛡️ Role-Based Access Control

### ADMIN

A project admin can:

* Update project details.
* Delete the project.
* Add or remove project members.
* Change member roles.
* Create tasks.
* Edit all task fields.
* Delete tasks.
* Assign tasks to project members.
* View project progress and team workload.

### MEMBER

A project member can:

* View projects they belong to.
* View project tasks.
* Update the status of tasks assigned to them.

A project member cannot:

* Delete or edit a project.
* Manage project members.
* Create project tasks unless promoted to admin.
* Edit restricted task fields.
* Update tasks assigned to another user.

### Safety Rule

The final admin of a project cannot be removed or demoted.

---

## 📡 API Routes

### Authentication

| Method | Route              | Description          |
| ------ | ------------------ | -------------------- |
| POST   | `/api/auth/signup` | Create a new account |
| POST   | `/api/auth/login`  | Login user           |
| POST   | `/api/auth/logout` | Clear auth cookie    |
| GET    | `/api/auth/me`     | Get current user     |

### Dashboard and Notifications

| Method | Route                | Description               |
| ------ | -------------------- | ------------------------- |
| GET    | `/api/dashboard`     | Role-aware dashboard data |
| GET    | `/api/notifications` | Task-based notifications  |

### Projects

| Method | Route                      | Description        |
| ------ | -------------------------- | ------------------ |
| GET    | `/api/projects`            | List user projects |
| POST   | `/api/projects`            | Create project     |
| GET    | `/api/projects/:projectId` | Get project detail |
| PATCH  | `/api/projects/:projectId` | Update project     |
| DELETE | `/api/projects/:projectId` | Delete project     |

### Members

| Method | Route                                        | Description          |
| ------ | -------------------------------------------- | -------------------- |
| GET    | `/api/projects/:projectId/members`           | List project members |
| POST   | `/api/projects/:projectId/members`           | Add project member   |
| PATCH  | `/api/projects/:projectId/members/:memberId` | Update member role   |
| DELETE | `/api/projects/:projectId/members/:memberId` | Remove member        |

### Tasks

| Method | Route                            | Description        |
| ------ | -------------------------------- | ------------------ |
| GET    | `/api/projects/:projectId/tasks` | List project tasks |
| POST   | `/api/projects/:projectId/tasks` | Create task        |
| GET    | `/api/tasks/:taskId`             | Get task detail    |
| PATCH  | `/api/tasks/:taskId`             | Update task        |
| DELETE | `/api/tasks/:taskId`             | Delete task        |

---

## 📂 Folder Structure

```bash
team-task-manager/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── public/
│   └── favicon.svg
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── notifications/
│   │   │   ├── projects/
│   │   │   └── tasks/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── notifications/
│   │   ├── profile/
│   │   ├── projects/
│   │   ├── signup/
│   │   └── tasks/
│   │
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── AssigneeSelect.tsx
│   │   ├── AuthLayout.tsx
│   │   ├── Badges.tsx
│   │   ├── BrandMark.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingScreen.tsx
│   │   └── NavbarMenus.tsx
│   │
│   └── lib/
│       ├── auth.ts
│       ├── auth-cookie.ts
│       ├── client-fetch.ts
│       ├── dashboard-aggregate.ts
│       ├── format-date.ts
│       ├── jwt.ts
│       ├── password.ts
│       ├── prisma.ts
│       ├── project-access.ts
│       ├── request-json.ts
│       ├── task-sort.ts
│       └── validation.ts
│
├── .env.example
├── package.json
├── package-lock.json
├── tailwind.config.ts
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have:

* Node.js 18+
* npm
* PostgreSQL database
* Git

---

## 🧑‍💻 Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/ravisinghal033/team-task-manager.git
cd team-task-manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file:

```bash
copy .env.example .env
```

For macOS/Linux:

```bash
cp .env.example .env
```

Add the required values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your-long-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Generate Prisma client

```bash
npm run prisma:generate
```

### 5. Apply database migrations

```bash
npm run prisma:migrate
```

### 6. Seed demo data

```bash
npm run prisma:seed
```

### 7. Start development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🧾 Available Scripts

| Script                    | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `npm run dev`             | Start local development server                  |
| `npm run build`           | Generate Prisma client and build production app |
| `npm run start`           | Start production server                         |
| `npm run lint`            | Run Next.js linting                             |
| `npm run typecheck`       | Run TypeScript checks                           |
| `npm run prisma:generate` | Generate Prisma client                          |
| `npm run prisma:migrate`  | Apply Prisma migrations                         |
| `npm run prisma:seed`     | Seed demo users, projects, and tasks            |

---

## 🚀 Railway Deployment

The app is deployed on **Railway** with Railway PostgreSQL.

### Railway Commands

| Setting            | Command                     |
| ------------------ | --------------------------- |
| Build Command      | `npm run build`             |
| Pre-deploy Command | `npx prisma migrate deploy` |
| Start Command      | `npm run start`             |

### Railway Environment Variables

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-production-secret
NEXT_PUBLIC_APP_URL=https://team-task-manager-production-575e.up.railway.app
```

After deployment, seed demo data once:

```bash
npm run prisma:seed
```

---

## 👤 Demo Accounts

Seeded demo accounts are included for assignment testing only.

| Role              | Email                       | Password       |
| ----------------- | --------------------------- | -------------- |
| Bharat Lead/Admin | `bharat.patidar@ethara.ai`  | `Bharat@12345` |
| Ravi Member       | `ravi.singhal033@ethara.ai` | `Ravi@12345`   |
| Admin Demo        | `admin@example.com`         | `Admin@12345`  |
| Member Demo       | `member@example.com`        | `Member@12345` |

---

## 🎥 Demo Flow

### Admin Flow

1. Login as Bharat.
2. Open the dashboard.
3. View project progress, team workload, overdue status, and notifications.
4. Open a project.
5. Add a project member from settings.
6. Create a task and assign it to Ravi.
7. Confirm the assignee dropdown only lists project members.
8. Update task priority, due date, assignee, and status.
9. Open notifications and profile pages.

### Member Flow

1. Login as Ravi.
2. Open the member dashboard.
3. View assigned tasks, due soon tasks, overdue tasks, and completed count.
4. Open an assigned task.
5. Update only the task status.
6. Confirm member cannot edit restricted task fields.
7. Confirm member cannot manage project settings.

---

## ✅ Testing Checklist

### Code Quality

```bash
npm run lint
npm run typecheck
npm run build
npx prisma validate
```

### Functional Checks

* Signup works with a unique email.
* Duplicate signup is rejected.
* Login works with valid credentials.
* Logout clears the session.
* Dashboard loads after login.
* Project creation works.
* Project creator becomes admin.
* Admin can add/remove members.
* Admin can create/edit/delete tasks.
* Admin cannot remove or demote the final admin.
* Member can view assigned work.
* Member can update only assigned task status.
* Member cannot edit restricted task fields.
* Assignee dropdown shows only project members.
* Project progress updates when task status changes.
* Notifications link to task details.
* Profile page shows user details and role context.

---

## 🔒 Security Notes

* Passwords are hashed with bcrypt.
* Auth is handled with JWT stored in HTTP-only cookies.
* Protected APIs validate authentication and project membership.
* Members cannot access projects they do not belong to.
* Members cannot modify restricted task fields.
* `passwordHash` is never returned in API payloads.
* `.env` must not be committed.
* Database credentials must never be exposed publicly.
* Demo credentials are for testing only.

---

## ⚡ Performance Notes

* Dashboard data is aggregated efficiently to avoid excessive database calls.
* Prisma uses a singleton client in development.
* Notifications are derived from existing task data.
* Railway PostgreSQL is used for production deployment.
* For remote Railway database usage during local development, optional connection tuning can be added to `DATABASE_URL`:

```env
connection_limit=3&pool_timeout=30&connect_timeout=10
```

---

## 🗺️ Roadmap

Potential future improvements:

* Email invitations.
* Persistent read/unread notifications.
* Task comments.
* Activity logs.
* File attachments.
* Team analytics.
* Audit trail for role changes.
* Optional light/dark theme toggle.
* Dockerized production setup.
* CI/CD checks with GitHub Actions.

---

## 🎨 Optional README Visual Prompts

### Hero Banner Prompt

```text
Create a modern SaaS dashboard hero banner for a project management app named "Ethara WorkBoard". Show a dark navy interface with project cards, task progress bars, notification indicators, and team avatars. Style should be professional, clean, minimal, and suitable for a GitHub README. Use cyan and blue accents. No text except "Ethara WorkBoard".
```

### Architecture Illustration Prompt

```text
Create a clean full-stack architecture illustration for a Next.js project management app. Include browser UI, Next.js API routes, JWT authentication, Prisma ORM, PostgreSQL database, and Railway deployment. Use a modern flat technical diagram style with dark navy background and cyan highlights. Make it suitable for GitHub documentation.
```

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Open a pull request.

```bash
git checkout -b feature/your-feature-name
git commit -m "Add your feature"
git push origin feature/your-feature-name
```

---

## 📄 License

This project is available for educational and assessment purposes.

If you plan to open-source it publicly, add an appropriate license such as MIT.

---

## 👨‍💻 Author

**Ravi Singhal**

* GitHub: [https://github.com/ravisinghal033](https://github.com/ravisinghal033)
* Email: [ravi.singhal033@ethara.ai](mailto:ravi.singhal033@ethara.ai)
* Live App: [https://team-task-manager-production-575e.up.railway.app](https://team-task-manager-production-575e.up.railway.app)

---

<p align="center">
  Built with Next.js, Prisma, PostgreSQL, Tailwind CSS, and Railway.
</p>
```

After copying this into `README.md`, run:

```powershell
cd C:\Users\Hp\team-task-manager
git add README.md
git commit -m "Improve GitHub README"
git push origin main
```
