# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

| Layer    | Technology                                          |
| -------- | --------------------------------------------------- |
| Frontend | React 19 + Vite + React Router v7 + TypeScript + Tailwind v4 |
| Backend  | NestJS 11 + TypeScript                              |
| Database | PostgreSQL + Prisma 7 (with `@prisma/adapter-pg`)   |
| Auth     | JWT dual-token + Google OAuth (Passport.js)         |
| UI       | shadcn/ui + HugeIcons + Lucide                      |
| Monorepo | Turborepo + pnpm workspaces                         |

## Commands

```bash
# Root — runs both apps concurrently via Turborepo
pnpm dev
pnpm build

# API only (apps/api)
pnpm dev           # nest start --watch
pnpm test          # jest (unit tests in src/**/*.spec.ts)
pnpm test:e2e      # jest --config ./test/jest-e2e.json
pnpm test:cov      # coverage
pnpm lint          # eslint --fix
pnpm format        # prettier --write

# Web only (apps/web)
pnpm dev           # next dev
pnpm build         # next build
pnpm lint          # eslint

# Prisma (run from apps/api)
npx prisma generate          # regenerates client to prisma/generated/prisma/client
npx prisma migrate dev       # create + apply migration
npx prisma migrate deploy    # apply migrations in production
npx prisma studio            # DB GUI
```

## Architecture

### Monorepo
Turborepo orchestrates `dev` and `build`. Each app has its own `pnpm-lock.yaml` and dependencies. The root `package.json` only has `turbo` as a dev dependency.

### Frontend (`apps/web`)
Vite + React SPA with feature-first structure:
- `src/` — entry point (`main.tsx`, `App.tsx`), `pages/` (route components), `routes/` (`ProtectedRoute`).
- `features/<domain>/` — business logic: `actions/` (API calls), `components/`, `hooks/`, `types.ts`.
- `shared/` — cross-feature: `lib/api.ts` (fetch wrapper), `lib/auth.ts` (in-memory token store), `components/` (layout, UI), `types/`.

Routing is handled by React Router v7 (`BrowserRouter`) in `App.tsx`. `ProtectedRoute` wraps private routes and redirects to `/login` if no access token. The `Sidebar` is rendered inside the protected layout via `Outlet`.

### Backend (`apps/api`)
Standard NestJS module structure: `AuthModule`, `UsersModule`, `PrismaModule`. Each module follows the controller → service → Prisma pattern.

Prisma client is generated into `prisma/generated/prisma/client` (non-standard path). Always import from there, not from `@prisma/client`.

The `datasource url` is not in `schema.prisma` — it's defined in `prisma.config.ts` via `process.env.DATABASE_URL`.

### Auth flow
- `accessToken`: JWT signed with `JWT_SECRET`, 15-minute lifetime, stored in JS memory (never persisted).
- `refreshToken`: 128-char hex string, hashed with bcrypt and stored in `RefreshToken` table, sent as `httpOnly` cookie (7-day TTL).
- On app mount, `AuthProvider` calls `/auth/refresh` silently to restore the in-memory access token.
- `AuthTasks` (cron, daily at 1AM) purges expired refresh tokens from the DB.
- Google OAuth: API redirects to `FRONT_URL/oauth/callback?token=<accessToken>` after success; the callback page stores the token in memory and redirects to `/`.

### Prisma schema key points
- `User` → `AuthProvider[]` (one per provider: `local`, `google`) + `RefreshToken[]`.
- A user can have both a local password and a Google login linked to the same account.
- Refresh tokens are hashed — the raw token is never stored.

## Environment variables

**`apps/api/.env`**
```
DATABASE_URL=postgresql://user:password@localhost:5432/boilerplate
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
PORT=3001
FRONT_URL=http://localhost:3000
```

**`apps/web/.env.local`**
```
VITE_API_URL=http://localhost:3001
```
