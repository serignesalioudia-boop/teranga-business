# DATABASE — Teranga Business

Base : PostgreSQL 17 · ORM : Prisma 7.9.1 (driver adapter `@prisma/adapter-pg`).
Schéma source : `prisma/schema.prisma` · Client généré : `src/generated/prisma` (ignoré par Git).

## Modèles (26)

### Comptes, vendeurs, boutiques
| Modèle | Rôle |
|---|---|
| `User` | Compte unique. `role = USER \| ADMIN`. Pas de `VENDOR` séparé : la casquette vendeur est cumulable via `SellerProfile` (CLIENT seul ou CLIENT + VENDEUR). |
| `SellerProfile` | Casquette vendeur (1-1 avec `User`). `commissionRateBp` = dérogation de commission vendeur (sinon défaut plateforme). Statut `PENDING/ACTIVE/SUSPENDED/REJECTED`. |
| `Store` | Boutique publique (1-1 avec `SellerProfile`). Nom, slug unique, logo, bannière, WhatsApp, notes agrégées. |
| `SocialLink` | Réseaux sociaux d'une boutique (`facebook`, `instagram`, …). |

### Catalogue
| Modèle | Rôle |
|---|---|
| `Category` | Catégories globales, hiérarchiques (`parentId`). Slug unique. |
| `Product` | Appartient à une `Store` et une `Category`. Prix en `BigInt` minor units, `currency` (XOF). Statut `DRAFT/PUBLISHED/ARCHIVED`. Agrégats `ratingAvg/ratingCount/soldCount`. |
| `MediaAsset` | Images/vidéos d'un produit ou d'une boutique. Depuis la Phase 5 : upload Cloudinary (`publicId` + `url` CDN), placeholders de démo conservés. |

### Panier
| Modèle | Rôle |
|---|---|
| `Cart` | Panier lié à un `User` (`userId` unique) **ou** à une session anonyme (`sessionId`). |
| `CartItem` | Ligne panier. Unique `(cartId, productId)`. Le prix est relu depuis `Product` au checkout (jamais celui du navigateur). |

### Commandes multi-vendeurs
| Modèle | Rôle |
|---|---|
| `Address` | Adresses de l'utilisateur (SN, région, ville). |
| `Order` | Commande principale. Totaux en `BigInt`, adresses de livraison/facturation en **snapshots JSON**. Statut global **dérivé** des sous-commandes. |
| `SubOrder` | Sous-commande par vendeur. `commissionRateBp` (taux appliqué) + `commissionAmount` + `payableAmount`. |
| `OrderItem` | Ligne produit avec **snapshots** (`productName`, `productImage`, `unitPrice`) pour préserver l'historique. |
| `OrderStatusHistory` | Historique des statuts de la commande. |

### Paiements
| Modèle | Rôle |
|---|---|
| `Payment` | Paiement global de la commande (1-1 avec `Order`). Méthode `WAVE/ORANGE_MONEY/CARD/COD`, `providerTransactionId` unique. |
| `PaymentSplit` | Répartition du paiement global par sous-commande. |
| `Refund` | Remboursement total ou partiel (par sous-commande optionnel). |
| `Commission` | Commission plateforme par sous-commande (`rateBp`, `amount`), statut `PENDING/PAID` pour la comptabilité. |

### Livraison mixte
| Modèle | Rôle |
|---|---|
| `Delivery` | Livraison d'une sous-commande (1-1). Méthode, transporteur, suivi, statut. |
| `DeliveryRule` | Règles : **règle vendeur (`VENDOR`) > règle plateforme (`PLATFORM`) > fallback (`GLOBAL`)**. Zone, seuils, frais, `freeAbove`, priorité. |
| `DeliveryStatusHistory` | Historique des statuts de livraison. |

### Engagement et promotions
| Modèle | Rôle |
|---|---|
| `Review` | Avis (1-5) unique `(productId, userId)`, lié optionnellement à une ligne commande (achat vérifié). Statut `PENDING/APPROVED/REJECTED`. |
| `Favorite` | Favoris, unique `(userId, productId)`. |
| `Coupon` | Codes promo `PERCENT_BP` (points de base) ou `FIXED` (minor units). Périmètre `PLATFORM/STORE`. |

### Système
| Modèle | Rôle |
|---|---|
| `Notification` | Notifications utilisateur (`ORDER/PAYMENT/DELIVERY/SYSTEM/PROMO`). |
| `Setting` | Réglages plateforme (clé/valeur JSON) : commission par défaut, frais fallback livraison, devise… |
| `AuditLog` | Journal d'audit (action, entité, avant/après, IP). |

## Règles d'argent (à respecter partout)

1. **BIGINT minor units** : tous les montants (`price`, `subtotal`, `fee`, `commission`, `value`…) sont des `BigInt`. XOF : 1 FCFA = 1 minor unit. **Jamais de floats.**
2. Taux de commission en **points de base** (`rateBp`) : 10 % = `1000`.
3. Calculs financiers **côté serveur uniquement** ; prix relus depuis PostgreSQL (snapshots au moment de la commande).
4. Stock : décrément **atomique conditionnel** (`UPDATE ... WHERE stock >= qty`) dans une transaction, rollback si insuffisant.
5. Statut global `Order` **dérivé** des sous-commandes (jamais saisi à la main).

## Livraison mixte (ordre de résolution)

1. **Règle vendeur** (`DeliveryRule.scope = VENDOR`, priorité la plus haute)
2. **Règle plateforme** (`PLATFORM`)
3. **Fallback global** (`GLOBAL`) — configurable via `Setting delivery.globalFallbackFee`

L'admin contrôle les règles plateforme/global ; le vendeur gère ses propres règles.

## Seed (`prisma/seed.ts`)

Idempotent (upserts sur les clés uniques). Données fictives :

- 5 utilisateurs (1 admin, 2 vendeurs, 2 clients) — `passwordHash` en bcrypt (coût 12), mot de passe démo `admin`
- 2 vendeurs actifs + 2 boutiques avec réseaux sociaux
- 16 catégories (7 parents + 9 enfants)
- 6 produits (5 publiés + 1 brouillon) + 12 médias placeholders
- 2 adresses, 4 règles de livraison (global + plateforme Dakar + 2 vendeurs), 2 coupons, 5 réglages

Exécution : `npm run db:seed` (via `tsx prisma/seed.ts`).

## Commandes utiles

```bash
npm run db:migrate          # prisma migrate dev (créer/appliquer les migrations)
npm run db:seed             # peupler la base
npx prisma migrate deploy   # appliquer les migrations en production
npx prisma studio           # interface web de la base
npx prisma generate         # régénérer le client
```
