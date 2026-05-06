# Spektr

Plateforme de suivi des candidatures et de gestion de documents pour les étudiants suivis par les RE de Rennes Ynov Campus.

---

## Stack technique

| Couche          | Technologie                                      |
| --------------- | ------------------------------------------------ |
| Frontend        | React 19 + Vite + React Router v7 + TypeScript   |
| Backend         | NestJS 11 + TypeScript                           |
| Base de données | PostgreSQL + Prisma 7                            |
| Auth            | JWT dual-token + Google OAuth (Passport.js)      |
| UI              | shadcn/ui + Tailwind CSS v4 + HugeIcons + Lucide |
| Stockage        | Minio (S3-compatible)                            |
| Temps réel      | WebSocket (Socket.io)                            |
| Email           | Brevo (SMTP)                                     |
| Monorepo        | Turborepo + pnpm workspaces                      |

---

## Prérequis

- Node.js >= 20
- pnpm >= 9
- PostgreSQL >= 14
- Minio (instance locale ou distante)

---

## Installation

```bash
git clone https://github.com/HenanAeroo/Spektr.git
cd Spektr
pnpm install
```

---

## Variables d'environnement

### `apps/api/.env`

```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/spektr

# JWT
JWT_SECRET=your_jwt_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# App
PORT=3001
FRONT_URL=http://localhost:3000

# Minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=spektr-documents
MINIO_USE_SSL=false

# Email (Brevo SMTP)
BREVO_SMTP_LOGIN=your_email@domain.com
BREVO_SMTP_KEY=your_brevo_smtp_key
```

### `apps/web/.env.local`

```env
VITE_API_URL=http://localhost:3001
```

---

## Lancer le projet

```bash
# À la racine — démarre frontend et backend en parallèle
pnpm dev
```

- Frontend : http://localhost:3000
- Backend : http://localhost:3001

---

## Base de données

```bash
cd apps/api

# Générer le client Prisma
npx prisma generate

# Créer et appliquer les migrations
npx prisma migrate dev

# Interface graphique
npx prisma studio
```

---

## Architecture

```
Spektr/
├── apps/
│   ├── api/          # Backend NestJS
│   └── web/          # Frontend React + Vite
├── turbo.json
└── package.json
```

### Frontend — Feature-first (`apps/web/src/`)

```
src/
├── pages/            # Composants de route (login, home, applications, documents, profile)
├── routes/           # ProtectedRoute
├── features/         # Logique métier par domaine
│   ├── applications/ #   actions/, components/, hooks/, types.ts
│   ├── documents/
│   ├── folders/
│   ├── notifications/
│   └── auth/
└── shared/
    ├── lib/          # api.ts (fetch wrapper), auth.ts (token en mémoire)
    ├── components/   # Layout, Sidebar, UI réutilisable
    └── types/
```

### Backend — Modules NestJS (`apps/api/src/`)

| Module          | Responsabilité                                       |
| --------------- | ---------------------------------------------------- |
| `auth`          | JWT dual-token, Google OAuth, register/login/refresh |
| `users`         | Profil utilisateur                                   |
| `applications`  | Suivi des candidatures (statuts, entreprises, dates) |
| `documents`     | Upload/download de fichiers via Minio                |
| `folders`       | Organisation des documents par dossier               |
| `notifications` | Notifications temps réel + email (Brevo)             |
| `events`        | Gateway WebSocket                                    |
| `minio`         | Service de stockage objet S3-compatible              |
| `prisma`        | Accès base de données                                |

---

## Authentification

| Méthode      | Route                 |
| ------------ | --------------------- |
| Register     | `POST /auth/register` |
| Login        | `POST /auth/login`    |
| Refresh      | `POST /auth/refresh`  |
| Logout       | `POST /auth/logout`   |
| Google OAuth | `GET /auth/google`    |

**Stratégie JWT dual-token :**

- `accessToken` → stocké en mémoire JS (15 min)
- `refreshToken` → cookie httpOnly (7 jours), haché en base
- Refresh automatique au montage de l'app via `AuthProvider`
- `AuthTasks` (cron quotidien à 1h) purge les refresh tokens expirés

**Google OAuth :** l'API redirige vers `FRONT_URL/oauth/callback?token=<accessToken>` après succès ; la page stocke le token en mémoire et redirige vers `/`.

---

## Fonctionnalités

- **Candidatures** — création, suivi par statut (_À contacter_, _Envoyé_, _Relancé_, _En discussion_, _Réponse positive_, _Refus_)
- **Documents** — upload/download de fichiers organisés en dossiers, stockage Minio
- **Notifications** — alertes en temps réel (WebSocket) et par email (Brevo) sur les ajouts de documents et changements de statut
- **Profil** — gestion des informations utilisateur
- **Dark mode** — toggle dans la sidebar
- **Rate limiting** — 100 req/60s global, 10 req/60s sur les routes auth

---

## Tests

```bash
# Backend
cd apps/api && pnpm test          # Jest (unitaires)
cd apps/api && pnpm test:e2e      # Jest e2e
cd apps/api && pnpm test:cov      # Couverture

# Frontend
cd apps/web && pnpm test          # Vitest
```

---

## CI/CD

GitHub Actions déclenché sur chaque push et PR vers `master` :

- `test-api` — génère le client Prisma puis lance les tests Jest
- `test-web` — lance les tests Vitest
