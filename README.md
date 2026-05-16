Ethara WorkBoard
=================

Project, task, and team tracking for AI operations.

Ethara WorkBoard is a full-stack Team Task Manager built for the internal Full-Stack Developer assignment. It allows users to sign up, create projects, manage project members, assign tasks, track task progress, and enforce project-level Admin/Member access control.

Live Application URL: <PASTE_RAILWAY_LIVE_URL_HERE>
GitHub Repository: <PASTE_GITHUB_REPOSITORY_URL_HERE>

------------------------------------------------------------
1. Assignment Alignment
------------------------------------------------------------

Required Feature                                    Status
--------------------------------------------------  --------
Authentication: Signup/Login                        Completed
Project creation and management                     Completed
Team/member management                              Completed
Task creation and assignment                        Completed
Task status tracking                                Completed
Dashboard with tasks/status/overdue tracking        Completed
REST APIs                                           Completed
Database with relationships                         Completed
Validations                                         Completed
Role-based access control: Admin/Member             Completed
Railway deployment readiness                        Completed
README and demo flow                                Completed
Docker/contributor setup                            Included if Docker files are present

------------------------------------------------------------
2. Project Summary
------------------------------------------------------------

Ethara WorkBoard is designed like a production-style internal workspace for AI operations teams. It supports company-style workflows where a project lead can create projects, add teammates, assign tasks, and monitor progress.

The app includes realistic demo projects such as:

- Ethara AI - Kaijus
- Ethara AI - Talos
- Ethara AI - Vindex

These demo projects show task workflows around AI evaluation, dataset preparation, prompt enhancement, trajectory work, and quality review.

------------------------------------------------------------
3. Key Features
------------------------------------------------------------

Authentication and Security

- Public signup for any unique email.
- Secure login/logout.
- Passwords are hashed using bcrypt.
- Authentication uses JWT stored in secure HTTP-only cookies.
- Protected routes for dashboard, projects, and task pages.
- API responses never expose password hashes.

Project Management

- Any signed-in user can create a project.
- The project creator automatically becomes ADMIN for that project.
- Project admins can update project details and manage project members.
- Members can only access projects they belong to.

Team Management

- Admins can add teammates by email.
- Users must sign up before they can be added to a project.
- Project roles are managed per project: ADMIN or MEMBER.
- The app prevents removing or demoting the last ADMIN of a project.

Task Management

- Admins can create, edit, assign, and delete tasks.
- Tasks include title, description, status, priority, due date/time, assignee, creator, and project.
- Tasks can only be assigned to existing project members.
- Members can update only the status of tasks assigned to them.
- Members cannot edit title, description, priority, due date, assignee, project, or creator.

Dashboard

- Role-aware dashboard for ADMIN and MEMBER users.
- Admin-focused view shows project progress, created/assigned team work, overdue tasks, and workload summary.
- Member-focused view shows assigned work, due soon tasks, overdue tasks, and completion progress.
- Project progress is calculated from actual task status.
- Tasks are sorted by urgency: overdue, high priority, due date, status, and recency.
- Notifications page shows task-related alerts, due soon items, and overdue items.

User Experience

- Polished SaaS-style UI with a professional dark-light theme.
- App branding: Ethara WorkBoard.
- Profile page with user details and project role context.
- Full notifications page instead of a small notification card.
- Loading states with branded workspace loader.
- Clean empty states for projects, tasks, assigned tasks, and notifications.

------------------------------------------------------------
4. Tech Stack
------------------------------------------------------------

Frontend

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- React components and client-side form handling

Backend

- Next.js REST API routes
- Prisma ORM
- PostgreSQL
- Zod validation
- bcrypt password hashing
- jose JWT signing/verification

Deployment and DevOps

- Railway for deployment
- Railway PostgreSQL
- Docker support for repeatable local/contributor setup
- GitHub for version control

------------------------------------------------------------
5. Database and Relationships
------------------------------------------------------------

Main entities:

User
- id
- name
- email
- passwordHash
- createdAt
- updatedAt

Project
- id
- name
- description
- createdById
- createdAt
- updatedAt

ProjectMember
- id
- projectId
- userId
- role: ADMIN or MEMBER
- unique(projectId, userId)

Task
- id
- title
- description
- status: TODO, IN_PROGRESS, DONE
- priority: LOW, MEDIUM, HIGH
- dueDate
- projectId
- assigneeId
- createdById
- createdAt
- updatedAt

