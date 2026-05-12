# TaskFlow — Team Task Manager

A full-stack team task management app: create projects, invite team members, assign tasks, track progress on a kanban board, and watch a live dashboard of activity. Built with the MERN stack in TypeScript end-to-end.

---

## Highlights

- **3-tier RBAC**: Admin / Manager / Member, enforced both in routing middleware and at the controller level
- **Auth**: JWT access tokens + HttpOnly refresh cookies with silent refresh on 401
- **Projects + Tasks + Comments**: full CRUD with cross-field validation (assignee must be a project member, status → done sets `completedAt`, cascade deletes on project removal, etc.)
- **Dashboard**: status / priority charts, overdue list, recent activity, "completed this week" — all scoped to the caller's projects
- **Kanban board** with drag-and-drop status changes and optimistic UI
- **Search + filters + pagination** on projects, tasks, and users
- **Premium UI**: Tailwind + Radix primitives (shadcn-style), light + dark mode, skeleton loaders, empty states, full mobile responsiveness
- **End-to-end Zod validation** with field-level error surfacing

---

## Stack

**Server** — Node.js · Express · TypeScript · Mongoose · Zod · JWT · bcryptjs · helmet · cookie-parser · express-rate-limit · morgan
**Client** — React 18 · Vite · TypeScript · Tailwind · Radix UI · TanStack Query · React Hook Form · Zustand · Axios · Recharts · sonner · date-fns · lucide-react
**Database** — MongoDB (Atlas-ready)

---

## Project structure

```
taskManager/
├── client/                        # Vite + React + TS frontend
│   ├── src/
│   │   ├── api/                   # axios client + per-resource API modules
│   │   ├── components/
│   │   │   ├── auth/              # ProtectedRoute, RoleGate
│   │   │   ├── comments/          # CommentThread
│   │   │   ├── common/            # EmptyState, StatusPill, PriorityBadge, UserAvatar, RoleBadge, ErrorBoundary
│   │   │   ├── dashboard/         # StatCard, StatusChart, PriorityChart, OverdueList, RecentActivity
│   │   │   ├── layout/            # AppShell, Sidebar, Topbar, ThemeToggle
│   │   │   ├── projects/          # ProjectCard, ProjectForm, MembersList
│   │   │   ├── tasks/             # TaskBoard, TaskCard, TaskDialog, TaskFilters
│   │   │   └── ui/                # shadcn-style primitives (button, input, dialog…)
│   │   ├── lib/                   # cn, formatters, constants
│   │   ├── pages/                 # Login, Signup, Dashboard, Projects, ProjectDetail, Tasks, Users, Profile, NotFound
│   │   ├── schemas/               # Zod schemas mirroring the server's
│   │   ├── stores/                # zustand: auth, theme
│   │   └── types/                 # shared TypeScript types
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── server/                        # Express + TS backend
│   ├── src/
│   │   ├── config/                # env, db
│   │   ├── controllers/           # auth, users, projects, tasks, comments, dashboard
│   │   ├── middleware/            # requireAuth, requireRole, requireProjectAccess, validate, errorHandler, notFound
│   │   ├── models/                # User, Project, Task, Comment (typed Mongoose models)
│   │   ├── routes/                # Resource routers + aggregator
│   │   ├── schemas/               # Zod request validators
│   │   ├── scripts/               # inspect-and-cleanup.ts
│   │   ├── utils/                 # ApiError, asyncHandler, jwt
│   │   ├── seed.ts                # demo users + projects + tasks + comments
│   │   └── index.ts
│   └── .env.example
└── README.md
```

---

## Getting started

### 1. Prerequisites

- Node.js 20+ and npm 10+
- MongoDB — either local or a free Atlas cluster (the latter is already wired up if you keep the seeded `.env`)

### 2. Install + configure

```bash
# Server
cd server
cp .env.example .env   # then edit .env with your Mongo URI and JWT secrets
npm install

# Client
cd ../client
npm install
```

**`server/.env` keys**

| key                  | example                                                   |
|----------------------|-----------------------------------------------------------|
| `PORT`               | `4000`                                                    |
| `NODE_ENV`           | `development`                                             |
| `MONGODB_URI`        | `mongodb://127.0.0.1:27017/taskmanager` (or your Atlas URI) |
| `JWT_ACCESS_SECRET`  | any random string ≥ 32 chars                              |
| `JWT_REFRESH_SECRET` | a *different* random string ≥ 32 chars                    |
| `JWT_ACCESS_TTL`     | `15m`                                                     |
| `JWT_REFRESH_TTL`    | `7d`                                                      |
| `CLIENT_ORIGIN`      | `http://localhost:5173`                                   |
| `COOKIE_SECURE`      | `false` in dev, `true` in production over HTTPS           |

### 3. Seed demo data

```bash
cd server
npm run seed
```

This wipes the target DB and creates 7 users, 4 projects, ~18 tasks, ~10 comments.

### 4. Run

In two terminals:

```bash
# terminal 1
cd server && npm run dev      # http://localhost:4000

# terminal 2
cd client && npm run dev      # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:4000` automatically.

### Demo accounts

All accounts share the password **`Password123!`**.

