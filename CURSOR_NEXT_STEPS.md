Continue final production audit for Team Task Manager.



Run and fix:

npm run prisma:generate

npx prisma validate

npm run typecheck

npm run lint

npm run build



Check:

1\. build script should be: prisma generate \&\& next build

2\. prisma migrate deploy should not run inside build

3\. middleware should not block /login, /signup, or /

4\. MEMBER can only update status of assigned tasks

5\. MEMBER cannot edit task title, description, priority, dueDate, assignee

6\. MEMBER cannot manage project members or delete project

7\. ADMIN cannot remove or demote the last ADMIN

8\. Railway settings:

&#x20;  Build Command: npm run build

&#x20;  Pre-deploy Command: npm run prisma:migrate

&#x20;  Start Command: npm run start



After fixing, provide:

\- changed files list

\- command output summary

\- final Railway deployment steps

\- final submission checklist