Relationship rules:

- A project can have many members.
- A project can have many tasks.
- A user can belong to many projects.
- A task belongs to one project.
- A task can be assigned only to a project member.
- Project deletion cascades safely to related project members/tasks where configured.

------------------------------------------------------------
6. Role-Based Access Control
------------------------------------------------------------

ADMIN

A project ADMIN can:

- Update project details.
- Delete the project.
- Add/remove project members.
- Change member roles.
- Create tasks.
- Edit all task fields.
- Delete tasks.
- Assign tasks to project members.
- View dashboard progress and workload for administered projects.

MEMBER

A project MEMBER can:

- View projects they belong to.
- View tasks in those projects.
- Update status only for tasks assigned to them.

A project MEMBER cannot:

- Delete or edit a project.
- Manage project members.
- Create tasks unless promoted to ADMIN.
- Edit task title, description, priority, due date, assignee, project, or creator.
- Update tasks assigned to another user.

Safety rule:

- The last ADMIN of a project cannot be removed or demoted.

------------------------------------------------------------
7. API Overview
------------------------------------------------------------

Auth

POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

Dashboard

GET /api/dashboard

Notifications

GET /api/notifications

Projects

GET    /api/projects
POST   /api/projects
GET    /api/projects/:projectId
PATCH  /api/projects/:projectId
DELETE /api/projects/:projectId

Members

GET    /api/projects/:projectId/members
POST   /api/projects/:projectId/members
PATCH  /api/projects/:projectId/members/:memberId
DELETE /api/projects/:projectId/members/:memberId

Tasks

GET    /api/projects/:projectId/tasks
POST   /api/projects/:projectId/tasks
GET    /api/tasks/:taskId
PATCH  /api/tasks/:taskId
DELETE /api/tasks/:taskId

------------------------------------------------------------
8. Validation and Error Handling
------------------------------------------------------------

- Zod schemas validate all mutating API request bodies.
- Unknown fields are rejected using strict schemas.
- Invalid JSON returns a clean 400 response.
- Unauthorized requests return 401.
- Forbidden project/member actions return 403.
- Missing resources return 404.
- Invalid task assignment returns 400.
- Dashboard shows a retry state if data cannot be loaded.

------------------------------------------------------------
9. Performance and Reliability Improvements
------------------------------------------------------------

The dashboard API was optimized to reduce database load.

Improvements include:

- Reduced repeated dashboard queries.
- Avoided excessive Prisma count/groupBy calls.
- Aggregated dashboard statistics from fewer database queries.
- Added Prisma singleton usage for development.
- Added lightweight notifications.
- Added safer dashboard loading and retry state.
- Added guidance for Railway PostgreSQL connection pool tuning.

For local development with Railway PostgreSQL, a remote database can be slower than a local database. If connection pool timeout occurs, use a DATABASE_URL with connection tuning:

connection_limit=3&pool_timeout=30&connect_timeout=10

Do not commit real DATABASE_URL values.

------------------------------------------------------------
10. Local Setup
------------------------------------------------------------

1. Clone the repository:

git clone <PASTE_GITHUB_REPOSITORY_URL_HERE>
cd team-task-manager

2. Install dependencies:

npm install

3. Create environment file:

copy .env.example .env

Set the following variables:

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your-long-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

4. Generate Prisma client:

npm run prisma:generate

5. Apply migrations:

npm run prisma:migrate

6. Seed demo data:

npm run prisma:seed

7. Run development server:

npm run dev

Open:

http://localhost:3000

------------------------------------------------------------
11. Docker Setup
------------------------------------------------------------

Docker support is useful for contributors because it standardizes the development environment.

Use this section only if Dockerfile/docker-compose.yml are included in the repository.

Start the app with Docker Compose:

docker compose up --build

Stop containers:

docker compose down

Reset containers and volumes:

docker compose down -v

Typical Docker services:

- Next.js app
- PostgreSQL database

Make sure Docker environment variables match the app requirements:

DATABASE_URL
JWT_SECRET
NEXT_PUBLIC_APP_URL

If Docker files are not included in the repository, remove this section before submission or add Dockerfile and docker-compose.yml.

------------------------------------------------------------
12. Railway Deployment
------------------------------------------------------------

