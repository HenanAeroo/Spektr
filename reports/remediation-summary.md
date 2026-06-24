# Spektr — Remediation Summary

> Autonomous remediation pass against the three audit reports in this folder
> ([`security-audit.md`](./security-audit.md), [`code-review.md`](./code-review.md),
> [`refactor-summary.md`](./refactor-summary.md)). Generated 2026-06-24.

## Executive summary

The remediation closed the **entire P0 (cross-promo authorization) and P1 (security
hardening) backlog**, plus a substantial slice of the P2 (code-quality) backlog.
Everything below is **verified green**:

| Gate | API (`apps/api`) | Web (`apps/web`) |
|------|------------------|------------------|
| `tsc --noEmit` | ✅ clean | ✅ clean |
| Unit tests | ✅ **164 passed** / 20 suites | ✅ **12 passed** / 3 suites |
| ESLint | ✅ 0 errors (warnings only) | ✅ 0 errors (warnings only) |

The remaining work is **large, self-contained refactors** (admin god-component
decomposition, shared `packages/types`, container/CI infra) that are scoped and
listed under [Deferred](#deferred-work-with-rationale) with rationale — none of it
is a regression or a half-applied change.

---

## Phase 0 — Bootstrap

| Item | Status | Notes |
|------|--------|-------|
| Install deps | ✅ | `pnpm install` (workspaces). |
| Pre-existing typecheck error (`auth.test.ts` `JwtPayload.email`) | ✅ | Added optional `email` / `first_name` / `exp` / `iat` to the web `JwtPayload` type. |
| `prisma migrate deploy` + `generate` | ⚠️ **Manual** | Requires a live `DATABASE_URL`. The new `20260624120000_add_indexes` migration is committed and ready — run `cd apps/api && npx prisma migrate deploy && npx prisma generate` against the target DB. |

---

## Phase 1 — P0 Cross-promo authorization (CRITICAL)

The whole `AC-*` IDOR class: services checked the caller's **role** but not their
**promo ownership** (`AdminPromo`). Fixed by a central access layer threaded through
every promo-scoped path.

**New files**
- `apps/api/src/auth/roles.ts` — `ADMIN_ROLES` + `isAdmin(role)` (fixes the systemic
  `=== Role.ADMIN` bug that excluded `SUPER_ADMIN`).
- `apps/api/src/promos/promo-access.service.ts` — `PromoAccessService`
  (`administeredPromoIds`, `administersPromo`, `assertAdministersPromo`; `SUPER_ADMIN`
  bypasses).
- `apps/api/src/promos/promo-access.module.ts` — `@Global()` provider module.

**Threaded authorization**
- **Documents** (AC-01/02/03): `getDownloadUrl`, `findForUser`, `review`,
  `getPendingReviews` all promo-scoped.
- **Objectives** (AC-04/05): create/find/update/remove + `toggleCompletion` scoped.
- **Users** (AC-06/07/10): `bulkEmail` recipients filtered to administered promos;
  `findOne`/`sendFeedback` assert target promo.
- **Promos** (AC-08): `assignUser` loads the target, requires `STUDENT`, and asserts
  the requester administers both destination and current promo.
- **Applications** (AC-10): `findForUser` asserts promo scope.
- Every `role === Role.ADMIN` replaced with `isAdmin(role)`.

**Tests** — cross-promo `403` coverage added across the affected service/controller specs.

---

## Phase 2 — P1 Security

| ID | Fix | Files |
|----|-----|-------|
| **AC-09 / db-12** | Global Prisma `omit` of the four token columns; `verificationToken` now hashed at rest (HMAC) like the reset token; `verifyEmail`/`resetPassword` re-include per-query via `omit:{…:false}`. | `prisma/prisma.service.ts`, `auth/auth.service.ts` |
| **MISC-01 (client)** | `selectedComm.body` sanitized with DOMPurify (allow-list) before `dangerouslySetInnerHTML`. | `features/admin/components/StudentDetail.tsx` |
| **E7** | Password policy unified to **min 12 + complexity** across `LocalRegisterDto`, `ResetPasswordDto` (backend) and the register / profile / reset-password forms (frontend) via a single `shared/lib/password.ts`. | 2 DTOs + 3 forms + new helper |
| **AC-12 / MISC-02** | Dropped `?token=` from the Google OAuth redirect (JWT no longer in URL/Referer/logs). The callback page already restores state via `/auth/refresh`. | `auth/auth.controller.ts` |
| **INJ-02** | `@IsUrl({protocols:['http','https'],require_protocol:true})` on `Application.lien`; frontend `<a href>` guarded with `/^https?:\/\//`. | `create-application.dto.ts`, `pages/applications/index.tsx` |
| **MISC-03** | Per-environment CSP built from `VITE_API_URL` (dev: response header incl. `frame-ancestors`; build: `<meta>`); removed hardcoded `localhost`; added `object-src`/`base-uri`/`form-action`. | `vite.config.ts`, `index.html` |
| **C7 + M9** | `refresh` now validates existence/expiry **before** any write (C7), then rotates the token into a **30 s grace window** instead of hard-deleting it, so concurrent tabs aren't logged out (M9). | `auth/auth.service.ts` |

---

## Phase 3 — P2 Code quality (substantial slice)

| ID | Fix | Files |
|----|-----|-------|
| **be-13** | Global `PrismaExceptionFilter` maps `P2025→404`, `P2002→409`; unknown codes logged + generic 500. Subsumes **be-04** for `update`/`delete` paths. | new `shared/filters/prisma-exception.filter.ts`, `main.ts` |
| **Critic / F1** | `applications.update`/`remove` throw `NotFoundException` on a no-match (was a silent `{count:0}`); `update` returns the entity. | `applications/applications.service.ts` |
| **db-11** | Admin notification fan-out switched to `Promise.allSettled` (was sequential per-admin SMTP); already includes `SUPER_ADMIN` (Phase 1). | `applications/applications.service.ts` |
| **db-10** | `users.remove` last-owner check uses a single `groupBy` instead of N `count()` calls. | `users/users.service.ts` |
| **be-06** | Deleted the dead `WsJwtGuard` (registered but never applied). | removed `events/guards/ws-jwt.guard.ts`, `events.module.ts` |
| **be-07 / db-14** | `resetPassword`'s password-write + token-clear wrapped in `$transaction`. | `auth/auth.service.ts` |
| **be-08 / xc-12** | Auth controller `@Req`/`@Res` typed as `express` `Request`/`Response` with `{ passthrough: true }` (no longer bypasses interceptors); bare `throw new Error` → `BadRequestException`. | `auth/auth.controller.ts` |
| **be-12** | Extracted `PROMO_WITH_ADMINS_INCLUDE`; collapsed the duplicated role branches into one `where`. | `promos/promos.service.ts` |
| **be-09** | Confirmed all `documents` controller route params use `ParseIntPipe`. | `documents/documents.controller.ts` |
| **be-11** | Renamed `buildObjectiveEmail` → `buildNotificationEmail`. | `notifications/notifications.service.ts` |
| **fe-01 (+ partial fe-02)** | `apiFetch` now: single-flight 401 → `refresh()` → retry with the fresh token; guards body parse on 204/205/empty; attaches the in-memory token itself. Auth endpoints opt out via `skipAuth`. | `shared/lib/api.ts`, 7 auth callers |
| **xc-03** | Re-enabled `no-explicit-any` + `no-unsafe-*` as `warn` (debt now visible, build still green). | `eslint.config.mjs` |

**Tests added** — refresh grace-window (M9), `applications` 404 paths, `apiFetch`
204-guard and 401-retry, plus the Phase-1/2 authorization specs.

> The whole API source tree was run through Prettier so the re-enabled style rules
> pass cleanly — expect formatting-only churn in files outside the functional diff.

---

## Phase 4 — Tooling

Not started — see [Deferred](#deferred-work-with-rationale).

---

## Breaking changes / behavioral notes

1. **Password policy** is now min-12 + complexity on register **and** reset. Existing
   stored passwords are unaffected (login is unchanged); only *new* passwords must comply.
2. **Refresh rotation** keeps the presented token valid for a 30 s grace window instead
   of single-use-delete. This is a deliberate, audit-recommended trade (M9) — full
   reuse-detection (revoke-all-on-replay) needs a `RefreshToken.rotatedAt` column and is
   listed below.
3. **OAuth redirect** no longer carries `?token=`. The SPA callback already used
   `/auth/refresh`, so no client change was required.
4. **`applications` update/remove** now return `404` (not `200 {count:0}`) for a
   wrong/foreign id, and `update` returns the entity rather than a `BatchPayload`.
5. **Token columns** (`verificationToken`, `resetPasswordToken`, and their expiries) are
   no longer serialized by any default query (global Prisma `omit`).

## Manual steps required

- Run the indexes migration against each environment:
  `cd apps/api && npx prisma migrate deploy && npx prisma generate`.
- For production, set the CSP **and** `frame-ancestors 'none'` as a response **header**
  at the static host (a `<meta>` tag can't enforce `frame-ancestors`).

---

## Deferred work (with rationale)

These are real, scoped items left intentionally — each is a sizeable standalone change
that would otherwise have been applied half-way. None is a regression.

| ID(s) | Item | Why deferred |
|-------|------|--------------|
| **fe-03 / fe-05 / fe-06** | Decompose the 838-line `StudentDetail` god-component; extract a shared `ApplicationForm`; typed router nav. | Large, interdependent single-origin refactor; high regression surface — warrants its own focused PR + visual QA. |
| **xc-01 + fe-04** | Shared `packages/types` (Zod) consumed by both apps; remove `any[]` from admin screens. | Needs a new workspace package + install + import rewrites across both apps. |
| **fe-02 (remainder)** | Remove the redundant `token:` arg from the ~41 action files. | `apiFetch` already reads the token centrally (fe-01), so this is now pure cleanup; mechanical but touches 41 files + their `getToken` imports. |
| **be-03 / be-11 (split)** | Extract a shared `EmailLayout.wrap` provider from ~8 inline templates; split `buildNotificationEmail` per type. | Template consolidation across 3 services; cosmetic, no correctness/security impact. |
| **db-13** | Pagination on documents/communications/objectives/pending-reviews. | API + frontend (infinite-query) coupling; needs UI changes. |
| **db-15 / db-16** | Typed `Notification.payload` discriminated union; naming convention + `@updatedAt` on mutable models. | `db-16` is a schema migration (needs DB). |
| **xc-09** | Replace the boilerplate e2e with real coverage. | Best authored alongside the decomposition work. |
| **xc-11** | Enable `noUncheckedIndexedAccess`. | Surfaces many call-site fixes across both apps; do as a dedicated typed sweep. |
| **Phase 4** | `xc-07` (nested `pnpm-workspace`), husky + lint-staged, `INFRA-01..05` (CI gates, Dockerfiles, compose), README/CONTRIBUTING. | Infra/tooling; several require a reinstall or live services and are independent of the app code. |
| **fe-07/09/10/11/12/14/15** | Assorted frontend query-key/socket/reactivity polish. | Low severity; independent of the above. |

## Verification commands

```bash
pnpm --filter api exec tsc --noEmit -p tsconfig.json   # clean
pnpm --filter api exec jest                            # 164 passed
cd apps/api && npx eslint src                          # 0 errors
pnpm --filter web exec tsc --noEmit                    # clean
pnpm --filter web exec vitest run                      # 12 passed
cd apps/web && npx eslint .                             # 0 errors
```
