# Transcendence — Reponses a l'evaluation

---

## Exigences generales

### Composants d'architecture

> Le projet possede-t-il les trois composants requis : Frontend, Backend, Base de donnees ?

**Reponse courte :** Oui. Le projet a un frontend React (`apps/web`), un backend Express (`apps/api`), et une base de donnees PostgreSQL, plus Redis pour le stockage des sessions.

**Reponse detaillee :**

Le projet est un monorepo avec deux applications principales :

- **Frontend** — React 19 + Vite SPA servi via Nginx. Point d'entree : [`apps/web/src/App.tsx`](../apps/web/src/App.tsx). Utilise Tailwind CSS pour le style, TanStack Query pour l'etat serveur, et Zustand pour l'etat client.
- **Backend** — API REST Express 5 en TypeScript. Point d'entree : [`apps/api/src/index.ts`](../apps/api/src/index.ts). Gere l'authentification, la gestion des sessions (via Redis), la diffusion du curriculum et la soumission des exercices.
- **Base de donnees** — PostgreSQL 17 gere via Prisma ORM. Schema defini dans [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma). Redis (7-alpine) est utilise comme store de sessions en complement de Postgres.

Les quatre services (web, api, db, redis) sont definis dans [`docker-compose.yml`](../docker-compose.yml).

---

### Deploiement

> L'application peut-elle etre deployee avec une solution de containerisation (Docker, Podman, etc.) en une seule commande ?

**Reponse courte :** Oui. `docker compose up --build` demarre tous les services. Aucune intervention manuelle necessaire hormis la creation d'un fichier `.env` a partir de `.env.example`.

**Reponse detaillee :**

Le [`docker-compose.yml`](../docker-compose.yml) definit 4 services :

| Service | Image / Build | Port |
|---------|--------------|------|
| `db` | `postgres:17` | 5432 |
| `redis` | `redis:7-alpine` | (interne uniquement) |
| `api` | Construit depuis [`docker/api.Dockerfile`](../docker/api.Dockerfile) | 3000 (interne) |
| `web` | Construit depuis [`docker/web.Dockerfile`](../docker/web.Dockerfile) | 80 / 443 |

L'ordre de demarrage est assure via `depends_on` avec des health checks :
- `api` attend que `db` et `redis` soient sains
- `web` attend que `api` soit sain

Les migrations Prisma sont appliquees automatiquement au demarrage du conteneur API. Le seul prerequis est de copier `.env.example` en `.env` et de remplir les valeurs.

---

### Compatibilite navigateur

> L'application fonctionne-t-elle sur la derniere version stable de Google Chrome sans erreurs ni avertissements dans la console ?

**Reponse courte :** Oui. L'application cible les navigateurs modernes via la configuration par defaut de Vite. Aucune erreur ni avertissement attendu sur Chrome.

**Reponse detaillee :**

Le frontend est construit avec Vite 7 qui cible les ES modules modernes par defaut. La stack technique (React 19, TanStack Query, Zustand) est entierement compatible avec Chrome. Lors de l'evaluation, ouvrir les DevTools Chrome (F12 > onglet Console) pour verifier. Des avertissements mineurs de librairies tierces (ex. : avertissements React en mode dev) peuvent apparaitre en developpement mais ne devraient pas apparaitre dans le build Docker de production ou `NODE_ENV=production`.

---

### Politique de confidentialite et Conditions d'utilisation

> Les pages Politique de confidentialite et Conditions d'utilisation sont-elles accessibles et contiennent-elles un contenu pertinent ?

**Reponse courte :** Oui. Les deux pages sont accessibles depuis le footer de la landing page via les routes `/privacy-policy` et `/terms-of-service`, avec un contenu complet et specifique au projet.

**Reponse detaillee :**

Les deux pages sont implementees comme des composants React dedies avec un contenu substantiel et adapte au projet :

- **Politique de confidentialite** — [`apps/web/src/pages/PrivacyPolicy.tsx`](../apps/web/src/pages/PrivacyPolicy.tsx) : 9 sections couvrant la collecte de donnees, l'utilisation, le stockage/securite, les cookies, le partage avec des tiers, les droits RGPD, la retention des donnees et les coordonnees. Reference specifiquement les technologies du projet (PostgreSQL, sessions Redis, HTTPS/TLS).
- **Conditions d'utilisation** — [`apps/web/src/pages/TermsOfService.tsx`](../apps/web/src/pages/TermsOfService.tsx) : 10 sections couvrant l'acceptation, la description du service, les comptes utilisateur, l'utilisation acceptable, le disclaimer educatif (pas de vraie crypto), la propriete intellectuelle, la responsabilite, la resiliation, le droit applicable (UE) et les modifications des conditions.

Les deux pages sont liees depuis le footer de la landing page ([`apps/web/src/pages/Landing.tsx:30-34`](../apps/web/src/pages/Landing.tsx)) et routees dans [`apps/web/src/App.tsx:39-40`](../apps/web/src/App.tsx). Chaque page inclut un lien "Retour a l'accueil" pour la navigation.

---

## Exigences techniques

### Responsivite du frontend

> Le frontend est-il clair, responsive et accessible sur differents appareils ?