1. Push the repository to GitHub.
2. Open Railway.
3. Create a new project.
4. Deploy from GitHub and select this repository.
5. Add a PostgreSQL service.
6. Set the app service environment variables:

DATABASE_URL = Railway PostgreSQL DATABASE_URL
JWT_SECRET = strong random secret
NEXT_PUBLIC_APP_URL = Railway public app URL

7. Set Railway commands:

Build Command:
npm run build

Pre-deploy Command:
npm run prisma:migrate

Start Command:
npm run start

8. Generate a Railway domain.
9. Optional: run seed after deployment:

npm run prisma:seed

------------------------------------------------------------
13. Demo Credentials
------------------------------------------------------------

Seeded demo accounts for assignment testing only. These are not real company passwords.

Role                Email                         Password
------------------  ----------------------------  ------------
Bharat Lead/Admin   bharat.patidar@ethara.ai      Bharat@12345
Ravi Member         ravi.singhal033@ethara.ai     Ravi@12345
Admin Demo          admin@example.com             Admin@12345
Member Demo         member@example.com            Member@12345

------------------------------------------------------------
14. Suggested Demo Flow
------------------------------------------------------------

Admin Flow

1. Login as Bharat:
   bharat.patidar@ethara.ai / Bharat@12345

2. Open dashboard.
3. Show project progress, overdue status, team workload, and notifications.
4. Open Ethara AI - Kaijus, Ethara AI - Talos, or Ethara AI - Vindex.
5. Add a member from project settings.
6. Create a task and assign it to Ravi or another project member.
7. Show that the assignee dropdown only lists project members.
8. Edit task priority, due date, assignee, and status.
9. Open profile and notifications pages.

Member Flow

1. Login as Ravi:
   ravi.singhal033@ethara.ai / Ravi@12345

2. Open dashboard.
3. Show assigned tasks, due soon tasks, overdue tasks, and completed count.
4. Open an assigned task.
5. Update task status only.
6. Confirm member cannot edit title, description, priority, due date, assignee, or project.
7. Confirm member cannot manage project settings.

Public Signup Flow

1. Go to signup.
2. Create a new account with any unique email.
3. Create a new project.
4. Confirm the creator becomes ADMIN for that project.

------------------------------------------------------------
15. Testing Checklist
------------------------------------------------------------

Build and Code Quality

- npm run lint
- npm run typecheck
- npm run build
- npx prisma validate
- npm run prisma:seed

Authentication

- Signup with valid email/password.
- Signup rejects duplicate email.
- Login works with valid credentials.
- Login rejects wrong password.
- Logout clears session.
- Protected pages redirect when logged out.

RBAC

- Project creator becomes ADMIN.
- Admin can add/remove members.
- Admin can create/edit/delete tasks.
- Admin cannot remove/demote last ADMIN.
- Member can view assigned project/task data.
- Member can update only assigned task status.
- Member cannot manage members.
- Member cannot delete project.
- Member cannot edit restricted task fields.

Task and Dashboard

- Task assignment dropdown shows only project members.
- New member appears after being added to project.
- Task status changes update project progress.
- Overdue tasks are calculated from incomplete tasks only.
- Due dates display in readable AM/PM format.
- Notifications link to task details.
- Profile page shows user and project role context.

Deployment

- Railway build succeeds.
- Railway migration runs through pre-deploy command.
- Railway app opens with public URL.
- Database connects successfully.
- Seed data can be added if needed.

------------------------------------------------------------
16. Security Notes
------------------------------------------------------------

- Do not commit .env.
- Do not expose DATABASE_URL.
- Do not expose passwordHash.
- Rotate database credentials if they were shared accidentally.
- Use a strong JWT_SECRET in production.
- Demo credentials are only for assignment testing.

------------------------------------------------------------
17. Future Enhancements
------------------------------------------------------------

Given more time, the app can be extended with:

- Email invitations.
- Real persistent notification read/unread state.
- Activity logs.
- Task comments.
- File attachments.
- Team-level analytics.
- Audit trail for role changes.
- Optional light/dark theme switch.

------------------------------------------------------------
18. Author / Submission
------------------------------------------------------------

Built as a full-stack developer assessment project.

Candidate: Ravi Singhal
Email: ravi.singhal033@ethara.ai
Live URL: https://team-task-manager-production-575e.up.railway.app
GitHub: https://github.com/ravisinghal033/team-task-manager
