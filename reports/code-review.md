# Spektr — Code Review Report (Phase 1)

> Generated 2026-06-24 via a multi-agent review (4 parallel layer reviewers + a completeness/false-positive critic).
> Scope: code quality, architecture, correctness, performance, types, tests — **security findings are tracked separately in [`security-audit.md`](./security-audit.md)**.

## Executive Summary

Spektr is a **well-structured, genuinely mature** NestJS + React/Vite monorepo. The controller→service→Prisma layering is clean, DTO/validation coverage is good, auth is hardened (see security report), and TanStack Query is used idiomatically in most places. The debt is concentrated in three areas: **(1) one real CRITICAL runtime bug**, **(2) a total absence of database indexes**, and **(3) the lack of a shared FE↔BE contracts package**, which has already caused silent drift.

### Top findings (act first)

| # | Sev | Finding | Location |
|---|-----|---------|----------|
| be-01 | 🔴 CRITICAL | `ActivityInterceptor` reads `user.sub` (only exists on the JWT payload, not the `User` model) → `user.id` is `undefined`, throwing an **unhandled promise rejection on every authenticated request** and silently disabling `last_seen_at` + the inactivity-alert cron. | `apps/api/src/shared/interceptors/activity.interceptor.ts:20-27` |
| db-01…db-09 | 🟠 HIGH | **Zero indexes in the entire Prisma schema** — every FK (`userId`, `folderId`, `promoId`, `objectiveId`, `senderId`, `recipientId`) and every filter column (`Document.status/docType`, `RefreshToken.expires_at`, token columns) is a sequential scan. | `apps/api/prisma/schema.prisma` |
| xc-01 | 🟠 HIGH | No shared types package — ~12 Prisma enums/models are hand-duplicated in `apps/web`; `NotifType` has **already drifted** (web is missing `INACTIVITY_ALERT`, which the backend emits). | `apps/web/shared/types/index.ts` + per-feature `types.ts` |
| fe-01 | 🟠 HIGH | `apiFetch` has **no 401/refresh-and-retry flow** and assumes every 2xx has a JSON body (breaks on 204). Token-expiry mid-session fails every in-page action. | `apps/web/shared/lib/api.ts:7-30` |
| fe-03 | 🟠 HIGH | `StudentDetail` is an **838-line god component** (5 tabs, 6 queries, 2 mutations, inline markup). | `apps/web/features/admin/components/StudentDetail.tsx` |

### Tech-debt scores (0 = pristine, 100 = severe)

| Layer | Score | One-line assessment |
|-------|------:|---------------------|
| Backend (NestJS) | **42** | Solid layering & DTOs; one correctness bug, inconsistent error→HTTP mapping (no global filter), ~8 duplicated email templates. |
| Frontend (React) | **52** | Consistent data layer undermined by ~41 copy-paste action files, a thin fetch wrapper, and an `any[]`-typed god-component admin area. |
| Database (Prisma) | **62** | **No indexes at all**, a few N+1 loops, unpaginated list endpoints, multi-write flows without transactions. |
| Cross-cutting | **58** | `strict` on but `noUncheckedIndexedAccess` off & API lint disables `no-unsafe-*`; no shared contracts; thin CI/turbo pipeline; committed build artifacts. |

### Disposition of fixes (per mission rules: apply LOW/MEDIUM, flag HIGH/CRITICAL)

- ✅ **Applied directly in this pass** (safe, mechanical): be-01, be-05, be-10, db-01…db-09 (indexes + migration), xc-02, xc-05, xc-06, xc-08, fe-08, xc-10. See [`refactor-summary.md`](./refactor-summary.md) for the exact diff list. (fe-13 was reverted — see its row.)
- 🚩 **Flagged for Phase 3** (HIGH/CRITICAL or behavior/architecture changes): be-02/INJ-01 (feedback DTO — also applied as a security fix), be-03 (email-template extraction), be-13 (global exception filter), fe-01/fe-02 (apiFetch refresh + token plumbing), fe-03/fe-05/fe-06 (admin component decomposition), xc-01 (`packages/types`), xc-03 (re-enable lint rules), xc-04 (CI gates), db-10…db-14 (N+1, pagination, transactions).

