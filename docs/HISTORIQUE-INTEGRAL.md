# TERANGA BUSINESS
## Historique intégral du projet & dossier complet
### De la première ligne de code jusqu'à aujourd'hui — tout, sans rien omettre

> Document rédigé à partir du dépôt Git, du code source, de la documentation officielle et de tout le travail réalisé entre début août 2026 et septembre 2026.
> Créateur du projet : **Serigne Salio Dia Boop**

---

# PARTIE 1 — LE PROJET

## 1. Qu'est-ce que Teranga Business ?

**Teranga Business** est une **marketplace e-commerce multi-vendeurs** conçue pour le marché sénégalais. C'est une plateforme de commerce et de services en ligne où :

- **Les clients** achètent des produits et services en ligne, avec des moyens de paiement locaux : **Wave**, **Orange Money** et **paiement à la livraison (COD)** ;
- **Les vendeurs** (commerçants, artisans, prestataires) créent leur propre boutique en ligne, publient leurs produits (physiques ou numériques) et gèrent commandes, revenus et statistiques ;
- **Teranga Business** administre la plateforme et perçoit une **commission** sur chaque vente.

Le mot « Teranga » vient du wolof : c'est l'**hospitalité**, la valeur culturelle sénégalaise par excellence. L'idée du projet est d'apporter cette hospitalité au commerce en ligne : une plateforme **pensée au Sénégal, pour le Sénégal**, en français, avec des prix en **francs CFA (XOF)**, et adaptée aux réalités locales (paiement mobile, livraison, vente par WhatsApp).

## 2. La vision

Permettre à chaque commerçant, artisan et prestataire sénégalais de vendre et de se développer en ligne, et offrir à chaque acheteur un accès simple, fiable et sécurisé aux produits et services locaux.

**Le slogan** : « La marketplace des commerçants du Sénégal »  
**Slogan alternatif** : « Acheter et vendre en ligne au Sénégal »

## 3. Les problèmes que le projet résout

1. Difficulté des commerçants locaux à accéder à la vente en ligne (barrières techniques, coûts, formation) ;
2. Manque de confiance dans l'achat en ligne (paiement à la livraison, avis, suivi) ;
3. Absence de moyens de paiement adaptés au marché (Wave, Orange Money) sur les grandes places de marché internationales ;
4. Livraison non structurée pour les commerçants indépendants ;
5. Dépendance aux géants étrangers peu adaptés au contexte local.

## 4. Les 3 rôles de la plateforme

| Rôle | Type | Accès |
|---|---|---|
| **Client** (USER) | compte client | espace `/account` |
| **Vendeur** (SellerProfile ACTIVE) | casquette cumulable sur un compte USER | espace `/seller` |
| **Administrateur** (ADMIN) | gère la plateforme | espace `/admin` |

