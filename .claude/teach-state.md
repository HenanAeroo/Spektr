# Teach session state

## Meta
- date_started: 2026-03-17
- date_updated: 2026-04-16
- level: Advanced

## Project
- name: Spektr
- description: Plateforme de suivi de recherche d'emploi pour les étudiants RE de Rennes Ynov, avec rôles STUDENT/ADMIN, candidatures, documents et WebSocket temps réel.

## KANBAN
# KANBAN — Spektr
> Approche : Vertical Slice (KANBAN B Hybride)
> Règle : dans chaque colonne, ordre strict → **Prisma d'abord → NestJS → React**
> Chemin critique mai 2026 : Col. 1 → 2 → 3 → 4

---

## Colonne 1 : Socle RBAC + Infrastructure transverse ✅
> Pré-requis bloquant — terminé

- [x] 1. [Prisma] Enum Role (STUDENT, ADMIN) + champ sur User + migration
- [x] 2. [NestJS] JWT thin : payload = { sub } uniquement, issueTokens(userId), LocalStrategy retourne { sub }
- [x] 3. [NestJS] Décorateur @Roles + RolesGuard + JwtStrategy.validate() fetche le user en DB
- [x] 4. [NestJS] GET /users/me
- [x] 5. [WebSocket] EventsGateway + auth JWT handshake
- [x] 6. [Frontend] socket.ts singleton + RoleGate + useRole
- [x] 7. [Frontend] ProtectedRoute avec requiredRole

---

## Colonne 2 : Candidatures (CRUD vertical complet)
> En cours

- [x] 1. [Prisma] Modèle Application + migration
- [x] 2. [NestJS] ApplicationsModule — CRUD complet (controller + service + DTOs)
- [ ] 3. [Frontend] Liste des candidatures + création

---

## Colonne 3 : Documents
> À venir

---

## Colonne 4 : Notifications temps réel (WebSocket)
> À venir

---

## Progress
- current_task: Colonne 2 — Candidatures (CRUD vertical complet)
- current_substep: 3D — [Frontend] Sheet d'édition + updateApplication
- attempt_count: 0

## Recap

### Colonne 1 — Sous-étape 1 — Enum Role dans Prisma
- Enum Prisma = type contraint côté DB + TypeScript généré automatiquement
- Migration = synchronisation schéma → DB via `pnpm exec prisma migrate dev`
- Toujours utiliser `pnpm exec prisma` (binaire local), jamais `pnpm dlx` (environnement isolé)

### Colonne 1 — Sous-étape 2 — JWT thin
- Débat JWT fat vs JWT thin : fat embarque email/role (désync possible), thin n'embarque que sub (API = source de vérité)
- Choix retenu : JWT thin ({ sub } uniquement), le validate() du JwtStrategy fetche le user en base à chaque requête protégée
- LocalStrategy.validate() retourne { sub: user.id } → Passport l'injecte dans request.user → localLogin(payload) appelle issueTokens(payload.sub)

### Colonne 1 — Sous-étape 3 — @Roles + RolesGuard + JwtStrategy
- JwtStrategy.validate() doit fetcher le user en DB pour avoir son rôle — le token thin ne l'embarque pas
- RolesGuard ne vérifie que le rôle, JwtAuthGuard vérifie le token — les deux sont complémentaires et s'enchaînent
- Reflector.getAllAndOverride() lit les métadonnées posées par @Roles(), handler en priorité sur le controller
- pnpm.overrides dans un sous-package workspace doit être à la racine

### Colonne 1 — Sous-étape 4 — GET /users/me
- `@Get('me')` doit être déclaré avant `@Get(':id')` sinon NestJS interprète "me" comme un id
- `@CurrentUser()` retourne le User complet (injecté par JwtStrategy) — pas besoin d'aller en DB
- Types utilisés dans des signatures décorées avec emitDecoratorMetadata → doivent être `import type`

### Colonne 1 — Sous-étape 5 — WebSocket EventsGateway + auth JWT handshake
- Un gateway NestJS partage le serveur HTTP — pas de port séparé dans @WebSocketGateway
- L'authentification WebSocket se fait au handshake via client.handshake.auth.token
- jwtService.verify() lève une exception si invalide — toujours entourer dans un try/catch
- client.data est l'objet libre par socket pour stocker les infos de l'utilisateur authentifié
- Le guard WebSocket lit switchToWs().getClient() au lieu de switchToHttp().getRequest()
- EventsGateway doit être dans son propre EventsModule, pas directement dans AppModule

### Colonne 1 — Sous-étape 6 — Frontend socket.ts + useRole + RoleGate
- Le contexte auth n'exposait que isInitialized — il a fallu l'enrichir avec user (fetch /users/me après refresh)
- apiFetch est générique : toujours passer le type <T> pour éviter unknown
- Un composant React async n'est pas valide — les appels async vont dans useEffect
- autoConnect: false sur le socket — connecter manuellement après login uniquement
- RoleGate = guard de rendu (return null), pas de redirect — différent de ProtectedRoute

### Colonne 1 — Sous-étape 7 — ProtectedRoute avec requiredRole
- Deux gardes séparés : !getToken() → /login, mauvais rôle → /
- requiredRole optionnel : si absent, pas de vérification de rôle
- Ne pas partager un Props générique entre composants aux besoins différents

### Colonne 2 — Sous-étape 1 — Modèle Application Prisma
- Enums Prisma sans espaces ni accents : A_CONTACTER, SANS_REPONSE, etc.
- outcome nullable (Outcome?) car inconnu à la création
- La relation User doit être déclarée des deux côtés : userId + user sur Application, applications[] sur User
- migrate dev = crée + applique en local ; migrate deploy = applique en production uniquement

### Colonne 2 — Sous-étape 2 — ApplicationsModule NestJS
- findUnique/update/delete n'acceptent que des champs uniques dans where → utiliser findFirst/updateMany/deleteMany pour filtrer par userId
- @IsDateString() valide une string, pas un objet Date → typer le champ string dans le DTO
- prisma generate doit être relancé après chaque migrate pour mettre à jour les types TypeScript
- GET /me doit être déclaré avant GET /:id sinon NestJS interprète "me" comme un id (même règle que /users)

### Colonne 2 — Sous-étape 3 (A/B/C) — Frontend table + création inline + suppression
- Structure HTML table : un seul TableHeader + un seul TableBody, le map se fait sur les lignes, pas sur les colonnes
- Pattern rows : tableau de 50 éléments (Application | null), les null = lignes vides éditables
- Composants séparés EmptyRow / ExistingRow : chacun gère son propre état local de saisie
- Props React = un seul objet destructuré en premier argument — jamais de second argument de fonction
- handleDelete : setRows avec .map() qui remplace la ligne trouvée par null
- onDeleted typé (id: number) et non (app: Application) — passer l'id suffit pour identifier la ligne
