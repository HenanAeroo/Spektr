# KANBAN — Spektr
> Approche : Vertical Slice (KANBAN B Hybride)
> Règle : dans chaque colonne, ordre strict → **Prisma d'abord → NestJS → React**
> Chemin critique mai 2026 : Col. 1 → 2 → 3 → 4

---

## Colonne 1 : Socle RBAC + Infrastructure transverse
> Pré-requis bloquant — à finir en entier avant de toucher à autre chose

### Prisma / BDD
- [ ] Ajouter l'enum `Role` (`STUDENT`, `RE`) dans `schema.prisma`
- [ ] Ajouter le champ `role Role @default(STUDENT)` sur le modèle `User`
- [ ] Générer et appliquer la migration (`prisma migrate dev --name add-role`)

### Backend NestJS
- [ ] Mettre à jour `JwtPayload` (interface + stratégie) pour inclure `role`
- [ ] Mettre à jour `issueTokens()` dans `auth.service.ts` pour embarquer `role` dans le JWT
- [ ] Créer le décorateur `@Roles(...roles: Role[])` dans `auth/decorators/roles.decorator.ts`
- [ ] Créer `RolesGuard` dans `auth/guards/roles.guard.ts`
- [ ] Exposer `GET /users/me` dans `UsersController` (retourne `id`, `email`, `first_name`, `last_name`, `role`)

### WebSocket Infrastructure
- [ ] Installer `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io` côté API
- [ ] Créer `EventsModule` + `EventsGateway` avec auth JWT sur le handshake
- [ ] Installer `socket.io-client` côté frontend
- [ ] Créer `shared/lib/socket.ts` (singleton `io()` avec `auth: { token }`)

### Frontend React
- [ ] Étendre `JwtPayload` dans `shared/types/index.ts` avec `role: 'STUDENT' | 'RE'`
- [ ] Créer le hook `useRole()` dans `shared/lib/auth.ts`
- [ ] Créer le composant `<RoleGate role="RE">` dans `shared/components/role-gate.tsx`
- [ ] Mettre à jour `ProtectedRoute` pour accepter un prop `requiredRole` optionnel

---

## Colonne 2 : Candidatures — le cœur de l'application

### Prisma / BDD
- [ ] Créer le modèle `Candidature` avec tous ses champs (statut enum, contact, dates, outcome)
- [ ] Migrer (`prisma migrate dev --name add-candidature`)

### Backend NestJS
- [ ] Générer `CandidaturesModule`, `CandidaturesController`, `CandidaturesService`
- [ ] Créer `CreateCandidatureDto` + `UpdateCandidatureDto` (class-validator)
- [ ] Implémenter CRUD scopé au userId (`create`, `findAllByUser`, `findOne`, `update`, `remove`)
- [ ] Endpoints REST protégés par `JwtAuthGuard` + endpoint RE `GET /candidatures/all`
- [ ] Émettre les events WebSocket depuis `CandidaturesService` (`candidature:created/updated/deleted`)
- [ ] Rooms WebSocket : `user:{userId}` pour les étudiants, `re` pour les RE

### Frontend React
- [ ] Créer `features/candidatures/types.ts`
- [ ] Créer `features/candidatures/actions/candidature.actions.ts`
- [ ] Créer `features/candidatures/hooks/use-candidatures.ts` (state + socket subscription)
- [ ] Composant `CandidatureTable` (shadcn `<Table>` avec colonnes triables + badges statut)
- [ ] Composant `CandidatureFormDialog` (Dialog + react-hook-form + zod)
- [ ] Page `/candidatures` + route dans `App.tsx` + lien sidebar
- [ ] Vue RE : page `/admin/candidatures` avec sélecteur étudiant (`<RoleGate role="RE">`)

---

## Colonne 3 : Dépôt documentaire + Objectifs mensuels

### Prisma / BDD
- [ ] Créer le modèle `Document` (`filename`, `originalName`, `mimetype`, `size`, `path`, `uploadedById`)
- [ ] Créer le modèle `MonthlyGoal` (`title`, `description?`, `targetMonth`, `targetCount`, `createdById`)
- [ ] Migrer (`prisma migrate dev --name add-documents-goals`)