**Reponse courte :** Oui. L'application utilise les breakpoints responsive de Tailwind CSS (`sm:`, `md:`, `lg:`) partout, avec une approche mobile-first et un menu de navigation mobile dedie.

**Reponse detaillee :**

- La meta tag viewport est definie dans [`apps/web/index.html:5`](../apps/web/index.html) : `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`
- Le layout principal ([`apps/web/src/layouts/AppLayout.tsx`](../apps/web/src/layouts/AppLayout.tsx)) a des navigations separees pour desktop et mobile :
  - Nav desktop : `hidden items-center gap-5 md:flex` (ligne 109) — cache sur mobile, visible a partir du breakpoint `md`
  - Menu hamburger mobile : `flex items-center gap-3 md:hidden` (ligne 136) — visible sur mobile, cache a partir de `md`
  - Panneau nav mobile : `border-t border-gray-100 bg-white px-4 py-3 md:hidden` (ligne 173)
- Les composants de pages utilisent des grilles responsive : ex. `grid gap-4 sm:grid-cols-2` sur le dashboard et la page achievements
- Les elements interactifs utilisent un dimensionnement responsive : `w-full sm:w-auto` pour les boutons

---

### Solution de style

> Un framework CSS ou une solution de style est-il utilise ?

**Reponse courte :** Oui. Tailwind CSS v4, integre comme plugin Vite.

**Reponse detaillee :**

- Dependances dans [`apps/web/package.json`](../apps/web/package.json) : `"tailwindcss": "^4.2.1"` et `"@tailwindcss/vite": "^4.2.1"`
- Integration Vite dans [`apps/web/vite.config.ts:6`](../apps/web/vite.config.ts) : `plugins: [tailwindcss(), react()]`
- Des design tokens personnalises (couleurs comme `bg-primary`, `text-primary`, `hover:bg-primary/80`) sont utilises dans tous les composants
- Chaque composant UI utilise des classes utilitaires Tailwind — aucun fichier CSS brut

---

### Variables d'environnement

> Les identifiants sont-ils correctement securises : `.env` dans `.gitignore`, `.env.example` fourni, aucun secret dans le depot ?

**Reponse courte :** Oui. `.env` est dans le gitignore, `.env.example` est fourni, et aucun secret n'est committe.

**Reponse detaillee :**

- [`.gitignore`](../.gitignore) exclut tous les fichiers env sauf l'exemple :
  ```
  .env
  .env.*
  !.env.example
  ```
- [`.env.example`](../.env.example) existe a la racine du depot avec des valeurs placeholder pour toutes les variables requises (identifiants BDD, secret de session, cles OAuth, etc.)
- Aucun secret code en dur trouve dans le code source. Toutes les valeurs sensibles sont lues depuis `process.env` au runtime. Les tokens OAuth sont chiffres avant stockage en base ([`apps/api/src/services/authService.ts:107-108`](../apps/api/src/services/authService.ts))

---

### Conception de la base de donnees

> La base de donnees a-t-elle un schema clair avec des relations bien definies ?

**Reponse courte :** Oui. Le schema Prisma definit 14 modeles avec des relations explicites, des suppressions en cascade et des index.

**Reponse detaillee :**

Fichier schema : [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma)

Modeles principaux et leurs relations :

| Modele | Fonction | Relations cles |
|--------|----------|----------------|
| `User` | Compte utilisateur principal | Has many : OAuthAccount, UserProgress, ChapterProgress, ExerciseAttempt, TokenTransaction, UserAchievement, Notification, Friendship |
| `OAuthAccount` | Auth Google/Facebook | Belongs to User (suppression en cascade) |
| `UserProgress` | Suivi de completion des missions | Belongs to User |
| `ChapterProgress` | Suivi au niveau chapitre | Belongs to User |
| `ExerciseAttempt` | Historique des soumissions | Belongs to User |
| `TokenTransaction` | Registre des Knowledge Tokens | Belongs to User |
| `Achievement` / `UserAchievement` | Badges de gamification | Many-to-many via UserAchievement |
| `Friendship` | Fonctionnalite sociale | Deux relations vers User (requester/addressee), enum de statut (PENDING/ACCEPTED) |
| `Certificate` | Certificat de completion | One-to-one avec User |
| `Notification` | Notifications in-app | Belongs to User, indexe sur `[userId, read, createdAt]` |
| `GdprExportToken` / `GdprDeletionToken` / `GdprAuditLog` | Conformite RGPD | Lie a User |

Tous les modeles appartenant a un utilisateur utilisent `onDelete: Cascade` pour que la suppression d'un utilisateur nettoie toutes les donnees associees. Des index de performance sont definis sur les champs frequemment requetes (userId, createdAt, statut de lecture).

---

### Securite de l'authentification

> Le systeme de gestion des utilisateurs fournit-il une authentification securisee avec inscription/connexion par email et mot de passe, et des mots de passe correctement haches et sales ?

**Reponse courte :** Oui. Les mots de passe sont haches avec bcrypt (facteur de cout 12). L'application supporte egalement OAuth (Google/Facebook) et la 2FA/TOTP optionnelle.

**Reponse detaillee :**