Le modèle de rôle est particulier : un utilisateur peut être **client seul** ou **client + vendeur** (il n'existe pas de rôle « VENDEUR » séparé — la casquette vendeur est un statut optionnel via `SellerProfile`).

---

# PARTIE 2 — LA TECHNOLOGIE UTILISÉE (STACK COMPLET)

| Domaine | Technologie | Version |
|---|---|---|
| Framework | **Next.js** (App Router, fullstack SSR/RSC) | 16.3.1 |
| Langage | **TypeScript** (mode strict) | 5.9.3 |
| Style | **Tailwind CSS** + **shadcn/ui** | Tailwind 4 |
| Base de données | **PostgreSQL** (Supabase en production, Docker en local) | 17 |
| ORM | **Prisma** (+ driver adapter `@prisma/adapter-pg`) | 7.9.1 |
| Authentification | **Auth.js / NextAuth** (Credentials, session JWT 7 jours, bcrypt) | 4.24.15 |
| Validation | **Zod** | 4.4.3 |
| Formulaires | **React Hook Form** | 7.85.0 |
| État serveur client | **TanStack Query** | 5.101.4 |
| Graphiques | **Recharts** | 3.10.1 |
| Icônes | **lucide-react** | 1.31.0 |
| Images & médias | **Cloudinary** | 2.10.0 |
| Emails | **Nodemailer / SMTP** (6 templates) | 7.0.13 |
| UI primitives | **radix-ui** (preset nova) | 1.6.7 |
| Thème | **next-themes** + **tw-animate-css** | — |
| QR codes | **qrcode.react** | 4.2.0 |
| PWA | service worker `sw.js` + `manifest.json` | — |
| Mobile natif | **Capacitor** (Android + iOS) | 8.5.0 |
| Test | **Jest** + ts-jest | 30.4.2 |
| Lint | **ESLint** flat config (core-web-vitals + typescript) | 9 |
| Devise | XOF, formatage `Intl.NumberFormat("fr-SN")`, montants **BigInt** | — |
| Langue | Français (`lang="fr"`), Wolof prévu | — |

## Les scripts npm

| Commande | Action |
|---|---|
| `npm run dev` | Serveur de développement (port 3000) |
| `npm run build` | `prisma generate && next build` |
| `npm run start` | Serveur de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Jest |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:push` | `prisma db push` |
| `npm run db:seed` | `prisma db seed` (via tsx) |
| `postinstall` | `prisma generate` |

## Organisation du code

```
src/
├── app/                  # App Router (routes, layouts, API)
│   ├── (public)/         # pages publiques
│   ├── (auth)/           # login, register
│   ├── (account)/        # espace client
│   ├── (seller)/         # espace vendeur
│   ├── (admin)/          # espace administrateur
│   ├── api/              # route handlers
│   ├── checkout/         # checkout + confirmation
│   ├── create-store/     # landing création boutique
│   └── store/            # vitrines de boutiques
├── components/           # 20 dossiers de composants (ui, layout, product…)
├── lib/                  # prisma, auth, email, payments, cloudinary…
├── server/actions/       # 29 fichiers de Server Actions
├── proxy.ts              # garde d'authentification des routes (ex-middleware)
├── generated/prisma/     # client Prisma généré (ignoré par Git)
├── types/                # augmentation des types next-auth
└── constants/ hooks/ messages/ server/services/   # dossiers prévus (vides)
```

---

# PARTIE 3 — L'HISTORIQUE COMPLET DU DÉVELOPPEMENT

Tout est retracé ci-dessous par **phase**, avec pour chaque phase les décisions, les livrables et les commits correspondants (historique réel du dépôt).

## PHASE 0 — La préparation

### Décisions initiales (document d'architecture « VERSION 2 » validé par le propriétaire)

- Stack validée : **Next.js 16.3.1 / TypeScript / Tailwind CSS 4 / Prisma 7 / PostgreSQL 17** ;
- **TypeScript fixé sur 5.9.3** (repli validé car `typescript-eslint` n'était pas compatible avec TypeScript 7.0.2) ;
- Commandes multi-vendeurs : `Order → SubOrder → OrderItem` ;
- Commission par vendeur en **points de base** (`rateBp`, 10 % = 1000) ;
- Livraison mixte : règle vendeur > règle plateforme > fallback global ;
- Paiements abstraits via interface `PaymentProvider`, **aucun paiement simulé** ;
- Règles du projet : aucune phase ne commence sans validation explicite ; aucun secret dans le dépôt Git ; calculs financiers en entiers côté serveur uniquement ; cloisonnement vendeur vérifié à chaque couche.

### Commit initial

```
24738b0  |  Phase 2 : initialisation du projet Teranga Business  (2026-08-15)
```

## PHASE 1 — Initialisation du scaffold

Le projet a été initialisé avec l'outillage standard Next.js (scaffold, config TypeScript, ESLint flat config, Tailwind).

## PHASE 2 — Setup Prisma et placeholder

```
3dcb6af  |  Phase 2 : exclure le client Prisma généré du lint ESLint
db3d09e  |  Phase 2 : câbler le seed Prisma (tsx) et le placeholder prisma/seed.ts
29d7411  |  Phase 2 : remplacer la page d'accueil scaffold par un placeholder Teranga Business
```

- Mise en place de la structure Prisma avec générateur `prisma-client` et sortie `src/generated/prisma` ;
- Seed de base branché sur `tsx` ;
- Page d'accueil placeholder « Teranga Business » ;
- Le dossier `src/generated/` ajouté aux `globalIgnores` d'ESLint.

## PHASE 3 — Schéma de base de données complet V2 + migration + seed démo

```
8741ad0  |  Phase 3 : schéma Prisma complet V2, migration initiale et seed de démonstration  (2026-08-16)
```

- **Migration initiale** `20260816004559_init` : création complète de la base (tous les enums et tables, y compris `PaymentMethod` avec `CARD`) ;
- Migration `20260816072608_media_asset_public_id` : ajout de `MediaAsset.publicId` (pour Cloudinary) ;
- Migration `20260816211431_add_product_low_stock_threshold` : ajout de `Product.lowStockThreshold` ;
- **Seed de démonstration** : utilisateurs (admin + vendeurs + clients), boutiques, 16 catégories (7 parents + 9 enfants), 6 produits (5 publiés + 1 brouillon), adresses, règles de livraison, coupons, réglages. Mots de passe hachés en bcrypt (coût 12) ;
- Documentation de référence écrite : `docs/ARCHITECTURE.md` et `docs/DATABASE.md`.

## PHASE 3 bis — Base locale (Docker + Adminer)

```
aeb7187  |  Adminer : formulaire prérempli + identifiants DB mis à jour + corrections docs  (2026-08-16)
```

- `docker-compose.yml` : PostgreSQL 17 (`teranga-db`) + Adminer (interface web DB, port 8080) avec formulaire prérempli via plugin PHP ;
- Corrections de la documentation.

## PHASE 4 — Authentification complète

Architecture décidée en phase 4 (voir `docs/ARCHITECTURE.md`) : NextAuth.js 4.24.15 (Credentials + JWT), protection des routes via `proxy.ts`, `register` server action avec Zod + bcrypt, SessionProvider, types augmentés.

Les commits de cette phase (retracés plus bas dans la « ligne du temps des corrections ») concernent surtout la **stabilisation de la connexion** :

```
142ac5c  |  fix: remove mergeGuestCart blocking login redirect
f1b81cd  |  fix: clean unused imports in login-form
e04afe1  |  fix: proxy crashes on invalid tokens - wrap decode in try-catch
4bdc53d  |  fix: use server-side redirect in loginAction instead of client window.location
43280d8  |  fix: login via API route instead of server action for reliable cookie setting
d0ff2a6  |  fix: theme toggle resolvedTheme, error handling in notification-bell and global-search
d1a4a48  |  fix: login - discriminated union types + error param + cookie commit delay
455eea8  |  fix: session desync - set single NextAuth-consistent cookie per env  (2026-08-30)
```

**Description détaillée des choix d'authentification retenus :**
- `CredentialsProvider` avec validation Zod ;
- Hachage des mots de passe avec **bcryptjs** ;
- Stratégie de session : **JWT** (7 jours) ;
- Page de connexion : `/login` ;
- Callbacks `jwt` et `session` bien configurés (le rôle, `isActive` et `id` sont ajoutés à la session) ;
- **Route API de login personnalisée** `POST /api/auth/login` : rate-limit 5 requêtes / 60 s, bcrypt, encoding JWT NextAuth, pose **un seul cookie** cohérent (`__Secure-next-auth.session-token` en production, `next-auth.session-token` en développement), `safeRedirect()` anti open-redirect, accepte JSON et `formData`, codes 401 / 303 / 500 / 503 (ENETUNREACH) — construit pour régler le problème de session qui ne « tenait » pas ;
- **Proxy** (`src/proxy.ts`, l'ex-middleware dans Next 16) : garde d'authentification globale par décodage du JWT ; routes publiques : `/login`, `/register`, `/shop`, `/products`, `/categories`, `/create-store` + préfixes `/store/`, `/category/`, `/product/`, `/share/` + `/robots.txt`, `/sitemap.xml` ; redirection des connectés loin de `/login|/register`, redirection des non-connectés vers `/login?callbackUrl=...` ;
- Le contrôle fin des rôles est **délégué aux layouts** (`/admin` exige `role === ADMIN`, `/seller` exige `sellerProfile.status === "ACTIVE"`, `/account` exige une session).

## PHASE 5 — Cloudinary (médiathèque)

### Commit de la phase

```
8fb2381  |  fix: trim Cloudinary env values (trailing space in API key broke uploads)  (2026-08-30)
```

### Ce qui a été fait
- SDK `cloudinary` installé, variables `CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET` en env, `MediaAsset.publicId` ajouté en base ;
- **Route handler** `POST /api/media/upload` : upload multipart (formats jpeg/png/webp/gif/avif/mp4/webm, 8 Mo image / 50 Mo vidéo), création d'une `MediaAsset` avec position automatique, contrôle d'accès `requireMediaActor` + `assertCanManageTarget` ;
- **Route handler** `DELETE /api/media/[id]` : suppression Cloudinary + ligne DB, contrôle `isMediaOwnerOrAdmin` ; `params` en `Promise` (convention Next 16) ;
- `images.remotePatterns` configuré pour `https://res.cloudinary.com/**` ;
- Composants d'upload (`image-upload.tsx`) et de galerie (`product-gallery.tsx`).
- **Correction notable** : nettoyage (`trim`) des valeurs Cloudinary issues de l'environnement — une espace parasite dans la clé API cassait les uploads.

## PHASE 6 — Catalogue complet

### Ce qui a été fait (cf. journal des décisions)
- **Admin** : CRUD catégories / produits / boutiques (listes, formulaires, suppression) : `CategoryForm`, `ProductForm` (25 Ko), `ImageUpload`, `DeleteButton`, `StoreForm` ;
- **Pages publiques** : homepage marketplace, listings, détails produit/catégorie/boutique avec galerie + SEO + breadcrumbs, filtres/recherche/pagination produits, `ProductFilters`, `ProductGallery`.

---

# PARTIE 4 — LA LIGNE DU TEMPS DES CORRECTIONS (évolution vers la stabilité)

Entre les phases initiales et la version v1.0, le projet a traversé une **longue phase de stabilisation**. Voici l'historique complet des commits dans l'ordre chronologique.

## 22 août 2026 — Mise en production et premiers déploiements

```
64d9558  |  feat: Teranga Business - marketplace multi-vendeurs complet
8008c3e  |  chore: exclude CI workflow, add .gitignore entries
1cbdd91  |  chore: remove temporary files, keep only Teranga Business project
0f79164  |  fix: add force-dynamic to all pages with DB queries for Vercel build
ea4b0f9  |  fix: force-dynamic all remaining pages with DB queries
db9fb64  |  fix: remove standalone output for Vercel compatibility
```

- Le gros livrable initial `64d9558` : la marketplace multi-vendeurs complète (toutes les pages, actions et composants) ;
- Ajout des exclusions `.gitignore` (le workflow CI exclu car il utilisait des secrets env) ;
- Nettoyage des fichiers temporaires ;
- **Forçage `force-dynamic`** sur toutes les pages avec requêtes DB pour que le build Vercel fonctionne (sinon les données statiques au build seraient figées / incompatibles) ;
- Retrait du `output: standalone` (incompatible avec la méthode de déploiement Vercel retenue).

## Été 2026 — Correction de l'authentification en production

```
0b382e4  |  fix: login cookie + full page redirect for session persistence
6e61844  |  fix: use correct Secure cookie name in production login
7b1568d  |  debug: add health endpoint + fix DB URL in .env.production
5275a9a  |  debug: raw pg pool health check with error details
fd8f1af  |  fix: strip BOM from DATABASE_URL + improve error logging
89e4442  |  fix: correct BOM stripping in health endpoint
0981b04  |  fix: clean up health endpoint, keep BOM fix in prisma.ts
c28d5e9  |  fix: make site publicly browsable without login
d2051b3  |  fix: header resilience - try/catch DB calls so page renders even if DB is down
7b892ee  |  fix: homepage requires auth - redirect to /login
```

> Note : la série `c28d5e9` puis `7b892ee` montre une oscillation sur l'accès public → finalement resté **public** (voir commit suivant qui le confirme).

## 23 août 2026 — Stabilisation proxy/session

```
f250520  |  fix: use decode() from next-auth/jwt in proxy - handles JWE tokens
84560a9  |  fix: use jose jwtVerify directly in proxy instead of getToken
87cd021  |  fix: simplify PrismaPg adapter - let Prisma manage own connection pool
7b892ee  |  (ci-dessus)
```

## 24 août 2026 — Durcissement & corrections

```
a40630c  |  fix: seller access - always show 'Devenir vendeur' link in profile menu, redirect no-profile users
386bcb4  |  fix: seller layout - show 'Créer ma boutique' CTA instead of dead-end 'indisponible'
ab81dd4  |  fix: resilience - try/catch on all server DB queries, notification bell .catch()
d1a4a48  |  fix: login - discriminated union types + error param + cookie commit delay
d0ff2a6  |  fix: theme toggle resolvedTheme, error handling
43280d8  |  fix: login via API route instead of server action
4bdc53d  |  fix: use server-side redirect in loginAction
e04afe1  |  fix: proxy crashes on invalid tokens - wrap decode in try-catch
f1b81cd  |  fix: clean unused imports in login-form
142ac5c  |  fix: remove mergeGuestCart blocking login redirect
```

## 25–26 août 2026 — Boutons vendeur et sauvegarde contre les crashs

```
fd25fcb  |  fix: seller layout - clean CTA without redirect to avoid RSC crash
6b3a7ec  |  chore: force Vercel rebuild
c5c0cf8  |  fix: seller pages - graceful fallback instead of crash when no seller profile (RSC 500 fix)
55fb47a  |  chore: force clean rebuild 2026-08-26 20:49:20
5d60145  |  fix: seller pages - return null on error, remove unused redirect imports (RSC 500 fix)
```

Le problème résolu : les pages vendeur **crashaient en 500** quand l'utilisateur n'avait pas de profil vendeur (erreurs RSC). Solutions : retour `null`/fallback élégant + CTA « Créer ma boutique » au lieu d'une impasse, suppression des imports de `redirect` inutilisés.

## 29 août 2026 — PWA et app mobile Capacitor

```
81c4695  |  feat: PWA améliorée (icônes PNG, service worker, shortcuts) + app mobile Capacitor (Android/iOS) + guide de build  (2026-08-29)
b24ba5c  |  fix: add apple-touch-icon and PWA icons metadata to layout
```

- **PWA** : icônes PNG (`icon-192x192.png`, `icon-512x512.png`, `apple-touch-icon.png`), `manifest.json`, service worker `sw.js` avec raccourcis, `next/font` auto-hébergées ;
- **Capacitor** : ajout des plateformes Android et iOS, `capacitor.config.ts` (`appId: sn.terangabusiness.app`, appName « Teranga Business », `server.url` pointant vers le site en ligne, `androidScheme: https`, `allowMixedContent: true`, `ios.contentInset: 'never'`) ;
- Guides de build : `MOBILE_BUILD.md` + `GUIDE-iOS.md`.

## 30 août 2026 — Pg pool, SSL Supabase, seller role, session (dernières corrections majeur)

```
a31d12c  |  fix: resolve pool exhaustion (EMAXCONNSESSION) - remove per-request DB lookup from jwt callback, add bounded pg pool
ba33224  |  fix: disable TLS cert validation for Supabase pooler (rejectUnauthorized false)
d7d9a34  |  fix: strip sslmode from URL and control TLS via pool options (fix Supabase cert error)
8fb2381  |  fix: trim Cloudinary env values
4801553  |  fix: seller area blocked - proxy checked nonexistent SELLER role, redirecting all sellers to home
455eea8  |  fix: session desync - set single NextAuth-consistent cookie per env
```

**Trois corrections capitales :**
1. **Épuisement du pool de connexions (EMAXCONNSESSION)** : le callback JWT faisait une requête DB à chaque requête ; on l'a retirée et on a mis en place un pool `pg` borné (max 10, idle 30 s, timeout 10 s, `ssl: rejectUnauthorized: false`) ;
2. **Erreur de certificat SSL Supabase** : suppression de `sslmode` de l'URL et contrôle du TLS via les options du pool ;
3. **Zone vendeur bloquée** : le proxy vérifiait un rôle `SELLER` qui **n'existe pas** (le rôle vendeur est `SellerProfile.status`, pas un `User.role`) — tout le monde était redirigé vers l'accueil. Corrigé.

---

# PARTIE 5 — LA VERSION 1.0 ET LE LANCEMENT

## 5 septembre 2026 — SEO et visibilité

```
451a7c3  |  docs: description officielle trilingue FR/EN/ZH + SEO + visibilité  (2026-09-05)
15ad2aa  |  seo: metadataBase, Open Graph, Twitter cards, canonical, sitemap/robots with constants, og-image  (2026-09-05)
```

- Rédaction complète des documents de visibilité : `DESCRIPTION-OFFICIELLE.md`, `DESCRIPTION-TRILINGUE.md` (FR/EN/ZH), `BILLINGUE-RESEAUX-SOCIAUX.md` (FR/Wolof + textes réseaux sociaux), `VIDEO_SCRIPT.md` (scénario vidéo 8-10 min), `LANCEMENT-SEO-VISIBILITE.md` (analyse réelle + recommandations A–M) ;
- Implémentation SEO technique : `metadataBase`, Open Graph, Twitter cards, canonical, `sitemap.ts` dynamique + `robots.ts`, `og-image.png` (1200×630), constantes centralisées (`src/lib/constants.ts`).

## 10 septembre 2026 — La v1.0

```
40be3e9  |  v1.0: boutons retour, partage réel, header masqué mini-site, config iOS, GitHub Actions, APK  (2026-09-10)
7d5b77b  |  Paiements mobiles Wave/Orange Money: câblage initPayment, redirection, page de confirmation avec statut temps réel
facb9aa  |  SEO: Google Analytics, Schema.org Organization/WebSite/SearchAction, BreadcrumbList, security headers, OG type product
9420e22  |  Wave: mise à jour vers Checkout API v1/checkout/sessions + nouveau format webhook
```

### Le contenu de la v1.0 (`40be3e9`)
- **Boutons retour** ajoutés pour la navigation (notamment dans tout l'espace boutique) ;
- **Partage réel** fonctionnel (composants `share-buttons`, `share-page`, `whatsapp-share`, tracking des clics) ;
- **Header masqué sur le mini-site** (les boutiques s'affichent comme un site autonome, compromis de navigation) ;
- **Configuration iOS** complète (`ios/App/App.xcodeproj` avec schéma App) + **GitHub Actions** pour iOS (`ios-build.yml`) ;
- **APK Android** généré et livré (`APK LIVRAISON/TerangaBusiness-v1.0-apk-debug.apk`, 4,8 Mo).

### Le câblage des paiements mobiles (`7d5b77b`)
- `src/lib/payments/index.ts` : `initPayment(provider, params)` avec dispatch Wave / Orange Money / COD ;
- `checkout.ts` et `place-store-order.ts` : appelent `initPayment()` et retournent `paymentUrl` ;
- `checkout-client.tsx` et `store-cart-page.tsx` : redirigent vers l'URL de paiement ;
- **Nouvel endpoint** `GET /api/payments/status?orderId=` : sonde le statut d'un paiement ;
- Réécriture de la page `confirmation/[orderId]` : statut PENDING / SUCCESS / FAILED avec polling automatique ;
- Variables d'environnement ajoutées (`.env` et `.env.example`) ; les URLs de retour sont **dynamiques** (avec `orderId`) au lieu des constantes statiques.

### Le SEO + Google Analytics (`facb9aa`)
- Nouveau composant `src/components/analytics/google-analytics.tsx` (GA4, `NEXT_PUBLIC_GA_MEASUREMENT_ID = G-KR7K5VZDVE`) ;
- **JSON-LD Schema.org** `Organization` + `WebSite`/`SearchAction` dans le layout racine ;
- **BreadcrumbList** structuré sur les pages produit et boutique ;
- **En-têtes de sécurité** dans `next.config.ts` + `poweredByHeader: false`.

### La mise à jour de l'API Wave (`9420e22`)
- Passage à l'API **Checkout** moderne : `POST /v1/checkout/sessions` (au lieu de `/v1/merchant/payments`) ;
- Redirection via `data.payment_url` (au lieu de `data.url`) ;
- Enregistrement de `data.id` comme `providerTransactionId` ;
- Mise à jour de `verifyWaveWebhook` au **nouveau format imbriqué** `data.payment_status` / `data.reference` / `data.id`, avec mapping SUCCESSFUL/COMPLETED → SUCCESS et FAILED/EXPIRED/CANCELLED → FAILED.

---

# PARTIE 6 — LA BASE DE DONNÉES (DÉTAIL COMPLET)

## 6.1 Les migrations

| Migration | Contenu |
|---|---|
| `20260816004559_init` | Création complète (tous enums + tables). `PaymentMethod` incluait `CARD` ; `RefundStatus` = PENDING/PROCESSED/FAILED |
| `20260816072608_media_asset_public_id` | `ALTER TABLE "MediaAsset" ADD COLUMN "publicId" TEXT` |
| `20260816211431_add_product_low_stock_threshold` | `ALTER TABLE "Product" ADD COLUMN "lowStockThreshold" INTEGER DEFAULT 0` |
| `20260817_remove_card_payment` | Retrait de la valeur `CARD` de l'enum `PaymentMethod` (WAVE, ORANGE_MONEY, COD) |
| `20260819015921_add_share_models` | `ShareTargetType` + tables `ShareLink`, `ShareEvent` |
| `migration_lock.toml` | `provider = "postgresql"` |

## 6.2 Les 18 énumérations

```
Role: USER, ADMIN
SellerStatus: PENDING, ACTIVE, SUSPENDED, REJECTED
ProductStatus: DRAFT, PUBLISHED, ARCHIVED
OrderStatus: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED, PARTIALLY_REFUNDED
SubOrderStatus: PENDING, ACCEPTED, REJECTED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
PaymentMethod: WAVE, ORANGE_MONEY, COD
PaymentStatus: PENDING, SUCCESS, FAILED, REFUNDED, PARTIALLY_REFUNDED
RefundStatus: PENDING, APPROVED, REJECTED, PROCESSED, FAILED
DeliveryMethod: STANDARD, EXPRESS, PICKUP
DeliveryScope: GLOBAL, PLATFORM, VENDOR
DeliveryStatus: PENDING, PROCESSING, SHIPPED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED
CommissionStatus: PENDING, PAID
ReviewStatus: PENDING, APPROVED, REJECTED
CouponType: PERCENT_BP, FIXED
NotificationType: ORDER, PAYMENT, DELIVERY, SYSTEM
MediaType: IMAGE, VIDEO
StoreTheme: BANNER, SIDEBAR, EDITORIAL, GALLERY, SHOWCASE, MOSAIC
SellerPlan: FREE, ESSENTIAL, PRO, CREATOR
ShareTargetType: PRODUCT, STORE, CATEGORY
```

## 6.3 Les 31 modèles (résumé détaillé)

### Comptes, vendeurs, boutiques
| Modèle | Détail |
|---|---|
| `User` | `id` (cuid), `name`, `email` (unique), `emailVerified`, `passwordHash`, `image`, `phone`, `role` (default USER), `isActive`, `lastLoginAt`, timestamps. |
| `SellerProfile` | 1-1 avec User. `status` (PENDING), `commissionRateBp Int?`, `isVerified`, `verificationNote?`, `plan` (FREE), `planExpiresAt?`. |
| `Store` | 1-1 avec SellerProfile. `name`, `slug` unique, `description?`, `logoUrl?`, `bannerUrl?`, `whatsapp?`, `qrCodeUrl?`, `qrWaveUrl?`, `qrOrangeMoneyUrl?`, `returnPolicy?`, `shippingPolicy?`, `theme` (BANNER), `storeTheme Json?`, `isActive`, `ratingAvg Decimal(3,2)`, `ratingCount`. |
| `StoreUser` | Équipe d'une boutique : `storeId`, `userId`, `role` (default MEMBER). Unique `[storeId, userId]`. |
| `SocialLink` | Réseaux sociaux d'une boutique. Unique `[storeId, platform]`. |

### Catalogue
| Modèle | Détail |
|---|---|
| `Category` | Catégories hiérarchiques (`parentId`). `slug` unique, `sortOrder`, `isActive`. |
| `Product` | `storeId`, `categoryId`, `name`, `slug` unique, **`price BigInt`**, `currency` (XOF), `discountPrice BigInt?`, `stock Int`, `sku?`, `lowStockThreshold`, `status` (DRAFT), `isFeatured`, `isDigital`, `digitalFileUrl?`, `digitalFileSize?`, `ratingAvg`, `ratingCount`, `soldCount`. |
| `MediaAsset` | Médias produits/boutiques : `url`, `publicId?` (Cloudinary), `alt?`, `type` (IMAGE), `position`. |

### Panier & adresses
| Modèle | Détail |
|---|---|
| `Cart` | Panier lié à `userId?` (unique) **ou** à `sessionId?` (invité). |
| `CartItem` | Ligne panier, quantité. Unique `[cartId, productId]`. |
| `Address` | Adresses de l'utilisateur : `label`, `fullName`, `phone`, `country` (SN), `region`, `city`, `addressLine`, `isDefault`. |

### Commandes multi-vendeurs
| Modèle | Détail |
|---|---|
| `Order` | `number` unique, `userId?`, `sessionId?`, `guestEmail?`, `guestPhone?`, `status`, `paymentStatus`, `currency`, `subtotal`, `deliveryTotal`, `discountTotal`, `commissionTotal`, `grandTotal` (BigInt), adresses en snapshots JSON, `metadata Json?`, `placedAt`. |
| `SubOrder` | Sous-commande par vendeur : `storeId`, `sellerProfileId`, `status`, `subtotal`, `deliveryFee`, `discount`, **`commissionRateBp Int`**, `commissionAmount`, `payableAmount`, adresse snapshot JSON. |
| `OrderItem` | Snapshot produit : `productName`, `productImage?`, `unitPrice`, `quantity`, `lineTotal`. |
| `OrderStatusHistory` | Historique des statuts de la commande (`note?`, `changedBy?`). |

### Paiements & remboursements
| Modèle | Détail |
|---|---|
| `Payment` | 1-1 avec Order. `method`, `provider?`, `providerTransactionId?` (unique), `amount`, `status`, `metadata Json?`. |
| `PaymentSplit` | Répartition du paiement par sous-commande (`amount`, `status`). |
| `Refund` | Remboursement (`paymentId`, `subOrderId?`, `amount`, `reason`, `providerTransactionId?`, `status`). |
| `Commission` | Commission plateforme par sous-commande (`rateBp`, `amount`, statut PENDING/PAID). |

### Livraison
| Modèle | Détail |
|---|---|
| `Delivery` | 1-1 avec SubOrder : `method` (STANDARD), `provider?`, `trackingNumber?`, `status` (PENDING), `fee`, `zone?`, `estimatedDays?`, `shippedAt?`, `deliveredAt?`. |
| `DeliveryRule` | Règles : `storeId?`, `scope` (GLOBAL), `method`, `zone?`, `minCartValue`, `fee`, `freeAbove?`, `priority`, `isActive`. |
| `DeliveryStatusHistory` | Historique des statuts de livraison. |

### Engagement
| Modèle | Détail |
|---|---|
| `Review` | Avis 1-5, unique `[productId, userId]`, lié optionnellement à un `OrderItem` (achat vérifié). `status` PENDING. |
| `Favorite` | Favoris. Unique `[userId, productId]`. |
| `Coupon` | `code` unique, `type` (PERCENT_BP/FIXED), `value BigInt`, `minCartValue`, `maxDiscount?`, `maxUses?`, `usedCount`, périmètre PLATFORM/STORE, `storeId?`, `productId?`. |

### Système & commerce social
| Modèle | Détail |
|---|---|
| `Notification` | Notifications utilisateur : `type`, `title`, `content?`, `link?`, `isRead`. |
| `Setting` | Réglages plateforme clé/valeur Json. |
| `AuditLog` | Journal d'audit : `action`, `entityType`, `entityId?`, `before/after Json?`, `ip?`. |
| `ShareLink` | Lien de partage : `targetType` (PRODUCT/STORE/CATEGORY), `targetId`, `channelId`, `url`, `clicks`, `shares`. Unique `[targetType, targetId, channelId]`. |
| `ShareEvent` | Événement de partage : `shareLinkId`, `userId?`, `channel`, `ip?`, `userAgent?`, `referrer?`. |

## 6.4 Les règles d'argent (critiques)

1. **BIGINT minor units** : montants en `BigInt`, XOF = 1 FCFA = 1 minor unit. **Jamais de flottants** ;
2. Taux de commission en **points de base** (`rateBp` : 10 % = 1000) ;
3. Calculs financiers **côté serveur uniquement** ; prix **relus depuis PostgreSQL** (snapshots au moment de la commande) — jamais acceptés du navigateur ;
4. Stock : décrément **atomique conditionnel** (`UPDATE ... WHERE stock >= qty`) en transaction, rollback complet si insuffisant ;
5. Statut global `Order` **dérivé** des sous-commandes ;
6. Cloisonnement vendeur : `SubOrder.storeId` + `sellerProfileId` en `Restrict`.

## 6.5 L'ordre de résolution de la livraison mixte

1. **Règle vendeur** (`DeliveryRule.scope = VENDOR`, priorité la plus haute)
2. **Règle plateforme** (`PLATFORM`)
3. **Fallback global** (`GLOBAL`) — configurable via `Setting delivery.globalFallbackFee`

L'admin contrôle les règles plateforme/global ; le vendeur gère les siennes.

---

# PARTIE 7 — L'APPLICATION (TOUTES LES PAGES)

## 7.1 Pages publiques

| Route | Description |
|---|---|
| `/` | Accueil : héros, statistiques, catégories, boutiques, produits |
| `/products` | Liste globale des produits (+ filtres, recherche, pagination) |
| `/categories` | Toutes les catégories |
| `/category/[slug]` | Produits d'une catégorie |
| `/product/[slug]` | Fiche produit (galerie, prix, avis, similaires) — JSON-LD BreadcrumbList |
| `/shop` | Annuaire des boutiques — drawer de catégories mobile |
| `/cart` | Panier global |
| `/share/[type]/[slug]` | Page de partage traçable (product/store/category) |
| `/create-store` | Landing marketing « créez votre boutique » en 5 étapes |

## 7.2 Auth

| Route | Description |
|---|---|
| `/login` | Connexion |
| `/register` | Inscription |

## 7.3 Espace client (`/account`)

| Route | Description |
|---|---|
| `/account` | Dashboard compte |
| `/account/orders` | Historique des commandes |
| `/account/orders/[id]` | Détail d'une commande |
| `/account/orders/[id]/digital` | Téléchargement des produits numériques de la commande |
| `/account/addresses` | Gestion des adresses |
| `/account/favorites` | Favoris |
| `/account/notifications` | Notifications (+ marquer lues, tout marquer lu) |
| `/account/profile` | Profil |
| `/account/reviews` | Mes avis + suppression |
| `/account/become-seller` | Demande pour devenir vendeur |
| `/account/deliveries/[id]` | Suivi de livraison |

## 7.4 Espace vendeur (`/seller`)

| Route | Description |
|---|---|
| `/seller` | Dashboard vendeur (commandes du jour, revenus, produits actifs) |
| `/seller/products` | Gestion des produits |
| `/seller/products/new` | Création d'un produit |
| `/seller/products/[id]` | Édition d'un produit |
| `/seller/orders` | Commandes de la boutique |
| `/seller/orders/[id]` | Détail + actions sous-commandes |
| `/seller/categories` | Catégories de la boutique |
| `/seller/analytics` | Statistiques (4 graphiques : revenus mensuels, commandes par statut, revenus, top produits) |
| `/seller/revenue` | Revenus et commissions |
| `/seller/settings` | Réglages de la boutique (couleurs, polices, thème, réseaux sociaux) |

## 7.5 Espace admin (`/admin`)

| Route | Description |
|---|---|
| `/admin` | Tableau de bord (graphiques + cartes) |
| `/admin/analytics` | Analytics avancés (6 charts : revenus, statuts, paiements, top produits, top boutiques, tendances utilisateurs) |
| `/admin/products` (+ new, + [id]) | Gestion produits (table + formulaires) |
| `/admin/categories` (+ new, + [id]) | Gestion catégories |
| `/admin/orders` (+ [id]) | Gestion commandes + actions de statut |
| `/admin/stores` (+ [id]) | Gestion boutiques + actions vendeur |
| `/admin/users` | Gestion utilisateurs (rôles, activation) |
| `/admin/reviews` | Modération des avis (boutons modération + masse) |
| `/admin/refunds` | Gestion des remboursements |
| `/admin/deliveries` | Gestion des livraisons |
| `/admin/commissions` | Suivi des commissions |
| `/admin/audit-logs` | Journal d'audit |
| `/admin/settings` | Réglages plateforme |

## 7.6 Checkout & vitrines

| Route | Description |
|---|---|
| `/checkout` | Checkout global (adresse, paiement, récap) |
| `/checkout/confirmation/[orderId]` | Confirmation + statut paiement temps réel |
| `/store/[slug]` | Vitrine d'une boutique (6 thèmes) — JSON-LD Store + BreadcrumbList |
| `/store/[slug]/products` | Produits de la boutique |
| `/store/[slug]/category/[catSlug]` | Catégorie de la boutique |
| `/store/[slug]/cart` | Panier de la boutique |

### Les 6 thèmes de boutique
`banner`, `sidebar`, `editorial`, `gallery`, `showcase`, `mosaic` (+ `vendeur-theme`) — avec composants de thème dans `store/[slug]/_components/themes/`, variables CSS personnalisables (`--store-*`), sélection de polices (Inter, Playfair, Poppins, Dancing Script, Oswald), de radius, et de couleurs.

---

# PARTIE 8 — LES COMPOSANTS UI (INVENTAIRE)

| Dossier | Composants |
|---|---|
| `components/account` | password-form, profile-form |
| `components/admin` | admin-sidebar, delete-button, platform-settings-form, refund-actions, store-form |
| `components/analytics` | google-analytics (GA4) |
| `components/auth` | login-form, register-form, logout-button, profile-menu |
| `components/cart` | add-to-cart-button, cart-badge, cart-page, mini-cart, store-cart-page |
| `components/category` | category-form |
| `components/checkout` | address-form, address-select, order-summary, payment-select |
| `components/delivery` | delivery-timeline |
| `components/layout` | conditional-header, header-footer (Header+Footer), logo, mobile-menu |
| `components/notifications` | notification-bell (badge non-lus) |
| `components/order` | refund-request-form |
| `components/product` | add-to-cart-button, favorite-button, product-card, product-filters, product-form, product-gallery |
| `components/providers` | auth-provider (SessionProvider), theme-provider |
| `components/reviews` | review-card, review-form, review-list, star-rating |
| `components/search` | global-search (recherche + suggestions) |
| `components/seller` | become-seller-form, copy-url-button, seller-plan-card, seller-sidebar, store-settings-form |
| `components/social` | share-buttons, share-page, whatsapp-float, whatsapp-share |
| `components/ui` (shadcn) | badge, button, card, input, label, select, table, textarea, separator, pagination, image-upload, search-bar, active-filters, theme-toggle |

---

# PARTIE 9 — LES SERVER ACTIONS (29 FICHIERS) ET API

## 9.1 Server Actions (toutes `"use server"`)

| Fichier | Fonctions |
|---|---|
| `auth.ts` | `register` |
| `login.ts` | `loginAction` |
| `profile.ts` | `updateProfile`, `changePassword` |
| `addresses.ts` | CRUD adresses + `setDefaultAddress` |
| `cart.ts` | `getCart`, `getCartCount`, `addToCart`, `updateCartItemQty`, `removeFromCart`, `clearCart`, `mergeGuestCart` |
| `checkout.ts` | `placeOrder` (appelle `initPayment`), `getOrderById`, `getUserOrders` |
| `place-store-order.ts` | `placeStoreOrder` (commande boutique + paiement) |
| `orders.ts` | `getAllOrders`, `getOrderStats`, `updateOrderStatus`, `getStoreSubOrders`, `getSubOrderDetail`, `updateSubOrderStatus`, `updateDeliveryStatus` |
| `products.ts` | CRUD produits + médias + recherche + fichier digital |
| `categories.ts` | CRUD catégories + `getSellerCategories` |
| `stores.ts` | `getStoreBySlug`, produits/boutique, `getAdminStores`, `updateStore`, `approveSeller`, `rejectSeller` (emails) |
| `seller-store.ts` | `getSellerStore`, `updateSellerStore` |
| `seller-registration.ts` | `applyAsSeller` |
| `seller-stats.ts` | `getSellerStats`, `getSellerCommissions` |
| `seller-analytics.ts` | `getSellerAnalytics` |
| `seller-plans.ts` | limites des plans + `upgradeSellerPlan` |
| `reviews.ts` | avis (création, modération, masse) |
| `favorites.ts` | favoris |
| `deliveries.ts` | livraisons admin |
| `refunds.ts` | demande/traitement des remboursements |
| `admin-commissions.ts` | commissions admin |
| `admin-analytics.ts` | `getAdminAnalytics` |
| `dashboard.ts` | `getDashboardData` |
| `users.ts` | gestion utilisateurs admin |
| `audit-logs.ts` | journal d'audit |
| `platform-settings.ts` | réglages plateforme |
| `notifications.ts` | notifications utilisateur |
| `search.ts` | `globalSearch` |
| `shares.ts` | `trackShare`, `trackClick`, `getShareStats`, `getShareUrl`, `getSellerShareStats` |

## 9.2 Les 8 API routes

| Route | Méthodes | Rôle |
|---|---|---|
| `/api/auth/login` | POST | Login (rate-limit 5/60s, cookie unique, safeRedirect) |
| `/api/auth/[...nextauth]` | — | Handler NextAuth |
| `/api/health` | GET | Health-check (décompte users + NODE_ENV) |
| `/api/media/upload` | POST | Upload Cloudinary |
| `/api/media/[id]` | DELETE | Suppression média |
| `/api/payments/status` | GET | Statut de paiement (?orderId=) |
| `/api/products/digital-upload` | POST | Upload fichier digital (plan CREATOR uniquement) |
| `/api/webhooks/wave` | POST | Webhook Wave (vérif signature) |
| `/api/webhooks/orange-money` | POST | Webhook Orange Money |

---

# PARTIE 10 — PAIEMENTS, EMAILS, SÉCURITÉ

## 10.1 Paiements (architecture abstraite)

`src/lib/payments/` :
- `index.ts` : `initPayment(provider, params)` — dispatch WAVE / ORANGE_MONEY / COD (COD = passthrough, statut PENDING→confirmation) ;
- `types.ts` : `PaymentProvider`, `PaymentInitResult` (avec `paymentUrl`), `PaymentWebhookPayload` ;
- `wave.ts` : `initWavePayment` (Checkout API v1 : `POST /v1/checkout/sessions`, redirection `data.payment_url`) et `verifyWaveWebhook` (format imbriqué `data.payment_status`/`data.reference`/`data.id`, mapping SUCCESSFUL/COMPLETED→SUCCESS, FAILED/EXPIRED/CANCELLED→FAILED) ; env : `WAVE_API_URL`, `WAVE_API_KEY`, `WAVE_MERCHANT_ID`, `WAVE_WEBHOOK_SECRET` ;
- `orange-money.ts` : `initOrangeMoneyPayment` + `verifyOrangeMoneyWebhook` ; env : `ORANGE_API_URL`, `ORANGE_CLIENT_ID`, `ORANGE_CLIENT_SECRET`, `ORANGE_MERCHANT_KEY`, `ORANGE_WEBHOOK_SECRET`.

Flux : commande → `placeOrder`/`placeStoreOrder` → `initPayment()` → redirection client vers `paymentUrl` → webhook fournisseur → update `Payment` + `Order.paymentStatus` en transaction → page confirmation en polling.

**Règle d'or du projet : aucun paiement simulé — la confirmation fournisseur est obligatoire.**

## 10.2 Emails (SMTP/Nodemailer)

`src/lib/email/` : `transport.ts` (nodemailer, mode dev sans SMTP → console), `templates.ts`, `index.ts`.
6 templates HTML en français :
1. `welcomeEmail` — bienvenue après inscription ;
2. `orderConfirmationEmail` — confirmation de commande client ;
3. `orderStatusEmail` — changement de statut ;
4. `sellerNewOrderEmail` — nouvelle commande pour le vendeur ;
5. `deliveryUpdateEmail` — mise à jour livraison ;
6. `digitalProductEmail` — produits digitaux livrables.

Env : `SMTP_HOST`, `SMTP_PORT` (587), `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`.

## 10.3 Sécurité & protection

- **Aucun secret dans le dépôt Git** (`.env*` ignorés, seul `.env.example` commité avec les noms de variables) ;
- **En-têtes de sécurité** dans `next.config.ts` : `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-XSS-Protection: 1; mode=block`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` ; `poweredByHeader: false` ;
- **Rate limiting** (`rate-limit.ts`, en mémoire) sur login et placeStoreOrder ;
- **Cloisonnement vendeur** vérifié côté serveur (médias, ordres, produits) ;
- **JWT** signé, sessions 7 jours ;
- **Anti open-redirect** dans login (`safeRedirect`) ;
- **Validation Zod** sur tous les formulaires ;
- **Audit log** des actions sensibles ;
- **Stock** en décrément atomique conditionnel en transaction ;
- **Zéro paiement simulé** : webhooks avec vérification de signature.

## 10.4 SEO & visibilité (ce qui est réellement en place)

- `metadataBase`, Open Graph, Twitter cards, canonical ;
- `sitemap.ts` dynamique (`force-dynamic`) : pages statiques + produits publiés + catégories actives + boutiques actives ;
- `robots.ts` : disallow `/admin/`, `/seller/`, `/account/`, `/checkout/`, `/api/` ;
- JSON-LD : `Organization`, `WebSite + SearchAction` (layout racine), `BreadcrumbList` (produit + boutique), `Store` (boutique), `OG type product` sur produit ;
- Google Analytics GA4 : `G-KR7K5VZDVE` (component dans le layout racine) ;
- Alt text des images, slugs sémantiques, français `lang="fr"`, locale `fr_SN`.

---

# PARTIE 11 — PWA & APPLICATIONS MOBILES

## 11.1 La PWA (installable sur tous les téléphones)

- `manifest.json` (nom Teranga Business, icônes 192/512) ;
- Service worker `sw.js` (cache, offline de base) ;
- `apple-touch-icon.png` + métadonnées iOS ;
- Installation iPhone : Safari → Partager → « Ajouter à l'écran d'accueil ».

## 11.2 Android (APK)

- Projet Capacitor complet dans `android/` (Gradle, `sn.terangabusiness.app`) ;
- APK construit et livré : **TerangaBusiness-v1.0-apk-debug.apk** (4,8 Mo) ;
- Publié publiquement sur GitHub Release **v1.0** : lien `https://github.com/serignesalioudia-boop/teranga-business/releases/tag/v1.0` ;
- L'app Android charge le site **en ligne** (aucun rebuild nécessaire pour refléter les changements).

## 11.3 iOS (en préparation)

- Projet Capacitor complet dans `ios/` (`App.xcodeproj`, schéma `App`, AppDelegate/SceneDelegate, icônes, splash) ;
- Workflow GitHub Actions **`ios-build.yml`** : runner `macos-14`, `npm ci` → `npx cap sync ios` → `xcodebuild archive` (Release, `CODE_SIGNING_ALLOWED=NO`) → export → artifact `TerangaBusiness-iOS-<run_number>` → `notarytool submit` conditionné aux secrets App Store Connect ;
- `eas.json` configuré (profils production/preview, submit iOS avec appleId/ascAppId/appleTeamId à remplir) ;
- `GUIDE-iOS.md` : 3 méthodes (GitHub Actions recommandée, EAS Build, MacinCloud), liste des secrets (`APP_STORE_CONNECT_API_KEY`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_ID`, `APPLE_TEAM_ID`) ;
- **Blocage actuel** : le compte Apple Developer (99 $/an ~ 60 000 FCFA) n'est pas payé → pas de Team ID, pas de soumission App Store.

> Coût total iOS estimé : ~60 000 FCFA/an (Apple Developer Program + outils gratuits).

---

# PARTIE 12 — LA DOCUMENTATION RÉDIGÉE

| Document | Contenu |
|---|---|
| `docs/README.md` | Index complet de la documentation + règles du projet |
| `docs/ARCHITECTURE.md` | Référence technique V2, stack, organisation du code, décisions ouvertes, journal des décisions |
| `docs/DATABASE.md` | Schéma Prisma, modèles, règles d'argent, livraison mixte, seed |
| `docs/DESCRIPTION-OFFICIELLE.md` | Description complète (phrase → « À propos »), bio réseaux, descriptions par plateforme, slogan |
| `docs/DESCRIPTION-TRILINGUE.md` | Officielle FR / EN / ZH, bio, descriptions plateforme |
| `docs/BILLINGUE-RESEAUX-SOCIAUX.md` | FR/Wolof + bio + textes Instagram/Facebook/TikTok/X/LinkedIn/WhatsApp + hashtags |
| `docs/LANCEMENT-SEO-VISIBILITE.md` | Analyse réelle + recommandations A–M (SEO complet, Google, mise en ligne, Wikipédia, visibilité) |
| `docs/VIDEO_SCRIPT.md` | Script vidéo 8-10 min (8 scènes) bilingue FR/Wolof + instructions de capture |
| `GUIDE-iOS.md` | Publication App Store en 3 méthodes + coûts |
| `MOBILE_BUILD.md` | Build Android (.apk) + iOS (.ipa) + déploiement stores |

---

# PARTIE 13 — LE DÉPLOIEMENT EN PRODUCTION

## 13.1 Plateformes et configuration

- **Hébergement** : Vercel (Next.js natif, HTTPS + CDN gratuits) ;
- **Base de données** : Supabase PostgreSQL (plan gratuit) avec **pooler** (`DATABASE_URL`) ;
- **Domaine** : alias Vercel `teranga-business-olive.vercel.app` (le domaine `terangabusiness.com` reste à acheter — vérifié libre — ou `.sn`) ;
- **Images** : Cloudinary (clé API trimée) ;
- **CI/CD** : GitHub Actions `ci.yml` (typecheck + tests + build + docker) + deploiement Vercel CLI à la main/automatique ;
- **Variables d'environnement** utilisées : `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `CLOUDINARY_*`, `SMTP_*`, `WAVE_*`, `ORANGE_*`.

## 13.2 Config Vercel

- `vercel.json` : `framework: nextjs`, `installCommand: npm install` ;
- Déploiements via CLI (`vercel --prod --yes`) — production alias `teranga-business-olive.vercel.app`.

---

# PARTIE 14 — SITUATION ACTUELLE (SEPTEMBRE 2026)

## 14.1 L'incident de la base de données (et sa résolution)

**Le problème** : le site affichait « Erreur de connexion » au login et `/api/health` renvoyait 500.

**La cause trouvée** : le projet Supabase gratuit avait été **auto-pausé** (sur les plans gratuits, Supabase met en pause les projets après ~7 jours sans activité ; la base a même un risque de suppression après ~90 jours en pause). Le host `postgres.kskdwqxolzhrxmnwyqfe.pooler.supabase.com` ne résolvait plus (ENOTFOUND).

**La solution** : le propriétaire s'est connecté à son dashboard Supabase (il fallait trouver le **bon compte** : le projet était rattaché à l'organisation « Teranga Business » accessible via le compte créé avec ChatGPT/OpenAI, pas le compte GitHub). Il y a découvert DEUX organisations (chacune avec 1 projet) :
- « Serigne Saliou Dia » (1 projet) ;
- « Teranga Business » (1 projet) → **c'était lui le bon** : projet « projet ssalioudia903@gmail.com », projet Web + projet base `kskdwqxolzhrxmnwyqfe`, marqué **Paused** avec le message : *« Toutes les données, y compris les sauvegardes et les objets de stockage, restent sûres. Vous pouvez reprendre ce projet depuis le tableau de bord jusqu'au 22 oct. 2027. »*

**La résolution** : clic sur **Resume** → après quelques minutes la base est « En Bonne Santé » → tests de connexion réussis (30 tables, données intactes : Store 4, Product 6, User 12) → `/api/health` redevient 200 avec `userCount:12`.

Un autre projet Supabase existait (org « Teranga Business », vide, 0 tables) — c'est une base de test distincte, **pas** celle de la production.

## 14.2 L'anti-re-pause

Une fois la base ressuscitée, deux protections ont été mises en place pour éviter une nouvelle pause :

1. **GitHub Action `keep-alive.yml`** — appel de `/api/health` + `/` toutes les heures (cron), qui force une connexion à la base. **Commite `d19d672`.**
   - ⚠️ **Problème** : le compte GitHub est bloqué pour un *billing issue* → les workflows ne s'exécutent pas (« account is locked due to a billing issue »). À régler côté GitHub Support / plan.
2. **UptimeRobot** (option B gratuite) : surveille `https://teranga-business-olive.vercel.app/api/health` toutes les 5 minutes — **en cours de configuration par le propriétaire** (compte gratuit à créer, moniteur à ajouter).

**À retenir** : le plan gratuit Supabase se repausera toujours après inactivité. Solutions définitives : passer le projet en **Supabase Pro (25 $/mois)** quand le budget le permet, ou maintenir les pings actifs.

## 14.3 État de la production (vérifié)

```
GET https://teranga-business-olive.vercel.app/api/health
→ 200 {"status":"ok","userCount":12,"nodeEnv":"production"}
```

Le site est **en ligne**, la base est **connectée**, les données sont **intactes**.

---

# PARTIE 15 — LA PRÉSENTATION PARTENAIRES (PITCH)

Voici le pitch conçu pour présenter Teranga Business à des partenaires (investisseurs, commerciaux, techniques).

## 15.1 L'idée en une phrase
**Teranga Business est la première marketplace qui permet à chaque commerçant du Sénégal de créer sa boutique en ligne en quelques minutes, de vendre sur Internet et sur WhatsApp, et à chaque client d'acheter tous ses produits en un seul panier.**

## 15.2 Le problème
- Pas de vitrine en ligne pour les commerçants sans payer un développeur (millions de FCFA) ;
- Pas de catalogue unique pour les clients : il faut chercher boutique par boutique ;
- Peu de confiance pour payer en ligne ;
- Pas d'outil pour suivre commandes, stocks et revenus ;
- Des milliers de bons produits sénégalais qui ne se vendent qu'en local.

## 15.3 La solution (par acteur)
**Vendeurs** : boutique en ligne personnalisable, QR Code unique Wave/Orange Money à afficher en magasin, bouton WhatsApp sur chaque produit, pages de partage traçables, création en 5 étapes sans compétence technique.
**Clients** : un seul panier même multi-boutiques, paiement Wave/Orange Money/COD, espace client (suivi, favoris, avis vérifiés, notifications), récompenses au partage.
**Plateforme** : commission sur chaque vente, abonnements vendeurs (Gratuit/5 000/10 000/20 000 F), espace admin complet, statistiques temps réel.

## 15.4 L'avance technique (déjà construit)
Application en ligne + PWA, APK Android téléchargeable, projet iOS prêt (attente App Store), base sécurisée Supabase/PostgreSQL, paiements via API Wave et Orange Money, 6 emails transactionnels automatiques, site multilingue FR (+Wolof prévu), hébergement Vercel professionnel.

## 15.5 Le marché
Plus de 18 millions d'habitants, culture du commerce très forte, croissance rapide du paiement mobile (Wave/Orange Money adoptés partout, même en zone rurale), e-commerce local en pleine explosion, absence de plateforme locale de confiance.

## 15.6 Ce qu'on peut montrer dès aujourd'hui
Plateforme en ligne fonctionnelle, 4 boutiques actives, 6 produits en vitrine, 12 comptes, APK installable en 2 minutes, démo de commande complète de bout en bout.

## 15.7 Ce qu'on recherche
- Un **partenaire commercial** (réseaux de commerçants, ONG, associations, baol-baol) ;
- Un **partenaire technique** (conformité API bancaire, accélération publication) ;
- Un **financement de lancement** (Apple Developer 99 $/an, hébergement Pro, campagne de recrutement de vendeurs) — en échange : part du chiffre d'affaires des commissions ou participation au capital.

## 15.8 Le mot d'ordre
> « Le commerce sénégalais a toujours existé. Teranga Business lui donne Internet. »

---

# PARTIE 16 — BILAN ET PROCHAINES ÉTAPES

## 16.1 Ce qui est fait ✅
- Marketplace multi-vendeurs complète et fonctionnelle (client / vendeur / admin) ;
- Base de données riche (31 modèles, commissions, multi-vendeurs, livraison mixte) ;
- Paiements mobiles câblés (Wave Checkout API v1, Orange Money, COD) + webhooks ;
- 6 emails transactionnels, notifications en base ;
- SEO complet + Google Analytics + en-têtes de sécurité ;
- PWA + APK Android (v1.0 publié) + projet iOS prêt ;
- Documentation professionnelle complète (officielle, trilingue, bilingue, SEO, vidéo) ;
- Dépôt GitHub propre avec historique, version v1.0 publiée ;
- Production en ligne et stable sur Vercel + Supabase.

## 16.2 Ce qui reste à faire (priorités)
1. **Maintenir la base active** : débloquer le billing GitHub (Action keep-alive) ET/OU finaliser UptimeRobot ;
2. **Activer les paiements réels** : clés API Wave (`wave_sn_prod_...` via business.wave.com/dev-portal) et Orange Money, configurer les webhooks + `WAVE_WEBHOOK_SECRET` / Orange ;
3. **Acheter le domaine** : `terangabusiness.com` (vérifié libre) ou `.sn`, puis brancher sur Vercel ;
4. **Publier sur les stores** : Google Play (25 $ one-time), App Store (99 $/an — en attente de budget) ;
5. **Recruter les 50 premiers vendeurs** ;
6. **Piste produit** : notificshpush, badges de confiance, multilingue FR/Wolof, blog SEO, moteur de livraison (le dossier `lib/delivery/` est encore vide), tests supplémentaires.

## 16.3 Règles du projet (rappel final)
1. Aucune phase ne commence sans validation explicite du propriétaire ;
2. Aucun secret dans le dépôt Git ;
3. Calculs financiers en entiers, côté serveur uniquement ;
4. Cloisonnement vendeur vérifié à chaque couche ;
5. Aucun paiement simulé : confirmation fournisseur obligatoire.

---

# PARTIE 17 — GUIDE VISUEL ÉTAPE PAR ÉTAPE

> Cette partie parcourt le site écran par écran, **captures d'écran réelles à l'appui**, dans l'ordre exact où un utilisateur découvre puis utilise la plateforme. Les captures ont été prises sur la production : https://teranga-business-olive.vercel.app (le 29 septembre 2026).

---

## 17.1 Le parcours visiteur (sans compte)

Un visiteur qui arrive sur le site peut tout consulter sans se connecter : catalogue, catégories, boutiques et fiches produits. Seuls l'achat, la vente et l'administration exigent un compte.

### Étape 1 — La page d'accueil

C'est le point d'entrée : barre de recherche, catégories mises en avant, produits récents et boutiques. Le visiteur comprend en quelques secondes qu'il peut **acheter** ou **ouvrir sa boutique**.

![Page d'accueil](./captures/01-accueil.png)

**Ce qu'on y trouve :** le logo, le menu (Produits, Catégories, Boutiques), le bouton « Vendre » (créer une boutique), la barre de recherche, et les raccourcis vers les comptes.

### Étape 2 — Le catalogue des produits

La page `/products` liste tous les produits publiés, avec filtres et tri. Chaque carte renvoie vers la fiche produit.

![Catalogue des produits](./captures/02-produits.png)

**Ce qu'on y trouve :** grille de produits (image, nom, prix, boutique), nombres de résultats, et accès aux filtres.

### Étape 3 — Les catégories

La page `/categories` présente les grandes familles de produits du marché sénégalais (Alimentation, Électronique, Mode, Beauté & Santé, Maison, etc.).

![Toutes les catégories](./captures/03-categories.png)

### Étape 4 — Une catégorie précise

En cliquant sur une catégorie (ici **Électronique**), on obtient tout le rayon correspondant.

![Catégorie Électronique](./captures/04-categorie-electronique.png)

**Ce qu'on y trouve :** le fil d'Ariane, les sous-catégories éventuelles, et les produits de la catégorie avec tri (prix, récence).

### Étape 5 — La fiche produit

La fiche produit détaille l'article : images, prix, stock, description, vendeur, et boutons d'action.

![Fiche produit - Smartphone Teranga Pro](./captures/05-produit-smartphone.png)

**Ce qu'on y trouve :** galerie d'images, prix (en FCFA, entier), disponibilité, description, informations du vendeur, bouton **Ajouter au panier**, **Ajouter aux favoris**, sélection de quantité, et produits similaires.

### Étape 6 — L'annuaire des boutiques

La page `/shop` répertorie toutes les boutiques actives de la plateforme.

![Annuaire des boutiques](./captures/06-boutiques.png)

### Étape 7 — La vitrine d'une boutique

Chaque vendeur possède sa vitrine (`/store/[slug]`) avec sa bannière, sa description et son propre catalogue.

![Boutique Teranga Tech](./captures/07-boutique-teranga-tech.png)

**Ce qu'on y trouve :** bannière et logo de la boutique, note/avis, description, produits du vendeur, et un **panier propre à la boutique** (le client peut combiner plusieurs vendeurs dans une même commande).

---

## 17.2 Créer un compte et se connecter

### Étape 8 — L'inscription

La page `/register` crée un compte **client** en quelques champs (nom, e-mail, mot de passe).

![Page d'inscription](./captures/09-register.png)

### Étape 9 — La connexion

La page `/login` connecte n'importe quel compte (client, vendeur ou admin). Toutes les pages privées redirigent ici si l'utilisateur n'est pas connecté (avec retour automatique via `callbackUrl`).

![Page de connexion](./captures/08-login.png)

> **Technique :** authentification **NextAuth (JWT)**. Le mot de passe est haché avec **bcrypt** (12 tours). La session dure 7 jours. Aucun mot de passe n'est jamais stocké en clair.

---

## 17.3 Devenir vendeur et créer sa boutique

### Étape 10 — Devenir vendeur

Depuis son compte, le client peut demander à devenir vendeur (`/account/become-seller`). La demande crée un **profil vendeur en attente**.

![Devenir vendeur](./captures/17-compte-devenir-vendeur.png)

### Étape 11 — Créer sa boutique

Une fois vendeur, l'utilisateur ouvre sa boutique via `/create-store` : nom, adresse (slug), description, logo, bannière.

![Créer une boutique](./captures/10-creer-boutique.png)

> **Technique :** le vendeur reste inactif tant que l'admin ne l'a pas **approuvé** (`SellerProfile.status = PENDING → ACTIVE`). Chaque produit est ensuite rattaché à **une** boutique, et le cloisonnement est vérifié à chaque couche (le vendeur ne voit jamais les données d'un autre vendeur).

---

## 17.4 Le parcours client connecté (achat)

### Étape 12 — Le panier

Le panier (`/cart`) regroupe les articles, avec quantités, sous-total et éligibilité à la livraison.

![Panier du client](./captures/11-panier.png)

### Étape 13 — Le paiement (checkout)

La page `/checkout` collecte l'adresse de livraison, le mode de livraison et le **moyen de paiement** : Wave, Orange Money ou paiement à la livraison (COD).

![Paiement / Checkout](./captures/12-checkout.png)

> **Technique :** les montants sont calculés **côté serveur en entiers** (FCFA, sans centimes). La commission de la plateforme est appliquée automatiquement. Le paiement mobile passe par l'API Wave/Orange ; tant que les clés de production ne sont pas branchées, le COD reste le mode de démonstration.

### Étape 14 — Mon compte

Le tableau de bord client (`/account`) centralise commandes, favoris, adresses, notifications et informations personnelles.

![Mon compte](./captures/13-compte.png)

### Étape 15 — Mes commandes

Le client suit ici l'état de chaque commande : *en attente → confirmée → expédiée → livrée*.

![Mes commandes](./captures/14-compte-commandes.png)

### Étape 16 — Mes favoris

Les produits mis de côté pour plus tard.

![Mes favoris](./captures/15-compte-favoris.png)

### Étape 17 — Mes adresses

Les adresses de livraison enregistrées, réutilisables au checkout.

![Mes adresses](./captures/16-compte-adresses.png)

---

## 17.5 L'espace vendeur

### Étape 18 — Le tableau de bord vendeur

Le vendeur (`/seller`) voit en un coup d'œil ses ventes du jour, ses commandes en attente, son chiffre d'affaires et ses alertes de stock.

![Dashboard vendeur](./captures/18-vendeur-dashboard.png)

### Étape 19 — Gérer ses produits

Le vendeur crée, modifie et publie ses produits (`/seller/products`), gère stock et prix.

![Produits du vendeur](./captures/19-vendeur-produits.png)

### Étape 20 — Traiter ses commandes

Le vendeur confirme, prépare et marque comme expédiées les commandes qui le concernent (`/seller/orders`).

![Commandes vendeur](./captures/20-vendeur-commandes.png)

### Étape 21 — Statistiques (analytics)

Courbes de ventes, produits les plus vus, taux de conversion.

![Analytics vendeur](./captures/21-vendeur-analytics.png)

### Étape 22 — Mes revenus

Le détail des gains, des commissions prélevées par la plateforme et du net à percevoir.

![Revenus vendeur](./captures/22-vendeur-revenus.png)

### Étape 23 — Réglages de la boutique

Nom, description, logo, bannière, coordonnées de paiement.

![Réglages boutique vendeur](./captures/23-vendeur-reglages.png)

---

## 17.6 L'espace administration

L'admin pilote toute la place de marché. C'est le rôle le plus puissant.

### Étape 24 — Le tableau de bord admin

Vue globale : chiffre d'affaires plateforme, commandes, vendeurs, produits, litiges.

![Dashboard admin](./captures/24-admin-dashboard.png)

### Étape 25 — Gérer les utilisateurs

Activer/désactiver des comptes, changer les rôles, et **approuver les vendeurs**.

![Utilisateurs (admin)](./captures/25-admin-utilisateurs.png)

### Étape 26 — Gérer les boutiques

Valider, suspendre ou supprimer des boutiques.

![Boutiques (admin)](./captures/26-admin-boutiques.png)

### Étape 27 — Gérer les produits

Modération du catalogue : publier, dépublier, signaler.

![Produits (admin)](./captures/27-admin-produits.png)

### Étape 28 — Suivre les commandes

Vue sur toutes les commandes de la plateforme, tous vendeurs confondus, avec changement de statut.

![Commandes (admin)](./captures/28-admin-commandes.png)

### Étape 29 — Les commissions

Le cœur du modèle économique : la commission prélevée sur chaque vente (taux configurable par catégorie/vendeur) et son reversement.

![Commissions (admin)](./captures/29-admin-commissions.png)

### Étape 30 — Analytics de la plateforme

Nombre d'utilisateurs, de boutiques, de commandes, volumes d'affaires, tendances.

![Analytics admin](./captures/30-admin-analytics.png)

### Étape 31 — Réglages de la plateforme

Paramètres globaux : taux de commission par défaut, devises, livraison, e-mails, intégrations.

![Réglages (admin)](./captures/31-admin-reglages.png)

---

## 17.7 Récapitulatif du parcours complet

| # | Étape | Rôle | Page |
|---|-------|------|------|
| 1 | Découvrir l'accueil | Visiteur | `/` |
| 2 | Parcourir le catalogue | Visiteur | `/products` |
| 3 | Explorer les catégories | Visiteur | `/categories` |
| 4 | Voir un rayon | Visiteur | `/category/[slug]` |
| 5 | Consulter une fiche produit | Visiteur | `/product/[slug]` |
| 6 | Voir les boutiques | Visiteur | `/shop` |
| 7 | Visiter une boutique | Visiteur | `/store/[slug]` |
| 8 | Créer un compte | Client | `/register` |
| 9 | Se connecter | Tous | `/login` |
| 10 | Demander le statut vendeur | Client | `/account/become-seller` |
| 11 | Créer sa boutique | Vendeur | `/create-store` |
| 12 | Remplir son panier | Client | `/cart` |
| 13 | Payer | Client | `/checkout` |
| 14 | Suivre ses commandes | Client | `/account/orders` |
| 15 | Gérer ses produits | Vendeur | `/seller/products` |
| 16 | Traiter ses commandes | Vendeur | `/seller/orders` |
| 17 | Suivre ses revenus | Vendeur | `/seller/revenue` |
| 18 | Administrer la plateforme | Admin | `/admin` |
| 19 | Modérer et approuver | Admin | `/admin/users`, `/admin/stores` |
| 20 | Suivre les commissions | Admin | `/admin/commissions` |

---

> **Comment lire ce guide :** chaque capture correspond à une page réellement en ligne au moment de la rédaction. D'ici peu, la charte visuelle évoluera (couleurs, logo définitif) mais l'enchaînement des écrans restera identique : c'est le squelette fonctionnel du site.

---

> **Teranga Business — La marketplace des commerçants du Sénégal.**
> Créateur : Serigne Salio Dia Boop
> Site de production : https://teranga-business-olive.vercel.app
> Document généré le 29 septembre 2026.