### Backend NestJS — Documents
- [ ] Installer et configurer Multer (`FileInterceptor`, dossier `uploads/documents/`, filtre MIME, limite taille)
- [ ] Créer `DocumentsModule`, `DocumentsController`, `DocumentsService`
- [ ] Endpoints : `POST /documents` (RE only) + `GET /documents` (tous auth) + `GET /documents/:id/download` + `DELETE /documents/:id` (RE only)

### Backend NestJS — Objectifs mensuels
- [ ] Créer `GoalsModule`, `GoalsController`, `GoalsService`
- [ ] Endpoints : `POST /goals` (RE only) + `GET /goals` + `PATCH /goals/:id` + `DELETE /goals/:id`

### Frontend React — Documents
- [ ] Créer `features/documents/` avec types, actions, hooks
- [ ] Composant `DocumentList` (nom, taille, date, bouton télécharger)
- [ ] Composant `DocumentUploadDialog` (RE only, input file)
- [ ] Page `/documents` + route + lien sidebar

### Frontend React — Objectifs mensuels
- [ ] Créer `features/goals/` avec types, actions, hooks
- [ ] Composant `GoalCard` avec progress bar (calculée vs candidatures de l'étudiant)
- [ ] Intégrer `GoalCard` dans la page `/candidatures`

---

## Colonne 4 : Espace personnel étudiant

### Prisma / BDD
- [ ] Créer le modèle `Certification` (`name`, `issuedBy?`, `obtainedAt`, `userId`)
- [ ] Créer le modèle `WeeklyGoal` (`week`, `targetCount`, `note?`, `userId`)
- [ ] Migrer (`prisma migrate dev --name add-personal-space`)

### Backend NestJS
- [ ] Créer `PersonalSpaceModule` avec `CertificationsService` + `WeeklyGoalsService`
- [ ] Endpoints certifications : `GET/POST/PATCH/DELETE /me/certifications`
- [ ] Endpoints objectifs hebdo : `GET/POST/PATCH /me/weekly-goals`
- [ ] Endpoint RE (lecture seule) : `GET /users/:id/personal-space`

### Frontend React
- [ ] Composant `CertificationsList` + formulaire inline
- [ ] Composant `WeeklyGoalWidget` (semaine courante, input éditable)
- [ ] Enrichir `/profile` avec tabs shadcn : "Mon profil" / "Certifications" / "Objectifs"
- [ ] Vue RE sur `/admin/students/:id` en mode `readOnly`

---

## Colonne 5 : Should / Could — Optionnelles
> À traiter uniquement si col. 1-4 terminées avant fin avril 2026

### Planning Hyperplanning (Should)
- [ ] Backend : `POST /planning/upload` (RE only) — parsing CSV/Excel avec `xlsx` ou `csv-parse`, modèle `PlanningSlot`
- [ ] Frontend : page `/planning` avec upload + affichage timetable

### Statistiques hebdomadaires (Should)
- [ ] Backend : `GET /stats/weekly` (RE only) — agrégation Prisma `groupBy` sur statuts candidatures
- [ ] Frontend : page `/admin/stats` avec graphiques (`recharts`)

### Onboarding (Could)
- [ ] Flag `onboarding_done` en DB sur `User`
- [ ] Composant `OnboardingModal` affiché au premier login

---

## Règles techniques transverses

- **Prisma** : importer toujours depuis `../../prisma/generated/prisma/client`, jamais depuis `@prisma/client`
- **Multer** : dossier `uploads/` dans `apps/api/`, ajouté au `.gitignore`, chemin configurable via `ConfigService`
- **WebSocket** : le `EventsGateway` extrait le JWT depuis `socket.handshake.auth.token` et appelle `JwtService.verify()` manuellement
- **Déploiement** : Vercel exclu (WebSocket incompatible) — cible Railway ou VPS Ynov
- **Variable d'env** : `UPLOAD_DIR` pour le chemin des fichiers uploadés
