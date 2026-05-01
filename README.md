# Team Task Manager (TaskFlow)

A full-stack collaborative task management platform built with modern web technologies. Features role-based access control, project management, Kanban-style task boards, and a real-time dashboard.

## 🚀 Tech Stack

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| **Framework**  | Next.js 16 (App Router)                 |
| **Language**   | TypeScript                              |
| **Styling**    | Tailwind CSS v4 + Shadcn UI (Base Nova) |
| **Database**   | PostgreSQL (via Prisma ORM v7)          |
| **Auth**       | NextAuth.js (Credentials Provider)      |
| **Deployment** | Railway                                 |

## ✨ Features

- **Authentication** — Signup/Login with bcrypt-hashed passwords & JWT sessions
- **Role-Based Access Control** — Admin and Member roles with enforced permissions
- **Project Management** — Create projects, assign team members
- **Kanban Task Board** — Visual task management with To Do / In Progress / Done columns
- **Dashboard** — Real-time stats, completion tracking, overdue alerts
- **Dark Mode** — Premium dark UI with glassmorphism and gradient accents

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # REST API Route Handlers
│   │   ├── auth/               # NextAuth + Signup
│   │   ├── dashboard/          # Dashboard stats
│   │   ├── projects/           # Project CRUD
│   │   ├── tasks/              # Task CRUD
│   │   └── users/              # User listing
│   ├── dashboard/              # Authenticated views
│   │   ├── layout.tsx          # Sidebar + header shell
│   │   ├── page.tsx            # Dashboard stats
│   │   └── projects/           # Project list + task board
│   ├── login/                  # Login page
│   ├── signup/                 # Signup page
│   └── page.tsx                # Landing page
├── components/
│   ├── providers/              # SessionProvider
│   └── ui/                     # Shadcn UI components
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── auth-helpers.ts         # RBAC utilities
│   ├── prisma.ts               # Prisma client singleton
│   └── utils.ts                # Shadcn utilities
└── types/
    └── next-auth.d.ts          # Auth type extensions
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd team-task-manger

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET
```

### Database Setup

```bash
# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Accounts (after seeding)

| Role   | Email              | Password   |
| ------ | ------------------ | ---------- |
| Admin  | admin@example.com  | admin123   |
| Member | member@example.com | member123  |

## 🚂 Deploy to Railway

1. Push your code to a GitHub repository
2. Create a new project on [Railway](https://railway.app)
3. Add a **PostgreSQL** service
4. Connect your GitHub repo as a **Web Service**
5. Set environment variables:
   - `DATABASE_URL` — auto-injected by Railway PostgreSQL
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your Railway deployment URL (e.g., `https://your-app.up.railway.app`)
6. Deploy! Railway will auto-detect Next.js and build using nixpacks

### Post-Deploy

```bash
# Run migrations on Railway
railway run npx prisma db push

# Seed the database
railway run npx prisma db seed
```

## 📜 Available Scripts

| Script          | Description                            |
| --------------- | -------------------------------------- |
| `npm run dev`   | Start development server               |
| `npm run build` | Build for production (generates Prisma) |
| `npm start`     | Start production server                |
| `npm run lint`  | Run ESLint                             |
| `npm run db:push`    | Push Prisma schema to database    |
| `npm run db:migrate` | Create & apply a migration        |
| `npm run db:seed`    | Seed database with demo data      |
| `npm run db:studio`  | Open Prisma Studio (GUI)          |

## 🔐 API Endpoints

| Method | Endpoint                          | Auth     | Description                    |
| ------ | --------------------------------- | -------- | ------------------------------ |
| POST   | `/api/auth/signup`                | Public   | Register a new user            |
| *      | `/api/auth/[...nextauth]`         | Public   | NextAuth handlers              |
| GET    | `/api/dashboard`                  | Auth     | Dashboard statistics           |
| GET    | `/api/projects`                   | Auth     | List projects (role-scoped)    |
| POST   | `/api/projects`                   | Admin    | Create a project               |
| GET    | `/api/projects/:id`               | Auth     | Get project details + tasks    |
| PUT    | `/api/projects/:id`               | Admin    | Update project                 |
| DELETE | `/api/projects/:id`               | Admin    | Delete project (cascades)      |
| GET    | `/api/projects/:id/tasks`         | Auth     | List tasks (filterable)        |
| POST   | `/api/projects/:id/tasks`         | Admin    | Create a task                  |
| GET    | `/api/tasks/:id`                  | Auth     | Get task details               |
| PATCH  | `/api/tasks/:id`                  | Auth*    | Update task (RBAC enforced)    |
| DELETE | `/api/tasks/:id`                  | Admin    | Delete a task                  |
| GET    | `/api/users`                      | Auth     | List all users                 |

*Members can only update the status of tasks assigned to them.

## 📄 License

MIT
