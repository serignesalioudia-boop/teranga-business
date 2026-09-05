# Teranga Business — Mise en ligne professionnelle, SEO & visibilité

> Document basé sur l'**analyse réelle du code** du projet (vérifié dans le dépôt).
> Toute recommandation est soit une **optimisation de l'existant**, soit une **nouvelle fonctionnalité à ajouter** — chaque cas est signalé.
> Le résultat est conçu pour être professionnel, crédible et adapté au marché sénégalais.

---

## 0. Analyse réelle du site (avant toute recommandation)

### 0.1 Stack technique confirmée

| Type | Technologie |
|---|---|
| Framework | **Next.js 16.3.1** (App Router, fullstack SSR) |
| Langage | TypeScript 5.9.3 |
| ORM / Base | **Prisma 7.9.1** + **PostgreSQL 17** (Supabase) |
| Auth | **NextAuth.js** (Credentials, session JWT 7 j, bcrypt) |
| Médias | **Cloudinary** |
| Emails | **nodemailer / SMTP** (6 templates HTML en français) |
| UI | Tailwind CSS 4 + shadcn/ui, Recharts |
| PWA | Service worker (`sw.js`) + manifest.json (instalable) |
| Mobile | **Capacitor** (Android `android/`, iOS `ios/`) — app native possible |
| Devise | XOF (`Intl.NumberFormat("fr-SN")`) — montants en BIGINT |
| Langue | Français (`lang="fr"` en dur, pas d'i18n) |

### 0.2 Modèle multi-vendeurs (réel)

- **Rôles** : `USER` et `ADMIN` (enum `Role`). Le statut vendeur est géré par `SellerProfile.status` (PENDING / ACTIVE / SUSPENDED / REJECTED).
- **Hiérarchie de commande** : `Order → SubOrder → OrderItem` (commande multi-vendeurs), avec commissions par SubOrder.
- **36 modèles Prisma** : User, SellerProfile, Store, StoreUser, Category, Product, MediaAsset, Cart, CartItem, Address, Order, SubOrder, OrderItem, Payment, PaymentSplit, Refund, Delivery, DeliveryRule, Commission, Review, Favorite, Coupon, Notification, Setting, SocialLink, AuditLog, ShareLink, ShareEvent, etc.

### 0.3 Fonctionnalités réellement présentes (inventaire vérifié)

**Côté visiteur (pages publiques)**
- Accueil (`/`, dashboard marketplace : héros, statistiques, catégories, boutiques, produits)
- Boutique (`/shop`, catalogue de boutiques + filtres)
- Produits (`/products`, liste globale)
- Catégories (`/categories`) et une catégorie (`/category/[slug]`)
- Fiche produit (`/product/[slug]`)
- Panier (`/cart`)
- Page boutique publique (`/store/[slug]` + sous-pages cart/category/products)
- Pages de partage social (`/share/[type]/[slug]` — tracking WhatsApp/Messenger/Facebook/etc.)

**Espace client (`/account/`)**
- Dashboard compte, **Commandes** (+ détail + téléchargement produits digitaux), **Notifications**, **Adresses**, **Devenir vendeur**, **Profil**, **Favoris**, **Avis**, **Suivi livraison** (`/account/deliveries/[id]`)

**Espace vendeur (`/seller/`)** — protégé par `sellerProfile.status === "ACTIVE"`
- Dashboard, **Produits** (liste/nouveau/édition), **Commandes** (détail + sous-commandes), **Catégories**, **Revenus**, **Analytics** (4 graphiques), **Réglages** (thèmes boutique, réseaux sociaux), Création de boutique (`/create-store`)

**Espace admin (`/admin/`)** — protégé par `Role.ADMIN`
- Dashboard, **Commandes**, **Utilisateurs**, **Boutiques**, **Catégories**, **Produits**, **Commissions**, **Livraisons**, **Remboursements**, **Analytics** (7 graphiques), **Avis** (modération), **Réglages plateforme**, **Journal d'audit**

**Panier**
- **Stocké en base de données** (modèles `Cart`/`CartItem`), cookie invité `tb_cart_session` (90 j), badge mis à jour via événement `cart-updated`. Panier global + panier par boutique.

**Checkout / commande**
- Checkout global (`/checkout`) : sélection adresse → mode de paiement (WAVE par défaut) → récap → `placeOrder`. Numéro `TB-...`, frais de livraison (défaut 500 XOF), confirmation `/checkout/confirmation/[orderId]`.
- Commande par boutique (`placeStoreOrder`, rate limit 3/min).

**Paiements (réels)**
- **3 méthodes** : `WAVE`, `ORANGE_MONEY`, `COD` (paiement à la livraison).
- **Le paiement par carte a été retiré** (migration `20260817_remove_card_payment`).
- Modules `payments/wave.ts` et `payments/orange-money.ts`, webhooks `/api/webhooks/wave` et `/api/webhooks/orange-money` (signatures vérifiées), modèles Payment / PaymentSplit / Refund.

**Livraison**
- Modèles `Delivery` (1:1 SubOrder), `DeliveryRule` (GLOBAL/PLATFORM/VENDOR), `DeliveryStatusHistory`. Timeline de suivi (`delivery-timeline.tsx`), méthodes STANDARD / EXPRESS / PICKUP. `computeDeliveryFee` (défaut 500 XOF). (Le dossier `lib/delivery/` est encore vide — moteur dédié à développer.)

**Autres**
- Notifications internes (base de données) + 6 emails transactionnels (welcome, confirmation commande, statut, nouvelle commande vendeur, livraison, produit digital).
- Social commerce : ShareLink + ShareEvent (tracking de partage).
- Coupons (`PERCENT_BP`/`FIXED`, scope PLATFORM/STORE) — flux d'application à l'achat partiel.
- Recherche globale (composant, action `globalSearch`).

### 0.4 État SEO actuel (vérifié)

| Élément | État |
|---|---|
| `sitemap.ts` | ✅ Dynamique (produits/catégories/boutiques publiés + pages statiques) |
| `robots.ts` | ✅ Disallow admin/seller/account/checkout/api |
| Metadata racine | ⚠️ title + description, **pas d'Open Graph ni Twitter ni metadataBase** |
| `src/lib/seo/` | ⚠️ **vide** (juste `.gitkeep`) — aucune fonction SEO centralisée |
| `src/lib/constants` | ⚠️ **n'existe pas** — nom/slogan/URL dupliqués en dur dans ~5 fichiers |
| `generateMetadata` | ✅ présent sur produit, catégorie, boutique, pages share |
| i18n | ❌ Aucun (français en dur) |
| H1/H2/H3 | À vérifier page par page (héros Accueil) |
| Schema.org | ❌ Absent |
| Base URL | `NEXTAUTH_URL` sinon fallback `https://terangabusiness.sn` |

---

## 1. Présentation professionnelle de Teranga Business

### 1.1 Présentation courte

> **Teranga Business** est une plateforme sénégalaise de commerce et de services en ligne. Elle connecte les vendeurs et prestataires locaux aux acheteurs, avec des paiements mobiles (Wave, Orange Money), une livraison suivie et une identité 100 % Teranga, pour faire rayonner les talents et les produits du Sénégal.

### 1.2 Présentation détaillée

**Teranga Business** est une marketplace multi-vendeurs développée au Sénégal. Contrairement aux places de marché internationales, elle est pensée *pour* le marché sénégalais : paiements en francs CFA avec les moyens locaux, livraison à l'échelle du pays, interface en français et identité culturelle forte.

La plateforme permet à chaque vendeur d'ouvrir sa propre boutique en ligne (page personnalisable, thèmes, réseaux sociaux), de publier ses produits (physiques ou digitaux) et de gérer ses commandes, ses revenus et ses statistiques. Côté acheteur, elle offre un panier unifié multi-boutiques, plusieurs modes de paiement, un suivi de livraison et un espace client complet.

Techniquement, Teranga Business repose sur une infrastructure moderne et sécurisée (Next.js, PostgreSQL, certification SSL) et est optimisée pour fonctionner sur ordinateur, tablette et mobile — y compris en application installable (PWA).

### 1.3 Mission

> Permettre à chaque commerçant, artisan et prestataire sénégalais de vendre et de se développer en ligne, et offrir à chaque acheteur un accès simple, fiable et sécurisé aux produits et services locaux.

### 1.4 Objectif

Devenir **la place de marché de référence au Sénégal** pour l'achat et la vente en ligne, en combinant technologies modernes, paiements mobiles locaux et une livraison adaptée au territoire.

### 1.5 Problèmes auxquels Teranga Business répond

- **Difficulté des commerçants locaux à accéder à la vente en ligne** (barrières techniques, coûts, formation).
- **Manque de confiance** dans l'achat en ligne (paiement à la livraison, avis, suivi).
- **Absence de moyens de paiement adaptés** au marché (Wave, Orange Money) sur les grandes places de marché.
- **Livraison non structurée** pour les commerçants indépendants.
- **Dépendance aux géants étrangers** peu adaptés au contexte local.

### 1.6 Utilisateurs ciblés

- **Vendeurs** : commerçants, boutiques, artisans, marques locales, distributeurs, revendeurs en ligne.
- **Acheteurs** : particuliers au Sénégal et diaspora recherchant des produits locaux.
- **Prestataires de services** : livraison, services numériques (produits digitaux).

### 1.7 Fonctionnalités principales

- Boutique en ligne par vendeur (thèmes + réseaux sociaux)
- Publication de produits physiques et **digitaux**
- Panier unifié multi-boutiques
- Paiements **Wave**, **Orange Money** et **paiement à la livraison (COD)**
- Commande multi-vendeurs avec séparation des règlements
- Suivi de livraison avec timeline
- Espaces client, vendeur et administrateur complets
- Notifications et emails transactionnels
- Favoris, avis, coupons, remboursements
- Partage social avec tracking
- Application installable (PWA + Capacitor Android/iOS)

### 1.8 Avantages de la plateforme

- **Paiements locaux** (Wave, Orange Money, COD) — confiance et accessibilité.
- **100 % en français**, prix en FCFA, adapté au Sénégal.
- **Multi-vendeurs** : chaque commerce a sa propre vitrine.
- **Sécurité** : certification SSL, données chiffrées, rôles cloisonnés.
- **Mobile natif** : PWA + application Android/iOS en préparation.

### 1.9 Positionnement au Sénégal

Teranga Business se positionne comme **la marketplace nationale des commerçants sénégalais**, alternative locale aux plateformes étrangères, avec une forte dimension de confiance, de paiement mobile et d'identité culturelle (« Teranga » = hospitalité).

### 1.10 Présentation professionnelle (à destination des visiteurs / partenaires)

> **Teranga Business — La marketplace des commerçants du Sénégal.**
>
> Teranga Business est une plateforme de commerce et de services en ligne conçue au Sénégal pour le Sénégal. Elle permet aux vendeurs locaux d'ouvrir leur boutique en ligne et de vendre leurs produits et services, tout en offrant aux acheteurs une expérience d'achat simple, sécurisée et adaptée : paiement mobile (Wave, Orange Money), paiement à la livraison, livraison suivie et interface en français.
>
> Notre raison d'être : faire rayonner le commerce, les produits et les talents du Sénégal à travers une technologie moderne, fiable et accessible à tous.

---

## 2. Référencement Google — SEO

> ⚠️ État actuel : le site a déjà `sitemap.ts`, `robots.ts` et des `generateMetadata` partiels. Les recommandations ci-dessous distinguent **optimisations de l'existant** et **nouvelles fonctionnalités**.

### 2.1 Base URL / canonical (optimisation existante — prioritaire)

Le site utilise `process.env.NEXTAUTH_URL || "https://terangabusiness.sn"` comme base canonique (sitemap, robots, emails). **Action** : définir `NEXTAUTH_URL` en production (ex. `https://terangabusiness.com`) pour garantir une **URL canonique unique** et éviter tout contenu dupliqué (ex. `www` vs non-`www`, `http` vs `https`).

#### 2.1.1 Recommendation canonical
- Choisir **une seule** variante (`https://terangabusiness.com` sans `www` est recommandé).
- **Nouvelle fonctionnalité** : dans le layout racine, ajouter `metadataBase` (voir 2.9) et un `canonical` explicite via `alternates` sur chaque page de contenu.

### 2.2 Titre SEO principal (racine / accueil)

**C (titre SEO principal) — recommandé :**
> `Teranga Business — Acheter et vendre en ligne au Sénégal`

### 2.3 Méta-description principale

**D (méta-description principale) — recommandée :**
> `Teranga Business est la marketplace des commerçants du Sénégal. Achetez et vendez des produits et services en ligne : paiement Wave, Orange Money, livraison suivie.`

### 2.4 Mots-clés SEO (E)

**Mots-clés principaux (ciblés naturellement, sans bourrage)**
- teranga business
- commerce en ligne au sénégal
- boutique en ligne au sénégal
- achat en ligne au sénégal
- produits au sénégal
- services au sénégal
- commerce digital au sénégal
- marketplace sénégal
- vente en ligne sénégal
- entreprises sénégalaises

**Mots-clés secondaires / longue traîne**
- vendre en ligne au sénégal
- acheter des produits sénégalais
- payer avec wave en ligne
- orange money sénégal en ligne
- livraison à dakar / thiès
- craft / artisanat sénégalais en ligne

### 2.5 Titres et descriptions SEO de chaque page (F)

> ⚠️ **Optimisations de l'existant** (les pages ont déjà des `metadata` partiels) : suggestions à reprendre/vérifier dans chaque `page.tsx`.

| Page (route) | Titre SEO recommandé | Méta-description recommandée |
|---|---|---|
| **Accueil** `/` | Teranga Business — Acheter et vendre en ligne au Sénégal | La marketplace des commerçants du Sénégal. Produits et services en ligne, paiement Wave/Orange Money, livraison suivie. |
| **Produits** `/products` | Tous les produits — Teranga Business Sénégal | Parcourez tous les produits des vendeurs sénégalais : mode, électronique, artisanat, services. Paiement local et livraison. |
| **Catégories** `/categories` | Catégories de produits — Teranga Business | Explorez les catégories de la marketplace sénégalaise : vêtements, électronique, maison, beauté, services. |
| **Catégorie** `/category/[slug]` | {Nom catégorie} — Acheter au Sénégal | Achetez {nom catégorie} au Sénégal en ligne. Vendeurs locaux, paiement Wave/Orange Money, livraison. |
| **Boutique** `/shop` | Boutiques en ligne au Sénégal — Teranga Business | Découvrez les boutiques en ligne des commerçants sénégalais sur Teranga Business. |
| **Boutique** `/store/[slug]` | {Nom boutique} — Boutique en ligne au Sénégal | Achetez sur la boutique {Nom boutique}. Produits {catégorie}, paiement local, livraison au Sénégal. |
| **Produit** `/product/[slug]` | {Nom produit} — Acheter au Sénégal | {Nom produit} à {prix} FCFA. Disponible chez {boutique}. Paiement Wave/Orange Money, livraison au Sénégal. |
| **Panier** `/cart` | Votre panier — Teranga Business | Consultez votre panier et finalisez votre commande sur la marketplace sénégalaise. |
| **Connexion** `/login` | Connexion — Teranga Business | Connectez-vous à votre compte Teranga Business pour gérer vos commandes. |
| **Inscription** `/register` | Créer un compte — Teranga Business | Créez votre compte pour acheter ou vendre en ligne au Sénégal. |

### 2.6 Hiérarchie H1 / H2 / H3 (recommandations)

> ⚠️ **Optimisation de l'existant** : vérifier chaque page et s'assurer d'une seule balise H1 par page.

**Règle générale**
- **1 seul H1** par page (repris du titre SEO).
- **H2** : sections principales (ex. « Nos catégories », « Boutiques à la une », « Produits populaires »).
- **H3** : sous-sections / cartes de produits.

**Exemple — Page Accueil**
- H1 : « Acheter et vendre en ligne au Sénégal »
- H2 : « Nos catégories », « Boutiques à la une », « Produits tendance », « Comment ça marche », « Paiements sécurisés »

**Exemple — Page Produit**
- H1 : {Nom du produit}
- H2 : « Description », « Caractéristiques », « Avis clients », « Produits similaires »
- H3 : caractéristiques détaillées

### 2.7 Textes ALT des images (optimisation existante — à ajouter)

> ⚠️ Les images produits viennent de Cloudinary (`next/image`). Il convient de s'assurer que chaque `<Image>` a un `alt` descriptif.

- Produit : `alt="Costume Slim Fit — 50 000 FCFA — Teranga Business"`
- Catégorie : `alt="Catégorie Électronique — Teranga Business"`
- **Par défaut** : jamais d'`alt` vide pour les images de contenu ; `alt=""` uniquement pour les images décoratives.

### 2.8 URLs SEO-friendly (optimisation existante)

Déjà bien conçues (slugs sémantiques) :
- `/product/{slug}` ✅
- `/category/{slug}` ✅
- `/store/{slug}` ✅
- `/products`, `/shop`, `/categories` ✅

> **Recommandation** : maintenir les slugs en minuscules, sans accents, avec tirets. Vérifier le composant `slug.ts` (`src/lib/slug.ts`) déjà présent.

### 2.9 Données structurées Schema.org (nouvelle fonctionnalité)

> ❌ Actuellement **absent** — priorité haute en SEO technique. Implémenté via `generateMetadata` / JSON-LD dans les pages.

- **Organization** (accueil) : nom, logo, url, adresse (Sénégal), `knowsLanguage`, `areaServed` (SN).
- **WebSite** : nom, url, `potentialAction` (SearchAction).
- **Product** (fiche produit) : nom, image, description, `offers` (price en ouguiya/FCFA, `priceCurrency: "XOF"`, availability), aggregateRating (si avis), brand (boutique).
- **Store / LocalBusiness** (fiche boutique) : nom, url, address, `priceRange`.
- **BreadcrumbList** : sur produits/catégories/boutiques.
- **ItemList** : sur listes produits/catégories.

### 2.10 Balises Open Graph & Twitter/X Cards (nouvelle fonctionnalité)

> ❌ **Absentes du layout racine** — à ajouter, avec `metadataBase`.

**Open Graph (layout racine + accueil)**
```ts
metadataBase: new URL(process.env.NEXTAUTH_URL || "https://terangabusiness.com"),
openGraph: {
  type: "website",
  locale: "fr_SN",
  url: "...",
  siteName: "Teranga Business",
  title: "Teranga Business — Acheter et vendre en ligne au Sénégal",
  description: "La marketplace des commerçants du Sénégal. ...",
  images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Teranga Business" }],
},
twitter: {
  card: "summary_large_image",
  title: "...",
  description: "...",
  images: ["/og-image.png"],
},
```

> **Fichier à créer** : `public/og-image.png` (1200×630) + répéter les OG tags sur produit/catégorie/boutique.

### 2.11 Sitemap.xml (optimisation existante)

Le `sitemap.ts` dynamique existe déjà et couvre produits/catégories/boutiques + pages statiques. **Optimisations :**
- Vérifier que `NEXTAUTH_URL` est correctement défini.
- Ajouter éventuellement la page `/shop` et les pages de contenu statiques (à l'état existant, `shop` n'est pas dans le sitemap statique).
- Maintenir `force-dynamic` (déjà en place).

### 2.12 robots.txt (optimisation existante)

Le `robots.ts` existe et désindexe correctement /admin, /seller, /account, /checkout, /api. **✓ Déjà bon.**

### 2.13 Balises canonical (voir 2.1.1)

### 2.14 Maillage interne (recommandation)

- Toute fiche produit → lien vers la **boutique** → lien vers la **catégorie**.
- Accueil → catégories → produits (chemin clair).
- Fiches produit « Produits similaires » / « Vous aimerez aussi » (ancre naturelle).
- Pages boutiques → liens vers leurs produits et catégories.
- **Breadcrumb** visible sur produits/catégories/boutiques (structuré + visuel).

---

## 3. Google

### 3.1 Google Search Console — préparation

Ouvrir Google Search Console (GSC), ajouter la propriété (domaine ou préfixe URL `https://terangabusiness.com`) et vérifier la **propriété** via :
- Fichier HTML téléchargé → mis dans `public/` (méthode recommandée pour Next.js), **ou**
- Méta-tag de vérification → ajouté dans le `<head>`/`metadata`.

### 3.2 Soumission du sitemap
1. Vérifier que `/sitemap.xml` répond.
2. Dans GSC → **Sitemaps** → soumettre `sitemap.xml`.
3. Vérifier « Succès » et le nombre d'URL découvertes.

### 3.3 Indexation des pages
- Utiliser l'outil **Inspection d'URL** de GSC : « Demander une indexation » après publication de nouvelles pages/produits.
- Vérifier que les pages indexables ne sont **pas** bloquées par robots (compte, cart, checkout, admin doivent être exclus — déjà le cas).

### 3.4 Vérification du domaine (domaine racine)
- GSC → propriété de **type Domaine** : ajouter un enregistrement **DNS TXT** (ou CNAME) fourni par Google, directement chez le registrar/hébergeur DNS.

### 3.5 Amélioration du référencement naturel
- Contenu unique et structuré (cf. §2).
- Maillage interne (cf. 2.14).
- Vitesse et mobile (cf. 3.6/3.7).
- Données structurées (cf. 2.9).

### 3.6 Optimisation de la vitesse
- **Images** : Cloudinary déjà utilisé ; activer le format **WebP/AVIF** et les dimensions adaptées via `next/image` (déjà configuré + remotePatterns Cloudinary). S'assurer du `quality` et du responsive.
- **Fonts** : déjà en `next/font` auto-hébergées (pas de re-fetch Google). ✓
- **Rendu** : le site utilise `force-dynamic` sur plusieurs pages (SSR). → Évaluer l'**ISR / revalidate** pour les pages publiques (produits/catégories/boutiques) afin de réduire le temps de réponse.
- **CDN** : Vercel propose un CDN global (bon pour la diaspora).
- Réduire le poids du JS : vérifier le bundle critiques.

### 3.7 Compatibilité mobile & Core Web Vitals
- Le site est responsive (Tailwind + layout adaptatif) et **PWA installable**. ✓
- **Core Web Vitals** (LCP, INP, CLS) : viser LCP < 2,5 s sur 3G/mobile. Actions : LCP → percevoir le hero et les images produits en priorité + format optimisé ; CLS → dimensions explicites des images (`width`/`height` via `next/image`) ; INP → limiter le JS bloquant.
- Tester via **PageSpeed Insights** après mise en ligne.

### 3.8 Sécurité HTTPS
- **HTTPS par défaut sur Vercel** (gratuit). ✓
- S'assurer d'une redirection **http → https** et **www → non-www** (Vercel le gère si configuré).
- HSTS et bonnes pratiques au niveau de la plateforme.

### 3.9 Référencement local (Sénégal)
- Géolocalisation via `AreaServed` (SN) et `locale: fr_SN`.
- **Google Business Profile** (si applicable) : fiche « Teranga Business » avec adresse (Thiès / Dakar), horaires, catégorie, site web.
- Contenu orienté régions du Sénégal (Dakar, Thiès, etc.) dans les pages boutiques et articles.

### 3.10 Checklist Google Search Console (J)

- [ ] Définir l'URL canonique (domaine choisi) et `NEXTAUTH_URL`
- [ ] Mettre en ligne + HTTPS fonctionnel
- [ ] Vérifier `/sitemap.xml` et `/robots.txt` accessibles
- [ ] Ajouter la propriété dans Google Search Console
- [ ] Vérifier la propriété (fichier HTML ou DNS TXT)
- [ ] Soumettre le sitemap
- [ ] Inspecter et demander l'indexation de la page d'accueil
- [ ] Vérifier l'indexation des produits/catégories/boutiques représentatifs
- [ ] Activer « Améliorations » (données structurées) dans GSC
- [ ] Surveiller **Core Web Vitals** dans GSC
- [ ] Configurer l'envoi régulier (ou s'assurer que le sitemap est redécouvert)
- [ ] Configurer Google Business Profile (fiche locale) si pertinent