| Role    | Email               |
|---------|---------------------|
| Admin   | `admin@demo.test`   |
| Manager | `maya@demo.test`    |
| Manager | `marco@demo.test`   |
| Member  | `nora@demo.test`    |
| Member  | `sam@demo.test`     |
| Member  | `theo@demo.test`    |
| Member  | `ren@demo.test`     |

---

## Roles & permissions

| Capability                        | Admin | Manager        | Member             |
|-----------------------------------|:-----:|:--------------:|:------------------:|
| Manage all users + roles          |   ✅  |        ❌      |         ❌         |
| Create project                    |   ✅  |        ✅      |         ❌         |
| View project                      |  all  | owned + member | member-of only     |
| Edit/delete project, add members  |   ✅  |  owner only    |         ❌         |
| Create task in a project          |   ✅  | if project member |      ❌         |
| Edit task (full)                  |   ✅  | owner / creator | own status + description |
| Change task status                |   ✅  | if project member | if assignee     |
| Comment on task                   |   ✅  | if project member | if project member |
| View dashboard                    | global| scoped         | scoped             |

Enforced by `requireAuth`, `requireRole`, `requireProjectAccess` middleware, plus controller-level fine-grained checks.

---

## REST API

All routes are JSON, prefixed with `/api`. Errors use a stable envelope:

```json
{ "error": { "message": "…", "code": "VALIDATION", "details": { "email": ["Invalid email"] } } }
```

### Auth

| Method | Path                | Body                                    | Notes                                          |
|--------|---------------------|-----------------------------------------|------------------------------------------------|
| POST   | `/auth/signup`      | `{ name, email, password }`             | public; creates `member`; sets refresh cookie  |
| POST   | `/auth/login`       | `{ email, password }`                   | public; sets refresh cookie                    |
| POST   | `/auth/refresh`     | (refresh cookie)                        | rotates access token                           |
| POST   | `/auth/logout`      | (refresh cookie)                        | clears cookie                                  |
| GET    | `/auth/me`          | —                                       | requires access token                          |

### Users (admin only)

| Method | Path             | Notes                              |
|--------|------------------|------------------------------------|
| GET    | `/users`         | `?q=&role=&page=&limit=`           |
| GET    | `/users/:id`     |                                    |
| PATCH  | `/users/:id`     | `{ name?, role? }`; bumps token version on role change |
| DELETE | `/users/:id`     | cannot delete the last admin / self |

### Projects

| Method | Path                                | Notes                                                 |
|--------|-------------------------------------|-------------------------------------------------------|
| GET    | `/projects`                         | `?q=&status=&page=&limit=`; scoped by membership      |
| POST   | `/projects`                         | admin/manager only                                    |
| GET    | `/projects/:id`                     | member-or-admin                                       |
| PATCH  | `/projects/:id`                     | owner or admin                                        |
| DELETE | `/projects/:id`                     | owner or admin; cascades tasks + comments             |
| POST   | `/projects/:id/members`             | owner/admin; body `{ userId }`                        |
| DELETE | `/projects/:id/members/:userId`     | owner/admin; unassigns tasks from removed user        |

### Tasks

| Method | Path                            | Notes                                                                 |
|--------|---------------------------------|-----------------------------------------------------------------------|
| GET    | `/tasks`                        | `?project=&assignee=&status=&priority=&overdue=&q=&sort=&mine=&page=&limit=` |
| POST   | `/tasks`                        | admin/manager; validates project + assignee membership                |
| GET    | `/tasks/:id`                    | scoped by project membership                                          |
| PATCH  | `/tasks/:id`                    | admin/owner/creator → all fields; assignee → status + description only |
| PATCH  | `/tasks/:id/status`             | assignee or above                                                     |
| DELETE | `/tasks/:id`                    | admin/owner/creator                                                   |

### Comments

| Method | Path                          | Notes                                       |
|--------|-------------------------------|---------------------------------------------|
| GET    | `/tasks/:taskId/comments`     | project members                             |
| POST   | `/tasks/:taskId/comments`     | project members                             |
| DELETE | `/comments/:id`               | author or admin                             |

### Dashboard

| Method | Path                  | Notes                                                           |
|--------|-----------------------|-----------------------------------------------------------------|
| GET    | `/dashboard/stats`    | counts by status & priority + overdue + completed-this-week     |
| GET    | `/dashboard/overdue`  | top 10 overdue tasks                                            |
| GET    | `/dashboard/recent`   | recent task updates + comments                                  |

---

## Data model

- **User**: `name`, `email` (unique), `password` (bcrypt, `select: false`), `role`, `avatarUrl`, `tokenVersion`
- **Project**: `name`, `description`, `owner → User`, `members → User[]`, `status` (`active`/`archived`)
- **Task**: `title`, `description`, `project → Project`, `assignee → User?`, `createdBy → User`, `status`, `priority`, `dueDate?`, `completedAt?`
- **Comment**: `task → Task`, `author → User`, `body`

Indexes: unique `email`, `owner`, `members`, `project + status`, `assignee + dueDate`, `task + createdAt`. Text indexes on `Project { name, description }` and `Task { title, description }`.