- **Hachage des mots de passe :** bcryptjs avec facteur de cout 12 dans [`apps/api/src/services/authService.ts:13,51`](../apps/api/src/services/authService.ts) :
  ```typescript
  const BCRYPT_COST_FACTOR = 12;
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
  ```
  bcrypt gere automatiquement le salage — chaque hash inclut un sel aleatoire unique.

- **Flux d'authentification :** Passport.js avec strategie Local dans [`apps/api/src/config/passport.ts:43-63`](../apps/api/src/config/passport.ts). La connexion verifie le mot de passe via `bcrypt.compare()`.

- **Couches de securite supplementaires :**
  - Support 2FA/TOTP avec secrets chiffres et limitation de debit (3 tentatives par 15 minutes)
  - Reinitialisation de mot de passe avec tokens expirant apres 1 heure, utilisation unique, et invalidation de session a la reinitialisation
  - Limitation de debit via Redis sur les endpoints sensibles (connexion, reinitialisation de mot de passe, verification 2FA)

---

### Validation des formulaires

> Tous les formulaires et saisies utilisateur sont-ils valides cote frontend ET backend ?

**Reponse courte :** Oui. Des schemas Zod definis dans un package partage sont utilises des deux cotes — le middleware backend rejette les requetes invalides, le frontend valide avant soumission.

**Reponse detaillee :**

- **Schemas partages** dans [`packages/shared/src/schemas/auth.ts`](../packages/shared/src/schemas/auth.ts) : `registerSchema`, `loginSchema`, `passwordResetSchema`, `totpCodeSchema` — avec des contraintes comme minimum 8 caracteres, majuscule, minuscule, chiffre requis pour les mots de passe.

- **Middleware de validation backend** dans [`apps/api/src/middleware/validate.ts`](../apps/api/src/middleware/validate.ts) : valide body, params et query contre les schemas Zod. Applique sur les routes, ex. dans [`apps/api/src/routes/auth.ts`](../apps/api/src/routes/auth.ts) :
  - Ligne 36 : `validate({ body: registerSchema })`
  - Ligne 52 : `validate({ body: loginSchema })`
  - Ligne 130 : `validate({ body: passwordResetRequestSchema })`

- **Validation frontend** dans [`apps/web/src/pages/RegisterPage.tsx:21-35`](../apps/web/src/pages/RegisterPage.tsx) : appelle `registerSchema.safeParse()` avant soumission, affiche les erreurs par champ via le composant `FormField`.

- Les deux cotes utilisent les **memes schemas Zod** depuis `packages/shared`, donc les regles de validation sont toujours synchronisees.

---

### Connexions securisees

> Le HTTPS est-il utilise pour toutes les connexions backend ?

**Reponse courte :** Oui. Nginx termine le TLS 1.2/1.3, redirige tout le HTTP vers HTTPS, et ajoute des en-tetes de securite (HSTS, X-Frame-Options, etc.).

**Reponse detaillee :**

Config Nginx : [`docker/nginx/nginx.conf`](../docker/nginx/nginx.conf)

- **Redirection HTTP vers HTTPS** (lignes 29-35) : tout le trafic port 80 retourne `301` vers HTTPS
- **Configuration TLS** (lignes 39-46) :
  - Ecoute sur le port 443 avec SSL
  - Certificats montes depuis `docker/nginx/certs/` (volume en lecture seule dans docker-compose)
  - Protocoles : `TLSv1.2 TLSv1.3`
  - Chiffrements : `HIGH:!aNULL:!MD5`
- **En-tetes de securite** (lignes 49-52) :
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` — impose HTTPS pendant 1 an
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` — empeche le clickjacking
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **Script de generation de certificats** disponible dans [`docker/generate-certs.sh`](../docker/generate-certs.sh) pour les certificats auto-signes locaux
- Docker Compose definit `FRONTEND_URL: https://localhost` confirmant que HTTPS est le protocole attendu

---

## Verification des modules

### Points des modules

> Le projet revendique-t-il au moins 14 points de modules ?

**Reponse courte :** Oui. Le README revendique 17 points au total — 4 modules Majeurs (8 pts) + 9 modules Mineurs (9 pts).

**Reponse detaillee :**

Le tableau des modules est dans [`README.md:154-173`](../README.md). Detail :

| # | Module | Type | Pts |
|---|--------|------|-----|
| 1 | Web : FE + BE Frameworks | Majeur | 2 |
| 2 | Web : Fonctionnalites temps reel | Majeur | 2 |
| 3 | Web : Interaction utilisateur | Majeur | 2 |
| 4 | User Mgmt : Gestion standard des utilisateurs | Majeur | 2 |
| 5 | Web : ORM | Mineur | 1 |
| 6 | Web : Systeme de notifications | Mineur | 1 |
| 7 | Web : Design system personnalise | Mineur | 1 |
| 8 | User Mgmt : OAuth 2.0 | Mineur | 1 |
| 9 | User Mgmt : 2FA | Mineur | 1 |
| 10 | Gaming : Gamification | Mineur | 1 |
| 11 | Accessibilite : Langues multiples | Mineur | 1 |
| 12 | Accessibilite : Navigateurs supplementaires | Mineur | 1 |
| 13 | Donnees : Conformite RGPD | Mineur | 1 |
| | **TOTAL** | | **17** |

