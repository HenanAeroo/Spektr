# Spektr — Security Audit Report (Phase 2)

> Generated 2026-06-24 via a multi-agent OWASP/CWE audit (4 parallel auditors + regression re-verification of the prior 37-finding audit + adversarial verification + a live `pnpm audit`).
> Methodology: code **and** infrastructure, OWASP Top 10 (2021) + SANS/CWE, building on the 2026-05-19 internal audit.

## Executive Summary

The auth core is **genuinely hardened** — the 2026-05-19 audit was acted upon: HMAC-SHA256 keyed refresh-token storage, bcrypt-12, refresh rotation, per-route throttling, Helmet, `forbidNonWhitelisted` validation, Joi env validation, file-upload MIME allowlist + size caps + UUID keys, `sslmode=require`. **No secrets are committed** (`.env` was never tracked).

However, this audit surfaces a **new, systemic class of vulnerability that postdates the May audit**: the modules added since then (documents review, objectives, promos/`AdminPromo`, communications, bulk-email) implement **role checks but not tenant/ownership checks**. The result is **broken access control across promos** — any `ADMIN` can reach the data and actions of students in promos they do not administer. This is the headline risk.

### Risk score (CVSS-style severity counts)

| | 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low |
|---|:--:|:--:|:--:|:--:|
| **Application code** | 0 | 6 | 18 | 8 |
| **Dependencies (live `pnpm audit`)** | 1 | 2 | 0 | 0 |
| **Total new findings** | **1** | **8** | **18** | **8** |

