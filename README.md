# Teranga Business

Marketplace e-commerce multi-vendeurs destinée au marché sénégalais.

Plateforme permettant :
- aux clients d'acheter des produits ;
- aux vendeurs de créer leur boutique, publier leurs produits et gérer leurs commandes ;
- à Teranga Business d'administrer la plateforme et de percevoir une commission sur les ventes.

## Technologies

| Domaine | Technologie |
|---|---|
| Framework | Next.js 16.3.1 (App Router, fullstack) |
| Langage | TypeScript 5.9.3 |
| Style | Tailwind CSS 4 + shadcn/ui |
| Base de données | PostgreSQL 17 |
| ORM | Prisma 7.9.1 |
| Authentification | Auth.js (next-auth) |
| Validation | Zod 4 |
| Formulaires | React Hook Form |
| État serveur (client) | TanStack Query |
| Graphiques | Recharts |
| Images | Cloudinary (à configurer) |
| Email | Brevo / SMTP (à configurer) |
| Cache / rate-limiting | Upstash Redis (à configurer) |

## Prérequis

- Node.js ≥ 24 (développé sous Node 26.4.0)
- npm ≥ 11
- Docker (PostgreSQL local via docker-compose)

## Installation

```bash
# 1. Copier les variables d'environnement
cp .env.example .env
# puis remplir les valeurs (DATABASE_URL, NEXTAUTH_SECRET, ...)

# 2. Démarrer la base de données locale (PostgreSQL 17)
docker compose up -d

# 3. Installer les dépendances
npm install

# 4. Appliquer les migrations + seed (voir PHASE 3)
npm run db:migrate
npm run db:seed

# 5. Lancer le serveur de développement
npm run dev
```

Site : http://localhost:3000 — Adminer (visualisation DB) : http://localhost:8080

## Scripts

| Commande | Action |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification TypeScript |
| `npm run db:migrate` | Migration Prisma (dev) |
| `npm run db:seed` | Données de démonstration |

## Documentation

Voir [`docs/`](./docs/README.md).

## Sécurité

- Aucun secret dans le dépôt (`.env*` ignorés, seul `.env.example` est commité).
- Calculs financiers et prix relus depuis le serveur uniquement.
- Cloisonnement vendeur vérifié côté serveur.
