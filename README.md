# Boilerplate Full-Stack — Next.js + NestJS

Un boilerplate production-ready avec authentification complète, architecture feature-first et stack moderne.

---

## Stack technique

| Couche          | Technologie                          |
| --------------- | ------------------------------------ |
| Frontend        | Next.js 16 (App Router) + TypeScript |
| Backend         | NestJS + TypeScript                  |
| Base de données | PostgreSQL + Prisma ORM              |
| Auth            | JWT dual-token + Google OAuth        |
| UI              | shadcn/ui + Tailwind CSS v4          |
| Monorepo        | pnpm workspaces                      |

---

## Prérequis

- Node.js >= 20
- pnpm >= 9
- PostgreSQL >= 14

---

## Installation

```bash
# Cloner le repo
git clone https://github.com/HenanAeroo/boilerplate.git
cd boilerplate

# Installer les dépendances
pnpm install
```

---

## Variables d'environnement

### `apps/api/.env`

```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/boilerplate

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# App
PORT=3001
FRONT_URL=http://localhost:3000
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Lancer le projet

```bash
# A la racine
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

# Appliquer les migrations
npx prisma migrate dev
```

---

## Architecture

### Monorepo

```
boilerplate/
├── apps/
│   ├── api/          # Backend NestJS
│   └── web/          # Frontend Next.js
└── README.md
```

### Frontend — Feature-first

```
apps/web/
├── app/              # Routing Next.js uniquement
│   ├── (auth)/       # Pages publiques (login, oauth)
│   └── layout.tsx    # Root layout
├── features/         # Logique métier par domaine
│   └── auth/
│       ├── actions/  # Appels API
│       ├── components/ # Formulaires
│       ├── hooks/    # useAuth
│       └── types.ts
└── shared/           # Code réutilisable
    ├── components/   # Layout, UI
    ├── lib/          # api.ts, auth.ts, utils.ts
    └── types/        # Types globaux
```

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
- `refreshToken` → cookie httpOnly (7 jours)
- Refresh automatique au montage de l'app

---

## Protection des routes

Le fichier `middleware.ts` protège les routes :

- `/` → redirige vers `/login` si non connecté
- `/login` → redirige vers `/` si déjà connecté

---

## Tests

```bash
# Backend (depuis apps/api ou racine)
pnpm test:api

# Frontend (depuis apps/web ou racine)
pnpm test:web
```

- Backend : Jest, tests unitaires dans `src/**/*.spec.ts`
- Frontend : Vitest + Testing Library

---

## CI/CD

GitHub Actions déclenché sur chaque push et PR vers `master` :

- `test-api` — génère le client Prisma puis lance les tests Jest
- `test-web` — lance les tests Vitest

---

## Features

- Dark mode (next-themes) — toggle dans la sidebar
- Rate limiting — 100 req/60s global, 10 req/60s sur les routes auth
- Validation des variables d'environnement au démarrage (Joi)