---

## Backend (NestJS) — score 42/100

> Clear controller→service→Prisma layering, good DTO coverage, consistent `ParseIntPipe` in most controllers, global `ValidationPipe` + `Throttler`. Debt: one correctness bug, one validation hole, ~8 duplicated email templates, inconsistent error handling, a few residual smells.

| ID | Sev | File:Line | Finding | Recommended fix | Status |
|----|-----|-----------|---------|-----------------|--------|
| be-01 | 🔴 CRITICAL | `shared/interceptors/activity.interceptor.ts:20-27` | Reads `user.sub` (undefined on `User`) → `prisma.user.update({ where: { id: undefined }})` throws; fired with bare `void` (no `.catch`) → unhandled rejection on every authenticated request; `last_seen_at` never updates, breaking `UsersTasks.handleInactivityAlert`. | Use `user.id`; add `.catch(() => {})`. | ✅ Applied |
| be-02 | 🟡 MEDIUM¹ | `users/users.controller.ts:119-144` | `sendFeedback` uses an inline `@Body() body: { score; comment }` type → carries no class-validator metadata → global `ValidationPipe` cannot validate/strip it. Only controller body in the codebase without a DTO. | Add `SendFeedbackDto` (`@IsInt @Min(0) @Max(4)`, `@IsString @IsOptional @MaxLength`). | ✅ Applied (see INJ-01) |
| be-03 | 🟠 HIGH | `notifications/notifications.service.ts:75-129` | Same email shell hand-copied into ~8 inline templates across 3 services (notifications×5, auth×2, users×1); markup already drifted. | Extract a shared `EmailLayout.wrap(title, body)` provider. | 🚩 Phase 3 |
| be-04 | 🟡 MEDIUM | `documents/documents.service.ts:89-116` | `review()` calls `update({ where: { id }})` with no existence check → P2025 surfaces as 500 (vs 404 elsewhere). Same in objectives/promos update/remove. | Pre-fetch + `NotFoundException`, or add a global Prisma exception filter (be-13). | 🚩 Phase 3 |
| be-05 | 🟡 MEDIUM | `app.module.ts:58` | `MinioService` provided at app root but only `DocumentsService` (which already declares it) uses it → second unused instance, obscured ownership. Also missing `implements OnModuleInit`. | Remove from `AppModule` providers; keep in `DocumentsModule`. | ✅ Applied |
| be-06 | 🟡 MEDIUM | `events/guards/ws-jwt.guard.ts:1-31` | `WsJwtGuard` is registered in `EventsModule` but `@UseGuards(WsJwtGuard)` appears nowhere; gateway does its own inline verification → dead, drift-prone duplicate. | Delete the guard, or apply it and drop the inline verify. | 🚩 Phase 3 |
| be-07 | 🟡 MEDIUM | `auth/auth.service.ts:381-419` | `resetPassword` updates the password then separately clears the reset token (no transaction) — partial failure leaves the single-use token valid. `validateOAuthLogin` link path similar. | Wrap each atomic sequence in `prisma.$transaction`. | 🚩 Phase 3 (also db-14) |
| be-08 | 🟡 MEDIUM | `auth/auth.controller.ts:43-108` | `login/refresh/logout/googleCallback` type Express objects as `any`; `@Res()` also switches them to manual-response mode, bypassing interceptors. | `@Res({ passthrough: true }) res: Response`, `@Req() req: Request`. | 🚩 Phase 3 (also xc-12) |
| be-09 | 🟡 MEDIUM | `documents/documents.controller.ts:94-120` | Manual `+id`/`parseInt(id)` instead of `ParseIntPipe` (unlike all other controllers) → `NaN` reaches Prisma; `docType` validated manually in the controller. | `@Param('id', ParseIntPipe)`; `ParseIntPipe({ optional: true })` for folderId; enum pipe/DTO for docType. | 🚩 Phase 3 |
| be-10 | 🟡 MEDIUM | `applications/applications.service.ts:139-140` | Comment claims "strip UTF-8 BOM" but code is `.replace(/^ /, '')` (a literal space, not `U+FEFF`). Inconsistent with `users.service` which does it correctly. | Use `raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw`. | ✅ Applied |
| be-11 | 🔵 LOW | `notifications/notifications.service.ts:142-320` | `buildObjectiveEmail` is a misnamed ~180-line god-method building 4 unrelated notification types via if/else chain. | Rename `buildNotificationEmail`; split per type after be-03. | 🚩 Phase 3 |
| be-12 | 🔵 LOW | `promos/promos.service.ts:21-57` | `findAll` copy-pastes the same ~20-line include block in both role branches (and again in `findOne`). | Extract `PROMO_WITH_ADMINS_INCLUDE` const; single `where`. | 🚩 Phase 3 |
| be-13 | 🔵 LOW² | `main.ts:13-19` | No global exception filter → raw Prisma errors (P2025) become 500s while other paths throw clean 404s; `validateOAuthLogin` throws bare `new Error(...)` (→500). | Add a global filter mapping P2025→404, P2002→409; replace bare `Error`. | 🚩 Phase 3 |