---

## Manual test walkthrough

1. Open `http://localhost:5173` → log in as `admin@demo.test`.
2. Dashboard shows stats, charts, and the overdue list.
3. Go to **Projects** → click "Website Relaunch" → drag the **Performance budget gate** card from "In Progress" to "Done" → watch it move and `completedAt` get set.
4. Open the **Settings** tab on the project → toggle archived → save → confirm the badge appears and "+ New task" disappears.
5. Sign out, sign in as `nora@demo.test` (Member). Try to click "New project" — the button is gone; hit `POST /api/projects` directly to confirm a `403`.
6. Open one of Nora's assigned tasks → change status, type a comment → confirm both succeed.
7. Sign in as admin → **Users** → change Nora's role to Manager → log out, log in as Nora → confirm the "+ New project" button now appears.
8. Toggle theme in the top bar — UI flips to dark, persists across reload.
9. Resize to mobile (Chrome DevTools, 375 px) — sidebar collapses to a drawer, kanban scrolls horizontally, task dialog adapts.

---

## Scripts

| Location | Command           | What it does                              |
|----------|-------------------|-------------------------------------------|
| server   | `npm run dev`     | start tsx watch dev server                |
| server   | `npm run seed`    | wipe target DB and reseed demo data       |
| server   | `npm run build`   | tsc → `dist/`                             |
| server   | `npm start`       | run compiled build                        |
| server   | `npm run typecheck` | tsc --noEmit                            |
| client   | `npm run dev`     | start Vite                                |
| client   | `npm run build`   | typecheck + production bundle             |
| client   | `npm run preview` | preview the production build              |

---

## Security notes

- Passwords are bcrypt-hashed with cost 10 and excluded from queries by default.
- Refresh tokens are HttpOnly cookies scoped to `/api/auth`; access tokens live in memory (Zustand), never localStorage.
- `tokenVersion` is bumped on role change so existing refresh tokens are revoked the next refresh.
- `helmet`, `cors` (origin-locked), and `express-rate-limit` on `/auth/*` are enabled by default.
- Use HTTPS in production and set `COOKIE_SECURE=true`.

---

## Deployment

Everything runs on a single **Railway** service: the Node/Express server serves both the `/api/*` routes and the compiled React app from `client/dist`. Database stays on **MongoDB Atlas**. One URL, no CORS, no cross-domain cookie config.

### 1 · Push to GitHub

```bash
cd taskManager
git init
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:<you>/<repo>.git
git push -u origin main
```

`.env` is already in `.gitignore` — credentials won't be pushed.

### 2 · Deploy to Railway

1. Sign in at **railway.app** → **New Project → Deploy from GitHub** → pick the repo.
2. In the service's **Settings → Source**, set **Root Directory** to `server`. Railway then reads `server/railway.json` and uses Nixpacks. The configured `buildCommand` builds the client first and then the server, so a single deploy produces both `client/dist` and `server/dist`.
3. In **Variables**, add:
   - `NODE_ENV=production`
   - `MONGODB_URI=<your Atlas URI>`
   - `JWT_ACCESS_SECRET=<long random string ≥ 32 chars>`
   - `JWT_REFRESH_SECRET=<a different long random string ≥ 32 chars>`
   - `JWT_ACCESS_TTL=15m`
   - `JWT_REFRESH_TTL=7d`
   - `COOKIE_SECURE=true`
   - `COOKIE_SAMESITE=lax`
   - `CLIENT_ORIGIN=https://<your-railway-domain>.up.railway.app` (filled in after step 4)
4. **Settings → Networking → Generate Domain**. Copy the URL.
5. Paste the URL into `CLIENT_ORIGIN`; Railway redeploys automatically.
6. Hit `https://<your-railway-domain>/api/health` to confirm `{"status":"ok"}`, then open `https://<your-railway-domain>/` to see the app.
7. One-time seed: open the Railway service **Shell** and run `npm run seed`. (Or run it locally pointed at the same Atlas URI.)

### 3 · Verify

- Open the Railway domain → log in as `admin@demo.test` / `Password123!`.
- Confirm dashboard, projects, tasks, and comments all work.
- Hard-refresh — you should stay signed in (the refresh-token cookie is first-party on the Railway domain).

### Common gotchas

- **Atlas connection refused**: in Atlas → **Network Access**, allow `0.0.0.0/0` (or Railway's egress IPs).
- **Health check failing on Railway**: the server reads `PORT` from env — Railway injects its own, so don't hardcode it.
- **404 on a deep-link refresh** (e.g. `/projects/abc`): the SPA fallback in `server/src/index.ts` handles this; if it doesn't, confirm the build placed files at `client/dist/index.html`.
- **Build is slow first time**: client + server install separately. Subsequent deploys use Railway's cache.

### Going split-origin later

If you ever want the API and frontend on different domains (e.g. a CDN for the static app): point the client at an absolute API URL via `VITE_API_URL`, set `COOKIE_SAMESITE=none` on the server (which forces `COOKIE_SECURE=true`), and update `CLIENT_ORIGIN` to the frontend domain.

---

## License

MIT — built as an assessment project.