17 points depassent les 14 requis. Cela laisse une marge de 3 points au cas ou un module ne serait pas valide.

---

### Modules Majeurs

> Tous les modules Majeurs revendiques sont-ils correctement implementes et fonctionnels ?

#### 1. Web : FE + BE Frameworks (2 pts)

**Reponse courte :** Oui. React 19 + Vite 7 pour le frontend, Express 5 + Prisma 7 pour le backend.

**Reponse detaillee :**

- **Framework frontend :** React 19 avec Vite 7 comme bundler et Tailwind CSS 4 pour le style. SPA avec routage cote client (react-router-dom). Entree : [`apps/web/src/App.tsx`](../apps/web/src/App.tsx).
- **Framework backend :** Express 5 avec TypeScript, Prisma 7 ORM, PostgreSQL 17, Redis pour les sessions. Entree : [`apps/api/src/index.ts`](../apps/api/src/index.ts).
- Les deux sont des frameworks complets (pas juste des librairies), satisfaisant l'exigence "Majeur" d'utiliser un framework pour le FE et le BE.

---

#### 2. Web : Fonctionnalites temps reel (2 pts)

**Reponse courte :** Oui. Socket.IO 4.8 avec adaptateur Redis pour les notifications en temps reel et le suivi de presence.

**Reponse detaillee :**

- **Cote serveur :** Serveur Socket.IO avec adaptateur Redis configure dans [`apps/api/src/socket/index.ts`](../apps/api/src/socket/index.ts). Gere la presence utilisateur (en ligne/hors ligne), le push de notifications en temps reel (evenement `notification:push`) et les verifications d'engagement.
- **Cote client :** Client Socket dans [`apps/web/src/api/socket.ts`](../apps/web/src/api/socket.ts) se connecte avec authentification par session via le handshake Socket.IO.
- **Evenements :** `presence:online`, `presence:offline`, `notification:push` — permettant le statut en direct des amis et la livraison instantanee des notifications.

---

#### 3. Web : Interaction utilisateur (2 pts)

**Reponse courte :** Oui. Systeme d'amis et profils publics implementes. Le chat est en cours de merge dans un commit a venir.

**Reponse detaillee :**

Le sujet requiert trois choses pour ce module (sujet ligne 162-165) :
1. **Systeme de chat basique** — En cours de merge dans un commit a venir. Pas encore dans `main`.
2. **Systeme de profils** — Implemente. Consultation de profil public via `GET /api/v1/users/:userId/profile` dans [`apps/api/src/routes/users.ts`](../apps/api/src/routes/users.ts). Pages frontend : [`ProfilePage.tsx`](../apps/web/src/pages/ProfilePage.tsx) et [`PublicProfilePage.tsx`](../apps/web/src/pages/PublicProfilePage.tsx).
3. **Systeme d'amis** — Implemente. Envoi/acceptation/suppression de demandes d'amis via [`apps/api/src/routes/friends.ts`](../apps/api/src/routes/friends.ts). Frontend : [`FriendsPage.tsx`](../apps/web/src/pages/FriendsPage.tsx).

> **Note :** La fonctionnalite de chat est actuellement en developpement et sera mergee prochainement. Sans elle, ce module Majeur ne serait pas valide (0 pts), reduisant le total a 15 pts — toujours au-dessus du seuil de 14 points.

---

#### 4. User Mgmt : Gestion standard des utilisateurs (2 pts)

**Reponse courte :** Oui. Cycle de vie utilisateur complet : inscription, connexion, edition de profil, upload d'avatar, amis, statut en ligne.

**Reponse detaillee :**

- **Inscription/Connexion :** Email + mot de passe avec strategie locale Passport.js dans [`apps/api/src/config/passport.ts`](../apps/api/src/config/passport.ts). Sessions stockees cote serveur dans Redis.
- **Gestion de profil :** Nom d'affichage, bio, upload d'avatar. Routes dans [`apps/api/src/routes/users.ts`](../apps/api/src/routes/users.ts) avec gestion des fichiers avatar.
- **Statut en ligne :** Suivi via les evenements de presence Socket.IO — les amis voient qui est en ligne en temps reel.
- **Wallet-profil :** Affiche les XP, Knowledge Tokens, missions completees, streaks — visible sur le profil de l'utilisateur.

---

### Modules Mineurs

> Tous les modules Mineurs revendiques sont-ils correctement implementes et fonctionnels ?

#### 5. Web : ORM (1 pt)

**Reponse courte :** Oui. Prisma 7 avec PostgreSQL 17.

**Reponse detaillee :**

Schema Prisma dans [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma) definissant 14 modeles avec migrations. Tous les acces a la base passent par le client Prisma — aucun SQL brut. Migrations gerees via `prisma migrate deploy`.

---

#### 6. Web : Systeme de notifications (1 pt)

**Reponse courte :** Oui. Systeme de notifications complet avec push en temps reel, preferences et gestion lu/non lu.

**Reponse detaillee :**