Plus **10 residual items still open** from the prior 37-finding audit (mostly LOW hardening) and **24 confirmed fixed / 3 N/A** (the memory's status column was stale on several — corrected below).

### The 7 things to fix first

| # | Sev | Finding | Where |
|---|-----|---------|-------|
| **AC-01/02/03** | 🟠 HIGH | Any `ADMIN` can **download, list, and review/validate any student's CV/LM across all promos** (and `SUPER_ADMIN` download is broken by an exact-equality role check). | `documents.*` |
| **AC-04** | 🟠 HIGH | Any `ADMIN` can **create/edit/delete objectives in any promo** and mass-notify its students. | `objectives.service.ts` |
| **AC-06** | 🟠 HIGH | `bulk-email` can **target any users by id across all promos** (cross-promo spam/phishing under institutional branding). | `users.service.ts:384` |
| **MISC-01** | 🟠 HIGH | **Stored XSS → admin privilege escalation**: communication `body` is stored raw and rendered with `dangerouslySetInnerHTML`; a low-priv admin can plant a payload that runs in a `SUPER_ADMIN`'s session. | `StudentDetail.tsx:823` + `communications.service.ts:19` |
| **DEP-01** | 🔴 CRIT | `liquidjs <10.26.0` **RCE** advisory in the dependency tree (via `@nestjs-modules/mailer`). | dependency |
| **AC-09** | 🟡 MED | User API serializes **raw `verificationToken` / `resetPasswordToken`** to clients (an admin can verify-email any pending account). | `users.service.ts` |
| **INJ-01 / AC-07** | 🟡 MED | `POST /users/:id/feedback` has **no DTO** → bypasses `ValidationPipe` entirely; `comment` is later rendered as raw HTML. | `users.controller.ts:119` |

### Disposition (per mission: apply non-breaking now, flag breaking for Phase 3)

- ✅ **Applied now** (non-breaking, contained): INJ-01/AC-07 (`SendFeedbackDto`), MISC-01 server-side (sanitize communication body **on write** — covers both the bulk-email and feedback write paths, which both route through `CommunicationsService.create`), AC-13 (pin JWT `algorithms:['HS256']`), INFRA-07 (`MINIO_USE_SSL`/`NODE_ENV` Joi validation), DEP-01/02/03 (`pnpm.overrides` declared — requires `pnpm install` to lock).
- 🚩 **Flagged for Phase 3** (behavior-changing authorization): the cross-promo IDOR family (AC-01…AC-06, AC-08, AC-10, AC-11) needs a shared **promo-ownership authorization helper** threaded through the services — implemented as the #1 Phase-3 task with copy-paste remediation below. **AC-09** (token-column leak) is flagged because the safe fix — a global Prisma `omit` of the token columns — also requires explicitly re-including them in the two `verifyEmail`/`resetPassword` queries that legitimately read them, so it is not a one-line change. Also AC-12/MISC-02 (token-in-URL), MISC-03 (prod CSP), MISC-01 client render-side (DOMPurify), the CI/Docker hardening (INFRA-01…05).

---

## 1. Broken Access Control / IDOR (OWASP A01) — the headline risk

The `AdminPromo` join table models which admins own/collaborate on which promos, and `RolesGuard` correctly gives `SUPER_ADMIN` a global bypass. But **the services never consult `AdminPromo`** — they gate on *role* (`@Roles(ADMIN)`) and then operate on any resource id. Every finding below is **CWE-639 / CWE-862**, OWASP **A01:2021**.

| ID | Sev | File:Line | Exploitation scenario | Remediation |
|----|-----|-----------|-----------------------|-------------|
| **AC-01** | 🟠 HIGH | `documents.controller.ts:98-102` → `documents.service.ts:68-78` | `getDownloadUrl` sets `userId = role===ADMIN ? undefined : user.id`. For an admin, the lookup is unscoped → iterate `GET /documents/:id/url` over int ids to download **any** student's CV/cover-letter across promos (1h presigned URL). Also `SUPER_ADMIN` (not `===ADMIN`) gets scoped to *their own* id → 404 on student docs. | Load the doc, then allow if owner, `SUPER_ADMIN`, or `AdminPromo.some({adminId, promoId: doc.user.promoId})`. Replace the ternary with an `isAdmin()`-aware check. |
| **AC-02** | 🟠 HIGH | `documents.controller.ts:91-96` → `service:64-66` | `GET /documents/user/:userId` (@Roles ADMIN) does `findMany({where:{userId}})` with no promo check → list any student's documents, then feed ids to AC-01. | Assert target's `promoId` ∈ requester's `AdminPromo` set before returning. |
| **AC-03** | 🟠 HIGH | `documents.service.ts:89-99` (review) + controller `109-121` | `PATCH /documents/:id/review` updates any doc by id and emails the owner → spoof official RE feedback / spam any student. `GET /documents/admin/pending-reviews` returns **every** pending CV/LM system-wide to every admin. | Verify `AdminPromo` on `doc.user.promoId` before update/emit; filter the queue by `where:{user:{promo:{adminPromos:{some:{adminId}}}}}`. |
| **AC-04** | 🟠 HIGH | `objectives.service.ts:17-25` (create) / `154-163` (update/remove) | `create()` trusts `dto.promoId` and mass-notifies that promo's students; `update/remove` take an objective id with no promo check → an admin disrupts/spams promos they don't manage. | Verify `AdminPromo` on `dto.promoId` (create) and on the objective's resolved `promoId` (update/remove/findOne). |
| **AC-05** | 🟡 MED | `objectives.service.ts:92-107` (toggleCompletion) | A `STUDENT` can `POST /objectives/:id/toggle` with an objective id from **another** promo → pollutes that promo's completion analytics. | Reject unless `objective.promoId === student.promoId`. |
| **AC-06** | 🟠 HIGH | `users.service.ts:384-420` (bulkEmail) | `findMany({where:{id:{in:userIds}}})` with no promo filter → email **any** users (other promos, other admins, even `SUPER_ADMIN`) under institutional branding; recipient enumeration. | Drop recipients whose `promoId` ∉ sender's `AdminPromo` set (`SUPER_ADMIN` exempt); reject out-of-scope ids. |
| **AC-07** | 🟡 MED | `users.controller.ts:119-144` (sendFeedback) | Send "official feedback" + record a `Communication` against **any** user across promos; body also unvalidated (see INJ-01). | `AdminPromo` check + `SendFeedbackDto`. ✅ DTO applied. |
| **AC-08** | 🟡 MED | `promos.service.ts:100-117` (assignUser) | `PATCH /promos/:id/assign` checks only the *target* promo, not the student's *current* promo → an admin **annexes any student** (then AC-01/02/03 their data). Can also set `promoId` on an admin account. | Verify requester also administers the student's current `promoId` (or it's null) **and** target role is `STUDENT`. |
| **AC-09** | 🟡 MED | `users.service.ts:53-94` (findAll/findOne/me) | No `select` → responses include `verificationToken` (stored **raw**) + `resetPasswordToken`. An admin reads a pending user's raw verification token and calls `/auth/verify-email?token=…` on their behalf. | Global Prisma `omit` of the four token columns in `PrismaService` (re-include in the `verifyEmail`/`resetPassword` queries that read them), or a shared `userPublicSelect`; hash `verificationToken` at rest like the reset token. 🚩 Phase 3 |
| **AC-10** | 🟡 MED | `users.controller.ts:67-80` + `applications.controller.ts:78-83` | `GET /users/:id` and `GET /applications/user/:userId` (@Roles ADMIN) expose any user's profile and **entire job-search pipeline** (companies, contacts, phone/email) across promos. | `AdminPromo` scope on both. |
| **AC-11** | 🟡 MED | `communications.controller.ts:19-28` → `service:27-50` | `GET /communications?userId=<any>` returns the full feedback/email history of any user across promos. | Scope to communications within the requester's promos or where requester is sender. |
| **AC-12** | 🟡 MED | `auth.controller.ts:93-108` (googleCallback) | Access token (15-min JWT) placed in the **redirect URL query string** → leaks to history, Referer, proxy/server logs. The callback page doesn't even use it (it calls `/refresh`). **CWE-598**, A02. | Drop `?token=`; the refresh cookie is already set — let the SPA call `/auth/refresh`. (= MISC-02.) |
| **AC-13** | 🔵 LOW | `jwt.strategy.ts:14-18` | HTTP JWT verify doesn't pin `algorithms:['HS256']` (the WS gateway does). HMAC secret precludes alg-confusion, so hardening-only. **CWE-347**. | Add `algorithms:['HS256']`. ✅ Applied. |

> **Root-cause remediation (the #1 Phase-3 task).** Add a small `PromoAccessService` (or a guard) exposing `isAdmin(role)`, `assertAdministersPromo(requester, promoId)`, and `administeredPromoIds(requester)`; thread the requester's `{id, role}` (from `@CurrentUser()`) into the documents/objectives/users/communications/promos service methods and enforce it. Introduce an `ADMIN_ROLES = [ADMIN, SUPER_ADMIN]` constant and replace every `role === Role.ADMIN` exact check. This is behavior-changing (it removes capabilities admins currently have), so it is intentionally **not** auto-applied — see `refactor-summary.md` for the staged plan and per-endpoint snippets.

---

## 2. Injection / Input Validation / Upload (OWASP A03, A08)

| ID | Sev | File:Line | Scenario | Remediation | Status |
|----|-----|-----------|----------|-------------|--------|
| **INJ-01** | 🟡 MED | `users.controller.ts:119-144` | Feedback body is an inline TS type → **zero** validation (whitelist/transform bypassed); unbounded `comment` persisted to `Communication.body` (storage DoS) and later rendered as HTML (MISC-01). **CWE-20**. | `SendFeedbackDto` (`@IsInt @Min(0) @Max(4)`, `@IsString @IsOptional @MaxLength(2000)`). | ✅ Applied |
| **INJ-02** | 🟡 MED | `applications/dto/create-application.dto.ts:16-18` | `lien` validated only as `@IsString` → store `javascript:fetch('/users/me')…`; frontend renders `<a href={app.lien}>` unescaped (`applications/index.tsx:286`). Self-XSS today, cross-user once an admin UI renders it. **CWE-79**. | `@IsUrl({protocols:['http','https'],require_protocol:true})`; guard render with `/^https?:\/\//`. | 🚩 Phase 3 |
| **INJ-03** | 🟡 MED | `documents.service.ts:33-49` | Upload trusts client `file.mimetype` (no magic-byte check); presigned download sets neither `content-disposition:attachment` nor `nosniff`. Allowlist excludes html/svg so impact is type-confusion/defense-in-depth. **CWE-434**. | Verify magic bytes; pass `response-content-disposition=attachment` + `response-content-type=application/octet-stream` to `presignedGetObject`. | 🚩 Phase 3 |
| **INJ-04** | 🔵 LOW | `users.service.ts:276-296` | Student CSV import auto-creates up to 500 `Promo` rows from raw, uncapped cell values (importer becomes OWNER). Admin-only + rate-limited → LOW. **CWE-770**. | Bound `promoName` length; prefer requiring promos to pre-exist; cap new promos/import. | 🚩 Phase 3 |

> Verified safe: no `$queryRaw`/`$executeRaw` usage; CSV cells run through `sanitizeCsvCell()` (formula-injection lead chars neutralized); outbound email HTML is `sanitize-html`-escaped (the May C3/C8 fixes hold); no user-controlled SSRF sink.

## 3. Misconfiguration / Headers / Client-side (OWASP A02, A05, A09)

| ID | Sev | File:Line | Scenario | Remediation | Status |
|----|-----|-----------|----------|-------------|--------|
| **MISC-01** | 🟠 HIGH | `StudentDetail.tsx:820-824` + `communications.service.ts:19`, `users.service.ts:407` | `dangerouslySetInnerHTML={{__html: selectedComm.body}}`; body stored **raw** (sanitize is applied only to outbound email, not the stored record). A low-priv admin POSTs `<img src=x onerror=…>` via `bulk-email`/`feedback`; it executes in any admin/`SUPER_ADMIN` who opens that student's comms → **stored XSS → privilege escalation / token theft**. **CWE-79**. | Sanitize **on write** (reuse the email allowlist) AND on render; treat feedback `comment` as plain text. | ✅ Server-side sanitize-on-write applied; 🚩 client render-side (DOMPurify) flagged |
| **MISC-02** | 🟡 MED | `auth.controller.ts:105-107` | = AC-12: 15-min JWT in OAuth redirect URL → history/Referer/log leakage; the callback page doesn't even use it. **CWE-598**. | Remove `?token=`; rely on the already-set refresh cookie. | 🚩 Phase 3 |
| **MISC-03** | 🟡 MED | `apps/web/index.html:6-9` | SPA CSP hardcodes `connect-src 'self' http://localhost:3001 ws://localhost:3001` (dev value shipped to prod) and omits `frame-ancestors`/`object-src`/`base-uri`. **CWE-1021**. | Generate CSP per-env (header at the static host); add `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'self'`. | 🚩 Phase 3 |
| **MISC-04** | 🔵 LOW | `auth.service.ts:100` | `localRegister` throws `ConflictException('Cet email est déjà utilisé')` → **user enumeration** (forgot-password is correctly generic). **CWE-204**. | Return the generic success + send an "account exists" email out-of-band, or accept + tighten throttle. | 🚩 Phase 3 |
| **MISC-05** | 🔵 LOW | `auth.service.ts` (whole module) | **No security-event logging** — no audit trail for failed/successful logins, password changes, refresh reuse, OAuth link, admin bulk actions, document reviews. **CWE-778**, A09. | Structured `Logger`/audit table for auth + privileged actions; alert on anomalies. | 🚩 Phase 3 (= F7) |
| **MISC-06** | 🔵 LOW | `auth.controller.ts:58-74` | Cookie-based `POST /auth/refresh` relies solely on `sameSite=lax` with no anti-CSRF token (mitigated today, but single-layer). **CWE-352**. | Add a custom-header / double-submit CSRF check; keep `sameSite=lax`. | 🚩 Phase 3 |

## 4. Infrastructure / Supply chain / Dependencies (OWASP A05, A06, A08)

### Live dependency vulnerabilities (`pnpm audit`, 2026-06-24)

| ID | Sev | Package | Advisory | Path | Fix |
|----|-----|---------|----------|------|-----|
| **DEP-01** | 🔴 CRIT | `liquidjs <10.26.0` | RCE — [GHSA-gf2q-c269-pqgc](https://github.com/advisories/GHSA-gf2q-c269-pqgc) | `@nestjs-modules/mailer > liquidjs` | Override `liquidjs >=10.26.0`. Reachability is low (Spektr builds email HTML manually, not via Liquid templates) but it is a CRITICAL advisory in the runtime tree. |
| **DEP-02** | 🟠 HIGH | `path-to-regexp >=8.0.0 <8.4.0` | DoS — [GHSA-j3q9-mxjg-w52f](https://github.com/advisories/GHSA-j3q9-mxjg-w52f) | Express `router` + `@nestjs/core` (29 paths) | **Runtime-reachable** via Express routing. Override `path-to-regexp >=8.4.0`. |
| **DEP-03** | 🟠 HIGH | `picomatch >=4.0.0 <4.0.4` | ReDoS — [GHSA-c2c7-rcm5-vvqj](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj) | `@nestjs/cli > @angular-devkit/*` (dev) | Dev-only. Override `picomatch >=4.0.4`. |

> ✅ Applied: a root `pnpm.overrides` block declaring all three. **Manual step:** run `pnpm install` to write them into the lockfile (intentionally not run here to avoid a half-installed tree under the active session).

### Infrastructure findings

| ID | Sev | Location | Finding | Remediation |
|----|-----|----------|---------|-------------|
| **INFRA-01** | 🟡 MED | `.github/workflows/ci.yml` | No `permissions:` block → `GITHUB_TOKEN` inherits default (often write); `pnpm install` runs lifecycle scripts (bcrypt/prisma/unrs-resolver allow-built) with a write-capable token. **CWE-1188**. | `permissions: { contents: read }` top-level; override per-job. |
| **INFRA-02** | 🟡 MED | `ci.yml:18,29` | `pnpm install` without `--frozen-lockfile`; **3 lockfiles** exist (root + per-app) so per-app ones drift and give false assurance. **CWE-829**. | `--frozen-lockfile`; delete the per-app lockfiles. |
| **INFRA-03** | 🟡 MED | `ci.yml:10-30` | No audit/lint/typecheck/build gate → vulnerable deps + broken builds merge green. | Add `pnpm audit --audit-level=high`, lint, `tsc --noEmit`, build; enable Dependabot. |
| **INFRA-04** | 🔵 LOW | `ci.yml` | Actions pinned by mutable tag (`@v4`) not SHA. **CWE-829**. | Pin to commit SHA; Dependabot `github-actions`. |
| **INFRA-05** | 🟡 MED | repo root (none present) | No `Dockerfile`/`compose`/`.dockerignore` → containerization risks running as root, secrets in layers, `.env` copied in. **CWE-1188**. | Multi-stage `node:22-alpine`/distroless, `USER node`, `.dockerignore` (`.env*`), runtime secret injection, `HEALTHCHECK`. |
| **INFRA-06** | 🔵 LOW | `apps/api/package.json:39,46` | `class-transformer 0.5.1` (prototype-pollution history; request-reachable via `transform:true`) + `multer 2.1.1` need an SCA gate. | Keep patched; add the INFRA-03 audit gate; avoid transforming untrusted nested objects. |
| **INFRA-07** | 🟡 MED | `env.validation.ts:3-20` | `MINIO_USE_SSL` consumed but **not in the Joi schema** → a typo/unset silently falls to plaintext, leaking PII + MinIO keys on the wire. `NODE_ENV` not enum-validated → a typo disables the prod-only secure-cookie flag. **CWE-319**. | Validate `MINIO_USE_SSL` (boolean) + `NODE_ENV` (enum); require TLS in prod; set MinIO bucket policy private. | ✅ Applied (Joi) |
| **INFRA-08** | 🟡 MED | `prisma.service.ts:13` | Live managed-DB + Brevo SMTP creds only in plaintext `.env` (git-ignored, **not** a committed-secret finding); likely a DB owner role; managed backups unmanaged. **CWE-798**. | Secrets manager in prod; least-privilege app DB role + separate migration role; `sslmode=verify-full`; rotate prod-grade creds. |
| **INFRA-09** | 🔵 LOW | `ci.yml:10-30` | No pnpm-store caching, no concurrency group, e2e never run. (Unit tests correctly need no DB — they mock Prisma.) | Add cache + `concurrency`; optional e2e job with a Postgres service. |

---

## 5. Regression — status of the prior 37-finding audit (2026-05-19)

Re-verified against current code. **The memory's status column was stale** on several items (corrected here). Summary: **24 FIXED, 3 N/A, 10 STILL_OPEN** — and the two "fixed" IDOR items (E1, E9) **reappeared as a new cross-tenant class** (the AC-* findings) in modules added after May.

| ID | Prior | **Now** | Evidence |
|----|-------|---------|----------|
| C1 | ⬜ | **N/A** | `.env` never committed (only `.env.example`); gitignore correct. (Ops: rotate on-disk dev secrets if ever prod-grade.) |
| C2–C6, C8 | — | **✅ FIXED** | WS CORS callback, email `escapeHtml`, storageKey sanitization, CORS throw-on-unset, `JWT_SECRET` min 32, password-changed email escaping — all verified. |
| **C7** | ✅ | **🔄 OPEN** | `auth.service.ts:208-211` still deletes the refresh token **before** checking `expires_at`. Self-DoS edge, not a bypass → LOW. |
| E1 | ✅ | **🔄 OPEN (reappeared)** | `GET /users/:id` fixed, but the same IDOR class returned cross-tenant: AC-02 (`/documents/user/:userId`), AC-10 (`/applications/user/:userId`). HIGH. |
| E2–E6, E8, E10 | — | **✅ FIXED** | Upload limits/MIME, Helmet, JWT alg pinning (sign side), WS explicit secret, keyed HMAC token hash, `forbidNonWhitelisted`, X-Powered-By off — verified. |
| **E7** | ✅ | **🔄 OPEN** | `ChangePasswordDto` is strong (Min 12 + complexity), but `reset-password.dto.ts:8` & `local-register.dto.ts:16` are `MinLength(8)` only — inconsistent policy. MEDIUM, CWE-521. |
| **E9** | ✅ | **🔄 OPEN (reappeared)** | `PATCH /users/:id` fixed, but cross-tenant **write** IDOR returned: AC-03 (doc review), AC-06 (bulk-email), AC-04 (objectives). HIGH. |
| M1–M5, M8, M11, M12 | mixed | **✅ FIXED** | `ParseIntPipe`, `@Roles` on completions, tightened throttles, no mass-assignment, `onDelete` cascades **now in schema**, reset flow **implemented**, SMTP/MINIO **now in Joi**, generic forgot-password — all verified (memory was stale on M5/M8/M11). |
| **M6** | ⬜ | **🔄 OPEN** | Bare `helmet()` (default CSP only); no custom CSP. LOW for a JSON API. |
| **M7** | ⬜ | **🔄 OPEN** | `michel.tsx` admin guard is client-only — acceptable (every admin API route is server-enforced); LOW. |
| **M9** | ⬜ | **🔄 OPEN** | Refresh delete-then-reissue with no grace window → multi-tab race. LOW. |
| **M10** | ⬜ | **🔄 OPEN** | `NODE_ENV` Joi default `development`, not enum-validated → unset in prod disables secure cookie. MEDIUM (= INFRA-07). |
| F1, F3, F5, F7 | ⬜ | **🔄 OPEN** | `deleteMany` for single delete (cosmetic), presigned TTL still 1h, no explicit OAuth `state`, no security logging. LOW. |
| F2 | ⬜ | **N/A** | Frontend autocomplete attr — out of API scope. |
| F4, F6 | ⬜ | **✅ FIXED** | `.gitignore` lists `.env`; `ValidationPipe` whitelist mitigates class-transformer pollution. |

---

## Methodology

4 parallel auditors (access-control/IDOR, injection/upload, config/client, infra/supply-chain) produced structured OWASP/CWE findings; a regression agent re-verified all 37 prior findings against current code; HIGH/CRITICAL findings were routed to adversarial verifiers (the verify pass was interrupted by a session limit, so those 6 retain their original severity with `verifier-unavailable` noted). A live `pnpm audit` supplied the dependency CVEs. ~574k tokens across 11 agents.
