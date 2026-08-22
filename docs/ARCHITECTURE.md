# Architecture — Teranga Business

Référence technique principale : « TERANGA BUSINESS — DOCUMENT D'ARCHITECTURE VERSION 2 » (validé par le propriétaire).

## Vue d'ensemble

Marketplace e-commerce multi-vendeurs, fullstack Next.js + PostgreSQL, à destination du marché sénégalais.

- **Rôles** : `User.role = USER | ADMIN`, casquette vendeur optionnelle via `SellerProfile` (CLIENT seul ou CLIENT + VENDEUR).
- **Commandes multi-vendeurs** : `Order` (principale) → `SubOrder` (par vendeur) → `OrderItem` (snapshots), paiement global réparti via `PaymentSplit`.
- **Commission** : par sous-commande, en points de base (`rateBp`, 10 % = 1000), calculs serveur en entiers.
- **Livraison mixte** : règle vendeur > règle plateforme > fallback, contrôle admin.
- **Paiements abstraits** : interface `PaymentProvider` (Wave, Orange Money, carte, COD), aucun paiement simulé.

## Stack validée

| Domaine | Choix |
|---|---|
| Framework | Next.js 16.3.1 (App Router, RSC, Server Actions, Route Handlers) |
| Langage | TypeScript 5.9.3 (repli validé en V2 depuis 7.0.2 : typescript-eslint ne supporte pas encore TS 7) |
| Style | Tailwind CSS 4.3.3 + shadcn/ui (base radix, preset nova) |
| ORM | Prisma 7.9.1 (+ driver adapter `@prisma/adapter-pg`) |
| Base | PostgreSQL 17 (Docker local / managé en prod) |
| Auth | Auth.js (next-auth) 4.24.15 |
| Validation | Zod 4.4.3 |
| Formulaires | React Hook Form 7.85.0 |
| État serveur | TanStack Query 5.101.4 |
| Graphiques | Recharts 3.10.1 |
| Icônes | lucide-react 1.31.0 |
| Images | Cloudinary (à configurer) |
| Email | Brevo / SMTP (à configurer) |
| Cache / rate-limit | Upstash Redis (à configurer) |

## Organisation du code

```
src/
├── app/                    # App Router
│   ├── (public)/           # pages publiques (accueil, shop, product, store, search, cart, checkout)
│   ├── (auth)/             # login, register, forgot-password
│   ├── (account)/          # espace client
│   ├── (seller)/           # espace vendeur
│   ├── (admin)/            # espace administrateur
│   └── api/                # route handlers
├── components/             # ui / layout / product / category / cart / checkout / seller / admin
├── lib/                    # prisma, auth, validations, payments, delivery, commission, notification, email, seo, utils
├── server/                 # actions / services
├── hooks/ types/ constants/ messages/
└── generated/prisma/       # client Prisma généré (ignoré par Git)
```

## Règles d'argent et de stock

- Montants en **BIGINT minor units** + `currency` (XOF : 1 FCFA = 1 minor unit). Jamais de floats.
- Prix relus depuis PostgreSQL, jamais acceptés du navigateur.
- Stock : décrément atomique conditionnel (`WHERE stock >= $qty`) en transaction, rollback complet si insuffisant.

## Décisions encore ouvertes

Fournisseur carte bancaire · clés Wave/Orange Money · identifiants WhatsApp Business API · URLs réseaux sociaux réelles · domaines (`.sn` / `.com`) · clés Cloudinary/Brevo · taux de commission réel · tarifs de livraison réels.

## Journal des décisions

| Date | Décision |
|---|---|
| Phase 1 | Stack validée : Next.js 16.3.1 / TS / Tailwind 4 / Prisma 7 / PostgreSQL 17 |
| Phase 2 | TypeScript fixé sur 5.9.3 (typescript-eslint incompatible avec TS 7.0) — repli prévu en V2 |
| Phase 4 | Authentification complète : NextAuth.js 4.24.15 (Credentials + JWT), `proxy.ts` protection routes (`/admin` = ADMIN, `/account`, `/seller`), register server action Zod+bcrypt, SessionProvider, types augmentés |
| Phase 5 | Cloudinary intégré : SDK `cloudinary`, `CLOUDINARY_*` en env, `MediaAsset.publicId`, route handlers `POST /api/media/upload` + `DELETE /api/media/[id]` (auth + cloisonnement vendeur), `remotePatterns` `res.cloudinary.com` |
| Phase 6 | Catalogue complet : admin CRUD catégories/produits/boutiques (listes, formulaires, delete), pages publiques (homepage, listings, détails produit/catégorie/boutique avec galerie+SEO+breadcrumbs), filtres/recherche/pagination produits, composants `CategoryForm`, `ProductForm`, `ProductFilters`, `ProductGallery`, `ImageUpload`, `DeleteButton`, `StoreForm` |