¹ Down-rated HIGH→MEDIUM by the critic: `notifications.service.ts:70-72` defensively guards the `score` index with `?? 'Non précisé'`, so there is no crash path — but the unvalidated body is a real defect (and a **security** finding, INJ-01).
² Architecturally this is higher-impact than LOW; ranked LOW only because each individual 500 is low-severity. Recommended early in Phase 3.

---

## Frontend (React) — score 52/100

> Consistent data layer (query keys, `staleTime`, optimistic updates) undermined by pervasive action-file boilerplate, a thin fetch wrapper, and an `any[]`-typed admin area with an 838-line god component.

| ID | Sev | File:Line | Finding | Recommended fix | Status |
|----|-----|-----------|---------|-----------------|--------|
| fe-01 | 🟠 HIGH | `shared/lib/api.ts:7-30` | No 401→`refresh()`→retry; unconditional `res.json()` breaks on 204/empty. Refresh only runs in `_protected.beforeLoad`, so in-page actions fail after token expiry. | Single-flight refresh-and-retry on 401; guard body parse on 204/`content-length:0`. | 🚩 Phase 3 |
| fe-02 | 🟠 HIGH | `features/**/actions/*.ts` (×41) | `token: getToken() ?? undefined` threaded into every action file — pure duplication; also blocks fixing fe-01 in one place. | `apiFetch` reads `getToken()` itself; auth endpoints opt out with `token: null`. | 🚩 Phase 3 |
| fe-03 | 🟠 HIGH | `features/admin/components/StudentDetail.tsx:26-838` | 838-line god component: 5 tabs, 6 queries, 2 mutations, an IIFE rendering objectives inline, per-click dynamic import; re-renders whole tree on any local state. | Split each tab into its own component; hoist the dynamic import; extract `ObjectivesProgress`. | 🚩 Phase 3 |
| fe-04 | 🟡 MEDIUM | `features/admin/components/Dashboard.tsx:12-14` (+ StudentDetail/StudentsList/PromoManager/ObjectivesAdmin) | `users: any[]` / `promos: any[]` + 20+ inline `: any` defeat type safety on the most complex screens and let fe-08's dead prop through. | Define `Promo`/reuse `User` types; replace all `any[]`. | 🚩 Phase 3 (needs xc-01) |
| fe-05 | 🟡 MEDIUM | `features/applications/components/AppModal.tsx:20-243` vs `ApplicationSheet.tsx` | ~250 lines of duplicated form logic (same zod schema, `defaultValues`, transform) across create-modal and edit-sheet. | Extract `features/applications/form.ts` + a shared `ApplicationForm`. | 🚩 Phase 3 |
| fe-06 | 🟡 MEDIUM | `src/pages/admin/index.tsx:33-43` | String-encoded nav (`student-detail:${id}` then `split(':')`) bypasses TanStack Router typed params; forces `navigate` prop-drilling. | Use typed search params + `useNavigate()` in leaves. | 🚩 Phase 3 |
| fe-07 | 🟡 MEDIUM | `src/pages/admin/index.tsx:26-31` | Admin loads only `fetchUsers(1)` (page 1) but feeds it to Dashboard/PromoManager metrics → counts under-report past one page. | Aggregate all pages or compute counts server-side. | 🚩 Phase 3 |
| fe-08 | 🔵 LOW | `src/pages/admin/index.tsx:50-61` | Dead `users={users}` prop passed to `StudentsList`, which doesn't accept it (fetches its own via `useInfiniteQuery`). | Remove the prop. | ✅ Applied |
| fe-09 | 🟡 MEDIUM | `src/pages/applications/index.tsx:62-119` | `['applications']` vs StudentDetail's `['applications','user',userId]` never invalidate each other; `onSettled` uses `refetchType:'none'` → cache stays permanently optimistic. | Key factory `applicationKeys.*`; reconcile on settle. | 🚩 Phase 3 |
| fe-10 | 🟡 MEDIUM | `shared/lib/socket.ts:1-9` | Socket `auth: { token: getToken() }` captured at module-load → always `null`; `NotificationBell` reassigns before connect (the real path). | Remove static auth or use `auth: (cb) => cb({ token: getToken() })`. | 🚩 Phase 3 |
| fe-11 | 🟡 MEDIUM | `features/profile/hooks/use-profile.ts:8-16` | Derives identity from `getUser()` (non-reactive token decode) and keys the query on it → stale after silent refresh/logout. | Source id from `useAuthContext()`. | 🚩 Phase 3 |
| fe-12 | 🔵 LOW | `features/applications/components/ApplicationSheet.tsx:98-122` | Reset effect deps `[app?.id]` but reads `form` + ~10 `app.*` fields (exhaustive-deps); won't re-sync on in-place mutation. | Use RHF `values` prop instead of manual effect. | 🚩 Phase 3 |
| fe-13 | 🔵 LOW | `src/pages/applications/index.tsx:68-69` | `mutationFn: (data: any)` despite an exported `CreateApplicationData` type. | Type the param. **(Tightening it surfaced a real `Partial<Application>` vs `CreateApplicationData` mismatch at the call site — coupled to fe-05's form dedup; fix together.)** | 🚩 Phase 3 (with fe-05) |
| fe-14 | 🔵 LOW | `features/admin/components/StudentDetail.tsx:75-81` | `['objectives','completions']` configured with `staleTime 5min` here but no `staleTime` in `StudentsList` → behavior depends on mount order. | Extract a shared `useObjectiveCompletions()` hook. | 🚩 Phase 3 |
| fe-15 | 🔵 LOW | `src/pages/documents/index.tsx:251-256` | Error banner's dismiss ✕ wired to `onClose={() => {}}` → can never be cleared. | Wire to a state flag / refetch, or hide for load errors. | 🚩 Phase 3 |

---

## Database (Prisma / PostgreSQL) — score 62/100

> The schema is otherwise coherent (sane `onDelete`, clean migration history), but it has **no indexes whatsoever** — the single largest perf liability — plus a few N+1 loops, unpaginated lists, and untyped JSON.

### Missing indexes (all ✅ applied — see `migrations/<ts>_add_indexes`)

| ID | Sev | Model.column(s) | Hot path that scans without it |
|----|-----|-----------------|--------------------------------|
| db-01 | 🟠 HIGH | `RefreshToken.userId` (+ `AuthProvider.userId`¹) | `deleteMany({ where: { userId }})` on logout / password change |
| db-02 | 🟠 HIGH | `RefreshToken.expires_at` | nightly `AuthTasks.deleteTokens` purge → full-table scan |
| db-03 | 🟠 HIGH | `Application.userId` | student's main list view |
| db-04 | 🟠 HIGH | `Document.userId`, `Document.folderId`, `(status, docType)` | doc list + admin review queue (`docType IN … AND status IN …` + sort) |
| db-05 | 🟠 HIGH | `Folder.userId` | folder list |
| db-06 | 🟠 HIGH | `Notification.userId` (`(userId, created_at)`) | highest-volume table; per-user list + `orderBy` |
| db-07 | 🟠 HIGH | `Objective.promoId`, `ObjectiveCompletion.userId` | notify-by-promo, recent-activity |
| db-08 | 🟠 HIGH | `Communication.senderId`, `Communication.recipientId` | `findAll` OR-filter scans both branches |
| db-09 | 🟡 MEDIUM | `User.promoId`, `verificationToken`, `resetPasswordToken`, `last_seen_at` | promo scope, `findFirst` token lookups, inactivity cron |

¹ `AuthProvider` already has `@@unique([userId, provider])` covering `userId`-prefixed lookups; a standalone index is optional there.

### Other database findings

| ID | Sev | File:Line | Finding | Fix | Status |
|----|-----|-----------|---------|-----|--------|
| db-10 | 🟡 MEDIUM | `users/users.service.ts:121-139` | N+1: per-relation `adminPromo.count()` in a loop in `users.remove`. | Single `groupBy` on `promoId`. | 🚩 Phase 3 |
| db-11 | 🟡 MEDIUM | `applications/applications.service.ts:114-124` | Sequential `await createAndEmit` in a for-loop (blocking SMTP per admin); also excludes `SUPER_ADMIN`. | `Promise.allSettled`; select only `{id}`; include SUPER_ADMIN. | 🚩 Phase 3 |
| db-12 | 🟡 MEDIUM | `users/users.service.ts:73-81` | `findAll`/`bulkEmail` `findMany` with no `select` → returns token columns to clients. | Explicit safe `select` (see AC-09). | 🚩 Phase 3 (security) |
| db-13 | 🟡 MEDIUM | `documents/documents.service.ts:118-136` | No pagination on documents/communications/objectives/pending-reviews (only `users.findAll` paginates). | Add `skip/take`, esp. join-heavy `findAllCompletions`. | 🚩 Phase 3 |
| db-14 | 🟡 MEDIUM | `auth/auth.service.ts:405-417` | Multi-write `resetPassword` / OAuth-link not in a transaction. | `prisma.$transaction`. | 🚩 Phase 3 (= be-07) |
| db-15 | 🔵 LOW | `schema.prisma:182` | `Notification.payload` is untyped `Json`, read back with unchecked casts. | Discriminated-union TS type at the service boundary. | 🚩 Phase 3 |
| db-16 | 🔵 LOW | `schema.prisma:24-26` | Mixed snake_case/camelCase columns; several mutable models (`Document`, `Folder`, …) lack `@updatedAt`. | Pick one convention via `@map`; add `@updatedAt` to mutable models. | 🚩 Phase 3 |

---

## Cross-cutting (Types / Tests / Tooling) — score 58/100

| ID | Sev | File:Line | Finding | Fix | Status |
|----|-----|-----------|---------|-----|--------|
| xc-01 | 🟠 HIGH | `apps/web/shared/types/index.ts:10-46` (+ per-feature `types.ts`) | ~12 Prisma enums/models hand-duplicated in web, no single source of truth. | Extract `packages/types` (Zod + inferred types) imported by both apps. | 🚩 Phase 3 |
| xc-02 | 🟡 MEDIUM | `features/notifications/types.ts:1-20` | **Drift**: web `NotifType`/`NOTIF_LABELS` missing `INACTIVITY_ALERT`, which the backend emits → users see the raw enum string. | Add the member + French label. | ✅ Applied |
| xc-03 | 🟡 MEDIUM | `apps/api/eslint.config.mjs:28-38` | `no-explicit-any` and all `no-unsafe-*` set to `off` → hides the `@Res/@Req: any` patterns under `recommendedTypeChecked`. | Re-enable as `warn`; type the auth controller. | 🚩 Phase 3 |
| xc-04 | 🟡 MEDIUM | `.github/workflows/ci.yml:1-31` | CI runs only tests — no lint, typecheck, build, frozen-lockfile, or caching → broken builds/type errors pass green. | Add lint+typecheck+build gates, `--frozen-lockfile`, `cache: pnpm`. | 🚩 Phase 3 (also INFRA-03) |
| xc-05 | 🟡 MEDIUM | `turbo.json:3-12` | Only `dev`/`build`; `build.outputs` lists `.next/**` (this is a **Vite** app, not Next — boilerplate leftover); no `lint`/`test`/`typecheck`, no `inputs`. | Add tasks + correct outputs/inputs. | ✅ Applied |
| xc-06 | 🟡 MEDIUM | `apps/api/prisma.config.js` (+ `.map`, `tsconfig.build.tsbuildinfo`) | Committed build artifacts tracked in git. | Delete + gitignore. | ✅ Applied |
| xc-07 | 🟡 MEDIUM | `apps/web/pnpm-workspace.yaml:1-4` | Nested second workspace root inside `apps/web` → conflicts with root workspace, explains the per-app lockfiles. | Remove it; move `ignoredBuiltDependencies` to root; reinstall. | 🚩 Phase 3 (needs reinstall) |
| xc-08 | 🟡 MEDIUM | `apps/api/.env.example:1-14` | Out of sync with `env.validation.ts`: missing all `SMTP_*`, `MINIO_*`, `NODE_ENV`; lists stale `BREVO_*`. A fresh clone fails boot validation. | Regenerate to mirror the Joi schema. | ✅ Applied |
| xc-09 | 🔵 LOW | `apps/api/test/app.e2e-spec.ts:19-24` | e2e is unmodified boilerplate (`GET /` → "Hello World!"); no real module covered. | Add real e2e or remove the false confidence. | 🚩 Phase 3 |
| xc-10 | 🔵 LOW | `apps/web/package.json:5-11` | Only 3 web tests; no standalone `typecheck` script in either app. | Add `typecheck: tsc -b --noEmit`; more tests. | ✅ Applied (scripts) |
| xc-11 | 🔵 LOW | `apps/api/tsconfig.json:16-20` | `strict` on but `noUncheckedIndexedAccess` off in both apps. | Enable it (+ consider `noImplicitOverride`). | 🚩 Phase 3 (needs fixes) |
| xc-12 | 🔵 LOW | `apps/api/src/auth/auth.controller.ts:43-95` | `@Res/@Req: any` (invisible to lint due to xc-03). | Type from `express`. | 🚩 Phase 3 (= be-08) |

### Critic's additional findings (missed by layer reviewers)

| Sev | File:Line | Finding | Fix |
|-----|-----------|---------|-----|
| 🟠 HIGH | `documents.controller.ts:98-101` (+ `applications.service.ts:115`) | **Systemic `=== Role.ADMIN` exact-equality** role checks *exclude* `SUPER_ADMIN` — the highest role can't download student docs (404) and is silently dropped from admin notification queries. | Introduce `ADMIN_ROLES`/`isAdmin(role)` helper used everywhere a role is gated. |
| 🟠 HIGH | `users.controller.ts:62-65` (`me`) + `jwt.strategy.ts` | `GET /users/me` (and every `@CurrentUser()`) returns the full `User` row incl. `verificationToken`/`resetPasswordToken` — no serialization layer. | Global Prisma `omit` of token columns + `userPublicSelect`. (= security AC-09 — 🚩 Phase 3) |
| 🟡 MEDIUM | `applications.service.ts:82-127` | `update`/`remove` return a raw Prisma `BatchPayload` (`{count}`); `count===0` (wrong/foreign id) returns `200 {count:0}` instead of 404 — silent no-op the optimistic client never reconciles. | Throw `NotFoundException` on `count===0`; return the entity. |

---

## Methodology

4 parallel layer reviewers (backend, frontend, database, cross-cutting) each produced structured findings against a shared severity rubric; a fifth **critic** agent then verified each finding against the cited code to remove false positives, correct severities, and surface systemic issues the per-layer reviewers missed. 56 findings + 3 critic additions; 0 false positives, 2 severity adjustments (be-02 HIGH→MEDIUM, fe-09 confirmed). Total: ~447k tokens across 5 agents.