- **Backend :** Modele `Notification` dans Prisma, routes dans [`apps/api/src/routes/notifications.ts`](../apps/api/src/routes/notifications.ts) (liste, marquer comme lu, preferences), service dans [`apps/api/src/services/notificationService.ts`](../apps/api/src/services/notificationService.ts).
- **Livraison en temps reel :** Notifications poussees instantanement via l'evenement Socket.IO `notification:push`.
- **Frontend :** Composant [`NotificationBell.tsx`](../apps/web/src/components/NotificationBell.tsx), [`NotificationsPage.tsx`](../apps/web/src/pages/NotificationsPage.tsx) et [`NotificationPreferencesPage.tsx`](../apps/web/src/pages/NotificationPreferencesPage.tsx).

---

#### 7. Web : Design system personnalise (1 pt)

**Reponse courte :** Oui. 23+ composants reutilisables avec des design tokens coherents (couleurs, typographie).

**Reponse detaillee :**

Composants dans [`apps/web/src/components/`](../apps/web/src/components/) :
- **Primitives UI :** Button, Card, Input, Alert, FormField, LoadingSpinner, ProgressBar, StatusBadge, ExerciseTypeBadge
- **Composants fonctionnels :** AchievementCard, DisclaimerModal, ErrorBoundary, NotificationBell, StreakWidget, TokenBalance
- **Composants d'exercices :** CMExercise, IPExercise, SIExercise, STExercise, ExerciseContainer, ExerciseResult, MissionComplete

Design tokens : teal primaire (`#2B9E9E`), ambre secondaire (`#D4A843`), typographie Plus Jakarta Sans + Source Sans 3. Bien au-dessus du minimum de 10 composants.

---

#### 8. User Mgmt : OAuth 2.0 (1 pt)

**Reponse courte :** Oui. OAuth Google et Facebook via les strategies Passport.js.

**Reponse detaillee :**

- **Strategies :** `passport-google-oauth20` et `passport-facebook` configurees dans [`apps/api/src/config/passport.ts`](../apps/api/src/config/passport.ts), chargees conditionnellement selon les variables d'environnement.
- **Routes :** `GET /api/v1/auth/google`, `/api/v1/auth/google/callback`, `GET /api/v1/auth/facebook`, `/api/v1/auth/facebook/callback` dans [`apps/api/src/routes/auth.ts`](../apps/api/src/routes/auth.ts).
- **Frontend :** [`OAuthCallbackPage.tsx`](../apps/web/src/pages/OAuthCallbackPage.tsx) gere le flux de redirection.
- **Securite :** Les tokens d'acces/rafraichissement OAuth sont chiffres (AES-256-GCM) avant stockage en base.

---

#### 9. User Mgmt : 2FA (1 pt)

**Reponse courte :** Oui. 2FA basee sur TOTP avec stockage chiffre des secrets et limitation de debit.

**Reponse detaillee :**

- **Endpoints** dans [`apps/api/src/routes/auth.ts`](../apps/api/src/routes/auth.ts) :
  - `POST /2fa/setup` — genere le secret TOTP et le QR code
  - `POST /2fa/verify-setup` — confirme le code pour activer la 2FA
  - `POST /2fa/verify` — verifie le code a la connexion
  - `POST /2fa/disable` — desactive la 2FA avec confirmation par code
- **Chiffrement :** Secrets TOTP chiffres au repos avec AES-256-GCM via [`apps/api/src/utils/totpCrypto.ts`](../apps/api/src/utils/totpCrypto.ts).
- **Limitation de debit :** 3 tentatives par 15 minutes sur les endpoints de verification pour empecher le brute-force sur les codes a 6 chiffres.

---

#### 10. Gaming : Gamification (1 pt)

**Reponse courte :** Oui. Knowledge Tokens, streaks quotidiennes, achievements et classement.

**Reponse detaillee :**

- **Knowledge Tokens :** Modele `TokenTransaction`, endpoints de solde et d'historique dans [`apps/api/src/routes/tokens.ts`](../apps/api/src/routes/tokens.ts). Tokens gagnes en completant des missions, depenses comme frais de gas sur les soumissions d'exercices.
- **Streaks :** Champs `currentStreak`, `longestStreak`, `lastMissionCompletedAt` sur le modele User. Logique de streak dans le service de gamification.
- **Achievements :** Modeles `Achievement` + `UserAchievement`. Endpoint achievements a `/api/v1/gamification/achievements`. Frontend : [`AchievementsPage.tsx`](../apps/web/src/pages/AchievementsPage.tsx) avec [`AchievementCard.tsx`](../apps/web/src/components/AchievementCard.tsx).
- **Classement :** `/api/v1/gamification/leaderboard` avec classements hebdomadaires. Frontend : [`LeaderboardPage.tsx`](../apps/web/src/pages/LeaderboardPage.tsx).

---

#### 11. Accessibilite : Langues multiples (1 pt)

**Reponse courte :** Oui. Anglais et francais implementes via react-i18next. L'espagnol est en cours d'ajout (merge a venir).

**Reponse detaillee :**