---

## 4. Mise en ligne (production) — Guide adapté à Next.js

> ⚠️ Note contexte : projet déjà sur GitHub (`serignesalioudia-boop/teranga-business`) et déjà déployable sur Vercel. La stratégie recommandée est **Vercel (Next.js natif) + base PostgreSQL managée (Supabase déjà utilisée) + domaine externe**.

### 4.1 Choisir et acheter un nom de domaine
- **Recommandé** : `teranga-business.com` (vérifié `LIBRE` au registre officiel Verisign dans ce projet). Alternatives libres : `teranga-business.sn` (marché local, payant ~1 600–25 000 FCFA/an), ou gratuit `.eu.org` pour démarrer.
- Vérifier la disponibilité officielle (RDAP/whois) avant achat.
- **Coût estimé** : `.com` ~12 €/an (ou offert 1re année avec hébergement Hostinger ~36 €/an). Avec 0 FCFA actuel : commencer par l'URL Vercel gratuite (`teranga-business.vercel.app`) puis migrer vers le domaine propre.

### 4.2 Choisir un hébergement adapté
- **Recommandé n°1** : **Vercel** (hébergeur natif Next.js, HTTPS + CDN gratuits, déploiement Git auto). Plan Hobby gratuit suffisant pour démarrer.
- **Recommandé n°2** : **Hostinger** (hébergement Node.js/Next.js + domaine offert 1re année).
- **Base de données** : **Supabase PostgreSQL** (déjà utilisé dans le projet). Alternative managée (Neon, Railway).
- Médias Cloudinary, emails Brevo/SMTP, Redis Upstash (déjà prévus au README).

