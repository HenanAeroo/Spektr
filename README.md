# Spektr

Application-tracking and document-management platform for students supported by the Relation Entreprises (RE) team at Rennes Ynov Campus.

---

## Tech stack

| Layer      | Technology                                       |
| ---------- | ------------------------------------------------ |
| Frontend   | React 19 + Vite + React Router v7 + TypeScript   |
| Backend    | NestJS 11 + TypeScript                           |
| Database   | PostgreSQL + Prisma 7                            |
| Auth       | JWT dual-token + Google OAuth (Passport.js)      |
| UI         | shadcn/ui + Tailwind CSS v4 + HugeIcons + Lucide |
| Storage    | Cloudflare R2 (S3-compatible, via the MinIO client) |
| Real-time  | WebSocket (Socket.io)                            |
| Email      | SMTP through Nodemailer (Brevo relay)            |
| Monorepo   | Turborepo + pnpm workspaces                      |

---

## Prerequisites

- Node.js >= 20 (CI runs on Node 22)
- pnpm >= 9
- PostgreSQL >= 14
- An S3-compatible object store — Cloudflare R2 in production, or a local MinIO instance for development

---

## Installation

```bash
git clone https://github.com/HenanAeroo/Spektr.git
cd Spektr
pnpm install
```

---

## Environment variables

### `apps/api/.env`

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/spektr

# JWT (secret must be at least 32 characters)
JWT_SECRET=your_jwt_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# App
PORT=3001
FRONT_URL=http://localhost:3000
NODE_ENV=development

# Object storage (Cloudflare R2 / S3-compatible)
R2_ENDPOINT=localhost
R2_PORT=9000
R2_USE_SSL=false
R2_ACCESS_KEY=your_access_key
R2_SECRET_KEY=your_secret_key
R2_BUCKET=spektr-documents

# Email (SMTP — Brevo relay)
SMTP_USER=your_smtp_login
SMTP_PASS=your_smtp_key
SMTP_FROM=no-reply@your-domain.com
```

### `apps/web/.env.local`

```env
VITE_API_URL=http://localhost:3001
```

---

## Running the project

```bash
# From the repo root — starts the frontend and backend in parallel
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## Database

```bash
cd apps/api

# Generate the Prisma client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev

# Visual database browser
npx prisma studio
```

---

## Architecture

```
Spektr/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # React + Vite frontend
├── turbo.json
└── package.json
```

### Frontend — feature-first (`apps/web/`)

```
apps/web/
├── src/
│   ├── pages/        # route components (login, home, applications, documents, profile)
│   └── routes/       # ProtectedRoute
├── features/         # per-domain business logic (actions/, components/, hooks/, types.ts)
│   ├── applications/
│   ├── documents/
│   ├── folders/
│   ├── notifications/
│   ├── objectives/
│   ├── promos/
│   ├── admin/
│   ├── profile/
│   └── auth/
└── shared/
    ├── lib/          # api.ts (fetch wrapper), auth.ts (in-memory token store)
    ├── hooks/        # cross-feature hooks (useFocusTrap, useRole…)
    ├── components/   # layout, sidebar, reusable UI
    └── types/
```

### Backend — NestJS modules (`apps/api/src/`)

| Module           | Responsibility                                              |
| ---------------- | ----------------------------------------------------------- |
| `auth`           | JWT dual-token, Google OAuth, register/login/refresh/logout |
| `users`          | User profiles, account management, student CSV import       |
| `applications`   | Application tracking (status, company, contacts, dates, outcome) |
| `documents`      | File upload/download (R2), admin review workflow, status audit trail |
| `folders`        | Organizing documents into folders                           |
| `notifications`  | Real-time (WebSocket) and email notifications               |
| `communications` | Messages between RE staff and students                      |
| `objectives`     | Monthly objectives per promo + per-student completion       |
| `promos`         | Cohort (promo) management + promo-based access control      |
| `events`         | WebSocket gateway (Socket.io)                               |
| `mail`           | Transactional email (Nodemailer / Brevo SMTP relay)         |
| `minio`          | S3-compatible object storage client (Cloudflare R2)         |
| `prisma`         | Database access                                             |

**Roles:** `SUPER_ADMIN`, `ADMIN`, `STUDENT`. Admin access to a promo is scoped per cohort, with `OWNER` and `COLLABORATOR` levels.

---

## Authentication

| Method       | Route                 |
| ------------ | --------------------- |
| Register     | `POST /auth/register` |
| Login        | `POST /auth/login`    |
| Refresh      | `POST /auth/refresh`  |
| Logout       | `POST /auth/logout`   |
| Google OAuth | `GET /auth/google`    |

**JWT dual-token strategy:**

- `accessToken` → kept in JS memory (15 min)
- `refreshToken` → httpOnly cookie (7 days), hashed in the database
- Silent refresh on app mount via `AuthProvider`
- `AuthTasks` (daily cron at 1 AM) purges expired refresh tokens

**Google OAuth:** after a successful sign-in the API redirects to `FRONT_URL/oauth/callback?token=<accessToken>`; the callback page stores the token in memory and redirects to `/`.

---

## Features

- **Applications** — creation and tracking by status (_To contact_, _Sent_, _Followed up_, _In discussion_, _Positive response_, _Rejected_) and outcome (_Reminder_, _No response_, _Interview_, _Landed_).
- **Documents** — upload/download organized in folders and stored on Cloudflare R2; admin review (_validate_ / _to correct_), with a PostgreSQL trigger recording every status change into an audit table.
- **Objectives** — monthly objectives defined per promo, with per-student completion tracking.
- **Communications** — messages exchanged between RE staff and students.
- **Promos** — cohort management with role-based access (super admin / admin / student; promo owner / collaborator).
- **Notifications** — real-time (WebSocket) and email alerts on document uploads and status changes.
- **Profile** — user information management.
- **Dark mode** — toggle in the sidebar.
- **Rate limiting** — 30 req/60s globally (`@nestjs/throttler`), with tighter per-route limits on sensitive endpoints (10/60s on auth, down to 3/60s on account and CSV-import routes).

---

## Tests

```bash
# Backend
cd apps/api && pnpm test          # Jest (unit)
cd apps/api && pnpm test:e2e      # Jest e2e
cd apps/api && pnpm test:cov      # coverage

# Frontend
cd apps/web && pnpm test          # Vitest
```

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request to `master` — a single `ci` job on Node 22:

- installs dependencies (`pnpm install --frozen-lockfile`)
- lints and type-checks the frontend
- generates the Prisma client, then lints the backend
- runs the backend test suite (Jest)