- **Configuration i18n :** [`apps/web/src/i18n.ts`](../apps/web/src/i18n.ts) avec `i18next`, `react-i18next` et `LanguageDetector`.
- **Fichiers de traduction :** `public/locales/en/translation.json` et `public/locales/fr/translation.json`.
- **Detection de langue :** Automatique via la langue du navigateur, mise en cache dans localStorage.
- **Note :** Le sujet requiert au moins 3 langues. L'espagnol (ES) est en cours de merge dans un commit a venir. Sans troisieme langue, ce module ne serait pas valide (0 pts), reduisant le total a 16 pts — toujours au-dessus de 14.

---

#### 12. Accessibilite : Navigateurs supplementaires (1 pt)

**Reponse courte :** Oui. Teste sur Chromium, Firefox et WebKit (Safari) via Playwright.

**Reponse detaillee :**

- **Config Playwright** dans [`playwright.config.ts`](../playwright.config.ts) definissant trois projets de navigateurs : Chromium, Firefox et WebKit.
- Les tests E2E s'executent sur les trois navigateurs, assurant la compatibilite multi-navigateurs.
- Le frontend utilise des API web standard et le build moderne de Vite, evitant les particularites specifiques aux navigateurs.

---

#### 13. Donnees : Conformite RGPD (1 pt)

**Reponse courte :** Oui. Export de donnees, suppression de compte et journalisation d'audit — le tout avec des flux de confirmation par email.

**Reponse detaillee :**

- **Modeles :** `GdprExportToken`, `GdprDeletionToken`, `GdprAuditLog` dans le schema Prisma.
- **Routes** dans [`apps/api/src/routes/gdpr.ts`](../apps/api/src/routes/gdpr.ts) :
  - `POST /gdpr/export` — lance l'export de donnees, envoie un email de confirmation
  - `GET /gdpr/export/:token` — telecharge le JSON exporte
  - `POST /gdpr/delete` — lance la suppression de compte, envoie un email de confirmation
  - `POST /gdpr/delete/confirm/:token` — supprime definitivement l'utilisateur et toutes les donnees associees
- **Service :** [`apps/api/src/services/gdprService.ts`](../apps/api/src/services/gdprService.ts) gere l'agregation des donnees pour l'export et la suppression en cascade.
- **Frontend :** [`DataExportPage.tsx`](../apps/web/src/pages/DataExportPage.tsx) et [`DeleteAccountPage.tsx`](../apps/web/src/pages/DeleteAccountPage.tsx).

---

### Modules au choix

> Si des "Modules au choix" personnalises sont revendiques, sont-ils correctement justifies et implementes ?

**Reponse courte :** Aucun "Module au choix" personnalise n'est revendique. Les 13 modules proviennent tous des categories standard du sujet.

---

### Evaluation des risques

Deux modules dependent de merges a venir :

| Module | Dependance | Impact si non merge |
|--------|-----------|---------------------|
| **#3 — Interaction utilisateur (Majeur, 2 pts)** | Fonctionnalite de chat (en cours) | Descend a 15 pts — passe quand meme |
| **#11 — Langues multiples (Mineur, 1 pt)** | i18n espagnol (en cours) | Descend a 16 pts — passe quand meme |

**Pire cas** (les deux non merges) : 17 - 2 - 1 = **14 pts** — exactement au seuil de validation.

---

## Qualite du code

### Structure du code

> Le code est-il raisonnablement bien organise et lisible ?

**Reponse courte :** Oui. Monorepo propre avec une separation claire des responsabilites, appliquee par ESLint et Prettier.

**Reponse detaillee :**

**Architecture du monorepo** (Turborepo + pnpm workspaces) :

```
apps/
  api/src/
    config/       — base de donnees, session (Redis), passport, client redis
    middleware/    — auth, errorHandler, rateLimiter, validate
    routes/       — 13 fichiers de routes (auth, users, curriculum, exercises, etc.)
    services/     — 14 fichiers de services (couche logique metier)
    socket/       — Handlers Socket.IO (presence, notifications, engagement)
    utils/        — AppError, contentLoader, totpCrypto, oauthCrypto
  web/src/
    components/   — 23+ composants reutilisables (ui/, exercises/, feature)
    pages/        — composants de pages (niveau route)
    contexts/     — AuthContext, RevealContext, NotificationContext
    hooks/        — hooks React personnalises
    stores/       — gestion d'etat Zustand
    layouts/      — AppLayout, AuthLayout
    api/          — helpers client API
packages/
  shared/src/
    schemas/      — schemas de validation Zod partages entre FE et BE
```

**Standards de code appliques :**
- **ESLint** ([`eslint.config.ts`](../eslint.config.ts)) : regles strictes TypeScript + linting des hooks React
- **Prettier** ([`.prettierrc`](../.prettierrc)) : points-virgules, guillemets doubles, indentation 2, virgules finales, largeur 100
- Les deux s'executent en CI via `pnpm lint` et sont disponibles localement

Le backend suit un pattern de couches clair **routes -> services -> Prisma**. Les routes gerent les preoccupations HTTP, les services contiennent la logique metier, Prisma gere l'acces aux donnees. Aucune fuite de logique entre les couches.

---

### Decisions techniques

> L'equipe peut-elle expliquer ses choix techniques ?

**Reponse courte :** Oui. Les decisions d'architecture sont documentees avec leur justification et les alternatives rejetees.

**Reponse detaillee :**