### 4.3 Envoyer les fichiers du site
- Déployer depuis **GitHub** : connecter le dépôt au projet Vercel → chaque `push` sur `main` déclenche un build automatique (`vercel.json` déjà présent).
- Vérifier que `npm run build` passe : `prisma generate && next build` (script `build`). Assurer que la génération Prisma s'exécute à la fin du build (phase de build pour exécuter les migrations).

### 4.4 Connecter le domaine
- Dans Vercel → projet → Settings → Domains → **Add domain** : `teranga-business.com` (et `www.`).
- Vercel configure automatiquement le déploiement (wildcard).

### 4.5 Configurer DNS
- Chez le registrar (ex. Hostinger/Namecheap), pointer le domaine vers Vercel :
  - **Option A (recommandée)** : déléguer au DNS de Vercel (ajouter les NS fournis).
  - **Option B** : garder le DNS existant et ajouter les enregistrements A/CNAME :
    - `@` → A `76.76.21.21` (IP Vercel)
    - `www` → CNAME `cname.vercel-dns.com`
- Attendre la propagation DNS (qq heures).

### 4.6 Installer HTTPS / SSL
- Vercel propose **SSL automatique** (Let's Encrypt) sur les domaines connectés. ✓
- Vérifier que `https://` est actif et que http redirige vers https.

### 4.7 Vérifier que toutes les pages fonctionnent
- Parcourir : `/`, `/products`, `/categories`, `/shop`, une fiche produit, une catégorie, une boutique.
- Vérifier la console navigateur (pas d'erreur RSC/500).

### 4.8 Vérifier les formulaires
- Inscription, connexion, formulaire de commande, formulaire de contact, création de produit (vendeur).
- Vérifier la validation et les messages d'erreur.

### 4.9 Vérifier le panier et les commandes
- Ajouter un article au panier, modifier la quantité, passer au checkout.
- Créer une commande test (COD pour éviter un vrai paiement en test).
- Vérifier la génération du numéro `TB-...`, la création SubOrder/OrderItem et l'apparition dans l'espace client.

### 4.10 Vérifier les paiements
- ⚠️ **Aucun paiement simulé** (règle du projet) : la confirmation fournisseur est obligatoire.
- En production, configurer les **clés réelles** Wave et Orange Money (`.env`), pointer les **return/cancel URL** et les **webhooks** (`/api/webhooks/wave`, `/api/webhooks/orange-money`) — seuls les environnements de test fournisseur permettent de valider sans argent réel.
- Vérifier que les webhooks mettent à jour Payment + Order.

### 4.11 Vérifier l'affichage responsive
- Téléphone, tablette, ordinateur (device toolbar DevTools + appareils réels).
- Vérifier le hero, les grilles produits, le panier, le checkout, les tableaux admin.

### 4.12 Connecter Google Search Console
- Cf. §3.2 / checklist J.

### 4.13 Envoyer le sitemap
- Cf. §2.11 / §3.2.

### 4.14 Vérifier l'indexation
- Cf. §3.3.

### 4.15 Checklist complète de mise en ligne (I)

- [ ] Domaine choisi + acheté (ou Vercel gratuit si 0 FCFA)
- [ ] Compte Vercel créé + dépôt GitHub connecté
- [ ] Variables d'environnement production rempllies (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, Cloudinary, SMTP, Wave, Orange)
- [ ] Build de production réussi (`npm run build`)
- [ ] Déploiement Vercel OK, et mise à jour de la base (migrations Prisma)
- [ ] Domaine connecté + DNS propagé
- [ ] HTTPS/SSL actif + redirection www/non-www + http/https
- [ ] Toutes les pages publiques fonctionnent
- [ ] Formulaires testés
- [ ] Panier + commande testés (COD)
- [ ] Connexion paiements réels (ou conçue pour)
- [ ] Responsive testé (mobile/tablette/desktop)
- [ ] GSC connecté + sitemap soumis + indexation demandée
- [ ] `NEXTAUTH_URL` correct en production

---

## 5. Présence sur Internet — Description officielle (cohérente partout)

> ⚠️ **Élément central nouveau** : une seule « bio » officielle réutilisable partout.

### 5.1 Description officielle (courte — réseaux sociaux, profils)
> **Teranga Business** — La marketplace des commerçants du Sénégal. Achetez et vendez des produits et services en ligne au Sénégal : paiement Wave & Orange Money, livraison suivie.

### 5.2 Description officielle (moyenne — annuaires, Google Business Profile, communiqués)
> Teranga Business est une plateforme sénégalaise de commerce et de services en ligne. Elle permet aux vendeurs locaux d'ouvrir leur propre boutique en ligne et de vendre leurs produits et services, et aux acheteurs d'acheter simplement et en toute confiance avec des moyens de paiement locaux (Wave, Orange Money) et un paiement à la livraison. Livraison suivie, interface en français, prix en FCFA : une marketplace pensée pour le marché sénégalais.

### 5.3 Description officielle (longue — site « À propos », articles, presse)
> (Reprendre la **présentation détaillée** du §1.2 et la **présentation professionnelle** du §1.10.)

### 5.4 Éléments de cohérence de marque (à standardiser)
- **Nom** : Teranga Business (toujours avec majuscules, pas d'abréviation).
- **Slogan** (voir B) : « La marketplace des commerçants du Sénégal ».
- **Palette** : couleur principale `#c8922d` (or/ambre) + fond sombres (`#24160c`), vert accent.
- **Logo** : `public/logo.jpeg`.
- **Contact** : à standardiser sur tous les supports (email du support, WhatsApp, réseaux sociaux).
- **Devise** : FCFA / XOF.

---

## 6. Wikipédia

### 6.1 Conditions d'admissibilité (à expliquer honnêtement)

**Wikipédia n'accepte presque aucune entreprise récente** sans une notoriété démontrée par des sources indépendantes, fiables et secondaires. Les critères généraux d'admissibilité (WP:Notoriété) exigent :
- **Plusieurs sources indépendantes** (journaux, médias) qui parlent *de* l'entreprise — pas de communiqués, pas du site officiel, pas des réseaux sociaux.
- Une **couverture significative** et non triviale dans ces sources.
- Pour le commerce en ligne : souvent le respect de critères spécifiques (part de marché notable, etc.).

**En l'état actuel, Teranga Business n'est pas admissible à Wikipédia** et il serait **contre-productif** de créer un article prématuré (risque de suppression). Wikipédia est un encyclopédie, **pas un outil de promotion**.

### 6.2 Texte encyclopédique potentiel (neutre, factuel — à réserver si admissibilité future)

> ⚠️ Ce brouillon est **neutre et sans source inventée**. Il ne doit être intégré que si l'admissibilité est démontrée par des sources réelles. Aucun chiffre, prix, partenaire, récompense ou notoriété n'est inventé.

> **Teranga Business** est une plateforme sénégalaise de commerce en ligne de type marketplace multi-vendeurs. Elle permet à des commerçants locaux de créer une boutique en ligne et de vendre des produits ou services, et aux acheteurs de passer commande en ligne avec différents modes de paiement, dont le paiement mobile (Wave, Orange Money) et le paiement à la livraison. La plateforme prend également en charge le suivi des livraisons et la vente de produits numériques. L'interface est disponible en français et les transactions sont libellées en francs CFA. Le développement technique repose sur le framework Next.js et une base de données PostgreSQL. Son positionnement vise le marché du commerce en ligne au Sénégal.

> **À compléter (uniquement si sources réelles)** : historique de création, fondateur(s), chiffres, financement, reconnaissance médiatique — **jamais inventés**.

### 6.3 Pourquoi ne pas publier maintenant (honnêteté)
- Pas de couverture médiatique indépendante démontrée.
- Wikipédia exige la neutralité et des sources secondaires fiables.
- Publier un article promotionnel expose à une suppression immédiate et à une perte de crédibilité.

### 6.4 Piste alternative
- Présence sur les **annuaires professionnels**, **LinkedIn**, **Google Business Profile**, presse économique sénégalaise plus tard (cf. §7) — mais jamais présenter ces contenus comme « sources Wikipédia ».

---

## 7. Stratégie de visibilité (Sénégal)

### 7.1 Référencement naturel (SEO)
- Appliquer §2 (titre, méta, Schema.org, OG, sitemap, maillage).
- Optimiser pages produits et boutiques avec contenu unique.

### 7.2 Contenu SEO / stratégie de contenu
- **Nouvelle fonctionnalité** : ajouter un **blog / rubrique actualités** (« Guide d'achat au Sénégal », « Comment vendre en ligne », « Payer avec Wave », etc.) pour capter la longue traîne et le maillage.
- Contenu orienté « commerce en ligne au Sénégal ».

### 7.3 Réseaux sociaux
- Créer des comptes **Instagram, Facebook, TikTok, LinkedIn, WhatsApp Business** sous une identité uniforme.
- Publier les produits et boutiques, contenus éducatifs, témoignages.
- WhatsApp Business pour le service client local (déjà une composante du social commerce du projet).

### 7.4 Google
- GSC (cf. §3), Google Business Profile, suivi des Core Web Vitals.

### 7.5 Articles de presse / médias (au bon moment)
- Cibler la **presse tech et économique sénégalaise** (TechHub Sénégal, presse en ligne Sénégal) avec une **histoire authentique** (marché local, paiement mobile, entrepreneuriat sénégalais). Ce sont ces articles indépendants qui pourront un jour soutenir une admissibilité Wikipédia.

### 7.6 Partenariats
- Partenariats avec **livreurs** (Yango, etc.), **écoles/incubateurs**, **associations de commerçants**, **artisans**, **groupes WhatsApp de vendeurs**.

### 7.7 Annuaires professionnels
- Inscription sur les annuaires Sénégal (annuaires en ligne, plateformes d'entreprises sénégalaises) avec la bio officielle (§5).

### 7.8 Backlinks de qualité
- Obtenir des liens depuis médias locaux, partenaires, blogs, articles sponsorisés (exclusivement des sources pertinentes), jamais de réseaux de liens.

### 7.9 Présence locale au Sénégal
- Fiche Google Business Profile (Dakar/Thiès), présence sur les groupes locaux, partenariats avec boutiques physiques, livraison ciblée par ville.

### 7.10 Création de contenu
- Photos/vidéos produits, tutoriels, témoignages, démonstrations de paiement et livraison. Format adapté à chaque réseau.

### 7.11 Stratégie court / moyen / long terme

**Court terme (semaines 1-6, budget ~0 FCFA)**
- Mettre en ligne (Vercel + URL gratuite ou domaine), GSC, sitemap, indexation.
- Appliquer les optimisations SEO de base (titre, description, OG, Schema.org).
- Créer les comptes sociaux + bio officielle uniforme (§5).
- Remplir la marketplace de produits/boutiques réels (crédibilité).
- Google Business Profile pour la présence locale.

**Moyen terme (mois 2-6)**
- Blog / contenu SEO (§7.2) + maillage interne.
- Activer Google Business, campagnes de contenu, premiers partenariats livreurs.
- Premières relations presse / annuaires → premiers backlinks.
- Suivre les Core Web Vitals et PageSpeed.

**Long terme (mois 6+)**
- Extension des catégories et villes couvertes.
- Développer la notoriété (presse indépendante → éligibilité Wikipédia éventuelle).
- Vendre localement + recomposer la diaspora.
- Si l'activité se développe : budget marketing (Google Ads ciblant « commerce en ligne au Sénégal ») — à décider plus tard.

---

## 8. Livrables (A–M)

### A. Présentation officielle de Teranga Business
> **Teranga Business — La marketplace des commerçants du Sénégal.**
> Plateforme sénégalaise de commerce et de services en ligne connectant vendeurs locaux et acheteurs, avec paiement mobile (Wave, Orange Money), paiement à la livraison, et livraison suivie. Interface en français, prix en FCFA, pensée pour le marché sénégalais. (Voir §1 et §5 pour les versions courte/détaillée.)

### B. Slogan proposé
> **« La marketplace des commerçants du Sénégal »**
> (Variante courte : « Acheter et vendre en ligne au Sénégal »)

### C. Titre SEO principal
> **`Teranga Business — Acheter et vendre en ligne au Sénégal`**

### D. Méta-description principale
> **`Teranga Business est la marketplace des commerçants du Sénégal. Achetez et vendez des produits et services en ligne : paiement Wave, Orange Money, livraison suivie.`**

### E. Mots-clés SEO
Voir §2.4 (teranga business, commerce en ligne au sénégal, boutique en ligne au sénégal, achat en ligne au sénégal, produits/services au sénégal, marketplace sénégal, commerce digital au sénégal, etc.)

### F. Titres et descriptions SEO de toutes les pages
Voir §2.5 (tableau complet).

### G. Contenu recommandé pour Google
Voir §2 et §3 (titre, méta, H1/H2/H3, Schema.org, OG/Twitter, sitemap, GSC, vitesse, mobile, local).

### H. Contenu encyclopédique potentiel pour Wikipédia
Voir §6.2 (brouillon neutre, à n'utiliser que si admissibilité démontrée).

### I. Checklist complète de mise en ligne
Voir §4.15.

### J. Checklist Google Search Console
Voir §3.10.

### K. Améliorations SEO prioritaires
1. **metadataBase + Open Graph/Twitter + canonical** dans le layout (nouveau).
2. **Schema.org** (Organization, Product, Store, Breadcrumb) (nouveau).
3. **Optimiser titre/méta par page** (existante à optimiser).
4. **ALT d'images produits** systématique (optimisation).
5. **H1 unique / hiérarchie H2-H3** par page (optimisation).
6. **Ajouter /shop + blog au sitemap** (optimisation).
7. **Breadcrumb + maillage interne** (nouveau).
8. **Centraliser nom/slogan/URL** dans une constante (`src/lib/constants`) pour éviter les divergences (optimisation de structure).

### L. Améliorations techniques prioritaires
1. **URL canonique unique** : définir `NEXTAUTH_URL` en production + redirection www/non-www + http/https (Vercel).
2. **SSG/ISR vs force-dynamic** : passer les pages publiques (produits/catégories/boutiques) en **rendu statique/ISR** avec `revalidate` pour la vitesse (à évaluer selon la fraîcheur des données).
3. **Core Web Vitals** : images WebP/AVIF + dimensions explicites (LCP/CLS), réduire JS (INP).
4. **Créer `public/og-image.png`** (1200×630) (nouveau).
5. **Moteur de livraison** : développer `src/lib/delivery/` (actuellement vide) pour gérer zones/tarifs de façon robuste (existant/infrastructure à compléter) — hors SEO, mais important pour la fiabilité avant mise en production.
6. **Configurer emals SMTP + webhooks Wave/Orange réels** en production (prérequis paiement réel).
7. Vérifier la cohérence **Node version** Docker (Node 20) vs prérequis (Node ≥ 24).

### M. Stratégie pour augmenter la visibilité de Teranga Business au Sénégal
Voir §7 (SEO + contenu/blog + réseaux sociaux + Google + presse + partenariats + annuaires + backlinks + présence locale + court/moyen/long terme).

---

## 9. Suggestions d'implémentation par priorité (bonus)

**Immédiat (code, faible effort, sans casser l'existant)**
1. Ajouter `metadataBase` + `openGraph` + `twitter` + `alternates.canonical` dans `src/app/layout.tsx`.
2. Créer `src/lib/constants.ts` exportant `SITE_NAME`, `SITE_TAGLINE`, `SITE_URL`, et l'utiliser dans layout, sitemap, robots, emails, manifest (remplacement incrémental).
3. Créer `public/og-image.png`.
4. Ajouter une page qui expose les données structurées (Organization/WebSite) sur l'accueil via JSON-LD (`<script type="application/ld+json">`).
5. Ajouter le breadcrumb STRUCTURÉ sur les pages produit/catégorie/boutique.
6. Ajouter `/shop` au sitemap statique.

**Court terme (après les éléments ci-dessus)**
- Vérifier/optimiser titre + méta + H1 de chaque page publique.
- Verrouiller les ALT des images produits.
- Évaluer ISR pour les pages publiques.
- Déployer + GSC + sitemap + indexation.

**Nouvelle fonctionnalité (à décider)**
- Module **Blog** (routes `/blog`, `/blog/[slug]`) pour la stratégie de contenu SEO (nécessite admin + rendu statique/ISR).

---

> **Note de prudence** : ce document décrit des recommandations. Les modifications de code correspondantes (layout, SEO, Schema.org, rendu, etc.) doivent être implémentées par étapes et validées (build + test) — rien n'est appliqué automatiquement.