Les justifications techniques sont documentees dans [`_bmad-output/planning-artifacts/architecture.md`](../_bmad-output/planning-artifacts/architecture.md). Decisions cles et leur raisonnement :

| Decision | Pourquoi |
|----------|----------|
| **React 19 + Vite 7** (pas Next.js) | SPA decouplee — separer le frontend du backend pour permettre une couche WebSocket independante |
| **Express 5** (pas les API routes Next.js) | Backend dedie necessaire pour Socket.IO, gestion des sessions et flux d'auth complexes |
| **Prisma 7** | ORM type-safe avec migrations de schema, types partages dans le monorepo |
| **PostgreSQL 17** | BDD relationnelle pour l'etat utilisateur ; contenu du curriculum en JSON statique (versionne dans git) |
| **Redis 7** | Store de sessions (connect-redis) + adaptateur pub/sub Socket.IO pour la scalabilite |
| **Turborepo + pnpm** | Monorepo avec cache des taches et builds paralleles — choisi plutot que des templates existants (obsoletes) et T3 Stack (pas adapte) |
| **Tailwind CSS 4** | Systeme de design tokens avec classes utilitaires ; supporte le design system de 20+ composants |
| **Zod dans `packages/shared`** | Source unique de verite pour la validation — memes schemas en frontend et backend |

**Compromis reconnus :**
- JSON statique pour le curriculum (pas en BDD) — versioning plus simple, mais pas d'interface admin pour l'edition du contenu
- Sessions cote serveur via Redis (pas JWT) — flux d'auth plus simple, mais necessite l'infrastructure Redis

---

### Preuves de travail d'equipe

> Y a-t-il des preuves de collaboration efficace ?

**Reponse courte :** Oui. Trois contributeurs avec des roles distincts, visibles dans l'historique git et le README.

**Reponse detaillee :**

- **Roles de l'equipe** documentes dans [`README.md:175-182`](../README.md) :
  | Nom | Role |
  |-----|------|
  | Hugo Ganet | Backend |
  | Arthur | Contenu & Produit |
  | JB | Frontend |

- **L'historique git** montre des commits de tous les membres avec une separation claire du travail :
  - Hugo — API backend, infrastructure, CI/CD, schema de base de donnees
  - Arthur — contenu du curriculum (69 missions EN/FR), i18n, documentation, scenarios QA
  - JB — composants frontend, pages, style

- **Le travail est coordonne :** des branches de fonctionnalites (`feat/arthur-content-curriculum`, `feat/arthur-i18n-spanish`, `feat/components-theo`) montrent des flux de travail paralleles qui mergent dans `main`.

- **La documentation** reflete la collaboration : le README couvre toutes les sections, le document d'architecture capture les decisions de groupe, le fichier d'epics montre la distribution du travail planifiee avec des tags `[BE]`/`[FE]`/`[SHARED]`.

---

## Fonctionnalite

### Stabilite et fonctionnalite

> L'application est-elle fonctionnelle et raisonnablement stable ?

**Reponse courte :** Oui. Le backend est pleinement operationnel avec gestion des erreurs, health checks et 66 fichiers de tests. Sessions multi-utilisateurs supportees via Redis.

**Reponse detaillee :**

- **Gestion des erreurs :**
  - Backend : middleware d'erreur centralise dans [`apps/api/src/middleware/errorHandler.ts`](../apps/api/src/middleware/errorHandler.ts) — capture les `AppError` (erreurs personnalisees avec codes de statut), les `ZodError` (echecs de validation avec details par champ) et les exceptions non gerees (loguees + reponse 500).
  - Frontend : composant [`ErrorBoundary.tsx`](../apps/web/src/components/ErrorBoundary.tsx) qui enveloppe l'application avec une UI de repli elegante et un bouton de reessai.

- **Health check :** `GET /api/v1/health` retourne `{ data: { status: "ok" } }` — utilise par les health checks Docker Compose et surveille dans les tests d'integration CI ([`apps/api/src/__tests__/integration/health.test.ts`](../apps/api/src/__tests__/integration/health.test.ts)).

- **Support multi-utilisateurs :** Sessions stockees dans Redis ([`apps/api/src/config/session.ts`](../apps/api/src/config/session.ts)) avec expiration glissante, cookies securises (`httpOnly`, `sameSite: lax`, `secure` en production). Pool de connexions PostgreSQL (configurable, defaut 10) dans [`apps/api/src/config/database.ts`](../apps/api/src/config/database.ts) avec arret gracieux sur SIGTERM/SIGINT.

- **Couverture de tests :**
  - ~49 fichiers de tests unitaires couvrant middleware, services, routes, handlers socket, utils
  - 17 fichiers de tests d'integration : flux d'auth, progression du curriculum, soumission d'exercices, systeme de tokens, achievements, classement, amis, notifications, presence, streaks, reveals, frais de gas, engagement, profils publics, certificats, RGPD, health
  - Tests smoke E2E Playwright sur Chromium, Firefox, WebKit

- **Pipeline CI** ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) : 5 jobs executes a chaque push — lint & typecheck, tests unitaires, tests d'integration (avec vrais Postgres + Redis), build, validation du contenu.

---

### Qualite globale

> Le projet demontre-t-il de l'effort et de l'apprentissage ?

**Reponse courte :** Oui. Le projet va bien au-dela des exigences minimales — concept original (plateforme d'education blockchain), artefacts de planification extensifs, mecaniques d'apprentissage gamifiees et bonnes pratiques de securite.

**Reponse detaillee :**

- **Concept original :** Pas un jeu de Pong ni un clone de reseau social. Transcendence est une plateforme d'education blockchain gamifiee pour adultes non techniques, inspiree des mecaniques de Duolingo et de l'esthetique de Headspace. 69 missions a travers 6 categories enseignant les concepts blockchain via des exercices interactifs.

- **Va au-dela des exigences minimales :**
  - 17 points de modules revendiques (vs 14 requis)
  - Economie de tokens complete (XP, Knowledge Tokens, frais de gas, mecaniques de dette) avec reveal progressif
  - 4 types d'exercices (Placement Interactif, Appariement de Concepts, Transactions Simulees, Interpretation de Scenarios)
  - Conformite RGPD avec export/suppression de donnees et journalisation d'audit
  - 2FA/TOTP avec stockage chiffre des secrets
  - Planification complete : PRD, spec de design UX, doc d'architecture, roadmap du curriculum, epics & stories — le tout produit avant de commencer a coder

- **Apprentissage demontre :**
  - Premiere construction d'un monorepo avec Turborepo + pnpm workspaces
  - Infrastructure temps reel Socket.IO avec adaptateur Redis
  - Integration OAuth Passport.js (Google, Facebook)
  - ORM Prisma avec schema relationnel complexe (14 modeles)
  - Deploiement Docker multi-services avec health checks et ordonnancement des dependances

- **Creativite :** Mecanique de reveal progressif — les concepts blockchain (tokens, frais de gas, wallets) sont introduits dans le curriculum et simultanement debloques dans l'UI de l'application, pour que l'utilisateur apprenne les tokens au moment meme ou il commence a en gagner.

---

## Verification finale

### Decompte final des modules

> Le total des modules VALIDES atteint-il au moins 14 points ?

**Reponse courte :** Oui. 17 points revendiques, avec 14-15 points solidement valides aujourd'hui et 2-3 points en attente de merges a venir.

**Reponse detaillee :**

| # | Module | Pts | Statut |
|---|--------|-----|--------|
| 1 | Web : FE + BE Frameworks (Majeur) | 2 | Valide |
| 2 | Web : Fonctionnalites temps reel (Majeur) | 2 | Valide |
| 3 | Web : Interaction utilisateur (Majeur) | 2 | En attente — chat en cours de merge |
| 4 | User Mgmt : Gestion standard des utilisateurs (Majeur) | 2 | Valide |
| 5 | Web : ORM (Mineur) | 1 | Valide |
| 6 | Web : Systeme de notifications (Mineur) | 1 | Valide |
| 7 | Web : Design system personnalise (Mineur) | 1 | Valide |
| 8 | User Mgmt : OAuth 2.0 (Mineur) | 1 | Valide |
| 9 | User Mgmt : 2FA (Mineur) | 1 | Valide |
| 10 | Gaming : Gamification (Mineur) | 1 | Valide |
| 11 | Accessibilite : Langues multiples (Mineur) | 1 | En attente — espagnol en cours de merge |
| 12 | Accessibilite : Navigateurs supplementaires (Mineur) | 1 | Valide |
| 13 | Donnees : Conformite RGPD (Mineur) | 1 | Valide |
| | **Valides aujourd'hui** | **14** | |
| | **Apres merges** | **17** | |

Decompte conservateur (sans les merges en attente) : **14 pts** — atteint exactement le seuil.
Avec les deux merges completes : **17 pts** — marge de 3 points.

---

### Succes du projet

> Considerez-vous cela comme un projet de groupe reussi ?

**Reponse courte :** Oui. La partie obligatoire est complete, tous les membres de l'equipe ont contribue, les decisions techniques sont documentees et justifiees, et le decompte des modules atteint ou depasse l'exigence de 14 points.

**Reponse detaillee :**

| Critere | Evaluation |
|---------|-----------|
| **Partie obligatoire complete et fonctionnelle ?** | Oui — frontend, backend, base de donnees, deploiement Docker, HTTPS, pages privacy/terms, design responsive, validation des formulaires, auth securisee |
| **Tous les membres ont contribue de maniere significative ?** | Oui — Hugo (backend/infra), Arthur (contenu/i18n/produit), JB (frontend/composants). L'historique git confirme les contributions de tous les membres |
| **L'equipe peut-elle expliquer son travail et ses decisions ?** | Oui — le doc d'architecture couvre tous les choix techniques avec leur justification. Chaque membre est responsable de fonctionnalites specifiques qu'il peut presenter et expliquer |
| **Respecte les exigences du sujet ?** | Oui — 14-17 points de modules (selon les merges en attente), toutes les exigences generales et techniques satisfaites |
| **README complet et precis ?** | Oui — contient la description du projet, les roles de l'equipe, la stack technique, le mapping des modules avec le calcul des points, la reference au schema de base de donnees et les liens vers la documentation |
