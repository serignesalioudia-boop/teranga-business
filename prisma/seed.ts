// Teranga Business — Seed de démonstration (Phase 3)
//
// Données fictives : catégories, utilisateurs, vendeurs, boutiques,
// produits, adresses, règles de livraison, coupons et réglages.
//
// Ré-exécutable : utilise des upserts sur les clés uniques naturelles.
// Montants en minor units (XOF : 1 FCFA = 1 minor unit) — jamais de floats.
//
// NOTE (Phase 4) : les passwordHash sont des placeholders. L'authentification
// (Auth.js) hachera les vrais mots de passe et ce seed sera mis à jour.

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const XOF = "XOF";

// Mot de passe fictif en clair, documenté pour l'environnement de DEV UNIQUEMENT.
// Remplacé par un vrai hash bcrypt en Phase 4.
const DEV_PASSWORD_HASH = "$2b$10$PLACEHOLDER_DO_NOT_USE_IN_PRODUCTION";

function placehold(text: string): string {
  return `https://placehold.co/600x400/png?text=${encodeURIComponent(text)}`;
}

async function seedSettings() {
  const settings = [
    {
      key: "platform.name",
      value: "Teranga Business",
    },
    {
      key: "platform.currency",
      value: XOF,
    },
    {
      key: "commission.defaultRateBp",
      value: 1000, // 10 %
    },
    {
      key: "delivery.globalFallbackFee",
      value: 1000, // 1 000 FCFA
    },
    {
      key: "store.defaultSlug",
      value: "boutique",
    },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }
  console.log(`  Réglages : ${settings.length}`);
}

async function seedCategories() {
  const parents = [
    { name: "Mode", slug: "mode", description: "Vêtements, chaussures et accessoires", icon: "shirt" },
    { name: "Artisanat", slug: "artisanat", description: "Créations artisanales sénégalaises", icon: "hand" },
    { name: "Alimentation", slug: "alimentation", description: "Produits alimentaires et spécialités", icon: "apple" },
    { name: "Beauté & Santé", slug: "beaute-sante", description: "Cosmétiques, soins et bien-être", icon: "sparkles" },
    { name: "Maison & Déco", slug: "maison-deco", description: "Décoration, ameublement et ustensiles", icon: "home" },
    { name: "Électronique", slug: "electronique", description: "Appareils et accessoires électroniques", icon: "smartphone" },
    { name: "Services", slug: "services", description: "Services et prestations", icon: "briefcase" },
  ];

  const parentIds = new Map<string, string>();
  for (const p of parents) {
    const c = await prisma.category.upsert({
      where: { slug: p.slug },
      update: { name: p.name, description: p.description, icon: p.icon, isActive: true },
      create: { name: p.name, slug: p.slug, description: p.description, icon: p.icon },
    });
    parentIds.set(p.slug, c.id);
  }

  const children = [
    { name: "Vêtements", slug: "vetements", parent: "mode" },
    { name: "Chaussures", slug: "chaussures", parent: "mode" },
    { name: "Accessoires", slug: "accessoires", parent: "mode" },
    { name: "Bijoux", slug: "bijoux", parent: "artisanat" },
    { name: "Panier & Vannerie", slug: "paniers-vannerie", parent: "artisanat" },
    { name: "Textile & Wax", slug: "textile-wax", parent: "artisanat" },
    { name: "Épices & Condiments", slug: "epices-condiments", parent: "alimentation" },
    { name: "Cosmétiques naturels", slug: "cosmetiques-naturels", parent: "beaute-sante" },
    { name: "Décoration", slug: "decoration", parent: "maison-deco" },
  ];

  let n = 0;
  for (const c of children) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { parentId: parentIds.get(c.parent) },
      create: {
        name: c.name,
        slug: c.slug,
        parentId: parentIds.get(c.parent),
      },
    });
    n += 1;
  }
  console.log(`  Catégories : ${parents.length + n}`);
}

async function seedUsers() {
  const users = [
    {
      name: "Admin Teranga",
      email: "admin@terangabusiness.sn",
      role: "ADMIN" as const,
      phone: "+221771234567",
    },
    {
      name: "Awa Ndiaye",
      email: "awa@example.sn",
      role: "USER" as const,
      phone: "+221770000001",
    },
    {
      name: "Moussa Fall",
      email: "moussa@example.sn",
      role: "USER" as const,
      phone: "+221770000002",
    },
    {
      name: "Fatou Sarr",
      email: "fatou@example.sn",
      role: "USER" as const,
      phone: "+221770000003",
    },
    {
      name: "Ibrahima Diallo",
      email: "ibrahima@example.sn",
      role: "USER" as const,
      phone: "+221770000004",
    },
  ];

  const ids = new Map<string, string>();
  for (const u of users) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        phone: u.phone,
        role: u.role,
        isActive: true,
      },
      create: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        passwordHash: DEV_PASSWORD_HASH,
        emailVerified: new Date(),
      },
    });
    ids.set(u.email, created.id);
  }
  console.log(`  Utilisateurs : ${users.length}`);
  return ids;
}

async function seedStores(users: Map<string, string>) {
  // Awa et Ibrahima deviennent vendeurs (casquette cumulable CLIENT + VENDEUR).
  const sellers = [
    {
      userEmail: "awa@example.sn",
      profileStatus: "ACTIVE" as const,
      commissionRateBp: 800, // 8 % (dérrogation vendeur)
      store: {
        name: "Boutique Wax & Co",
        slug: "wax-co",
        description: "Vêtements et accessoires en wax sénégalais, cousus à Dakar.",
        whatsapp: "+221770000001",
        socialLinks: [
          { platform: "facebook", url: "https://facebook.com/waxco" },
          { platform: "instagram", url: "https://instagram.com/waxco" },
        ],
      },
    },
    {
      userEmail: "ibrahima@example.sn",
      profileStatus: "ACTIVE" as const,
      commissionRateBp: null,
      store: {
        name: "Ateliers de Saint-Louis",
        slug: "ateliers-saint-louis",
        description: "Artisanat et bijoux faits main de Saint-Louis.",
        whatsapp: "+221770000004",
        socialLinks: [
          { platform: "instagram", url: "https://instagram.com/ateliersstlouis" },
        ],
      },
    },
  ];

  const storeIds = new Map<string, string>();
  for (const s of sellers) {
    const userId = users.get(s.userEmail);
    if (!userId) continue;

    const profile = await prisma.sellerProfile.upsert({
      where: { userId },
      update: { status: s.profileStatus, commissionRateBp: s.commissionRateBp },
      create: {
        userId,
        status: s.profileStatus,
        commissionRateBp: s.commissionRateBp,
        isVerified: true,
      },
    });

    const store = await prisma.store.upsert({
      where: { slug: s.store.slug },
      update: {
        name: s.store.name,
        description: s.store.description,
        whatsapp: s.store.whatsapp,
        isActive: true,
      },
      create: {
        sellerProfileId: profile.id,
        name: s.store.name,
        slug: s.store.slug,
        description: s.store.description,
        whatsapp: s.store.whatsapp,
        logoUrl: placehold("logo"),
        bannerUrl: placehold("banniere"),
      },
    });

    for (const link of s.store.socialLinks) {
      await prisma.socialLink.upsert({
        where: { storeId_platform: { storeId: store.id, platform: link.platform } },
        update: { url: link.url },
        create: { storeId: store.id, platform: link.platform, url: link.url },
      });
    }

    storeIds.set(s.store.slug, store.id);
  }
  console.log(`  Boutiques : ${storeIds.size}`);
  return storeIds;
}

async function seedProducts(storeIds: Map<string, string>) {
  // Récupération des ids de catégories.
  async function catId(slug: string): Promise<string> {
    const c = await prisma.category.findUnique({ where: { slug } });
    if (!c) throw new Error(`Catégorie introuvable : ${slug}`);
    return c.id;
  }

  const products = [
    {
      store: "wax-co",
      category: "textile-wax",
      name: "Robe en wax Dakar",
      slug: "robe-wax-dakar",
      description: "Robe en tissu wax premium, coupe moderne, faite à Dakar.",
      price: 35000n,
      discountPrice: 30000n,
      stock: 20,
      sku: "WAX-ROB-001",
      status: "PUBLISHED" as const,
      isFeatured: true,
    },
    {
      store: "wax-co",
      category: "accessoires",
      name: "Sac à main wax",
      slug: "sac-wax-main",
      description: "Sac à main en wax doublé, anses cuir.",
      price: 15000n,
      stock: 35,
      sku: "WAX-SAC-002",
      status: "PUBLISHED" as const,
    },
    {
      store: "wax-co",
      category: "vetements",
      name: "Boubou brodé homme",
      slug: "boubou-brode-homme",
      description: "Boubou traditionnel brodé, coton premium.",
      price: 55000n,
      stock: 10,
      sku: "WAX-BOU-003",
      status: "PUBLISHED" as const,
    },
    {
      store: "ateliers-saint-louis",
      category: "bijoux",
      name: "Collier en perles de verre",
      slug: "collier-perles-verre",
      description: "Collier artisanal en perles de verre recyclé de Saint-Louis.",
      price: 12000n,
      discountPrice: 10000n,
      stock: 50,
      sku: "SL-BIJ-001",
      status: "PUBLISHED" as const,
      isFeatured: true,
    },
    {
      store: "ateliers-saint-louis",
      category: "paniers-vannerie",
      name: "Panier en rotin tressé",
      slug: "panier-rotin-tresse",
      description: "Panier en rotin tressé main, grand format.",
      price: 20000n,
      stock: 15,
      sku: "SL-PAN-002",
      status: "PUBLISHED" as const,
    },
    {
      store: "ateliers-saint-louis",
      category: "decoration",
      name: "Lampe en céramique",
      slug: "lampe-ceramique",
      description: "Lampe décorative en céramique peinte à la main.",
      price: 25000n,
      stock: 12,
      sku: "SL-LAM-003",
      status: "DRAFT" as const,
    },
  ];

  const productIds: string[] = [];
  for (const p of products) {
    const categoryId = await catId(p.category);
    const created = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        discountPrice: p.discountPrice ?? null,
        stock: p.stock,
        sku: p.sku,
        status: p.status,
        isFeatured: p.isFeatured ?? false,
      },
      create: {
        storeId: storeIds.get(p.store) ?? "",
        categoryId,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        discountPrice: p.discountPrice ?? null,
        stock: p.stock,
        sku: p.sku,
        status: p.status,
        isFeatured: p.isFeatured ?? false,
      },
    });
    productIds.push(created.id);

    // Médias de démonstration (placeholders, à remplacer par Cloudinary en Phase 5).
    const media = [
      { url: placehold(p.name), alt: p.name, position: 0 },
      { url: placehold(`${p.name} (2)`), alt: `${p.name} — vue 2`, position: 1 },
    ];
    await prisma.mediaAsset.deleteMany({ where: { productId: created.id } });
    for (const m of media) {
      await prisma.mediaAsset.create({
        data: { productId: created.id, ...m },
      });
    }
  }
  console.log(`  Produits : ${products.length}`);
  return productIds;
}

async function seedAddresses(users: Map<string, string>) {
  const addresses = [
    {
      userEmail: "moussa@example.sn",
      label: "Domicile",
      fullName: "Moussa Fall",
      phone: "+221770000002",
      region: "Dakar",
      city: "Dakar",
      addressLine: "Ouakam, Rue 10 x 11",
    },
    {
      userEmail: "fatou@example.sn",
      label: "Bureau",
      fullName: "Fatou Sarr",
      phone: "+221770000003",
      region: "Thiès",
      city: "Thiès",
      addressLine: "Avenue de la gare",
    },
  ];

  let n = 0;
  for (const a of addresses) {
    const { userEmail, ...data } = a;
    const userId = users.get(userEmail);
    if (!userId) continue;
    await prisma.address.deleteMany({ where: { userId } });
    await prisma.address.create({
      data: { userId, ...data },
    });
    n += 1;
  }
  console.log(`  Adresses : ${n}`);
}

async function seedDeliveryRules(storeIds: Map<string, string>) {
  const waxCo = storeIds.get("wax-co");
  const stLouis = storeIds.get("ateliers-saint-louis");

  await prisma.deliveryRule.deleteMany({});
  const rules = [
    // Fallback global (règle par défaut quand aucune autre ne s'applique).
    {
      storeId: null,
      scope: "GLOBAL" as const,
      method: "STANDARD" as const,
      zone: null,
      minCartValue: 0n,
      fee: 1000n,
      freeAbove: 50000n,
      priority: 0,
      isActive: true,
    },
    // Règle plateforme : livraison gratuite à Dakar au-dessus de 30 000 FCFA.
    {
      storeId: null,
      scope: "PLATFORM" as const,
      method: "STANDARD" as const,
      zone: "Dakar",
      minCartValue: 0n,
      fee: 800n,
      freeAbove: 30000n,
      priority: 10,
      isActive: true,
    },
    // Règle vendeur : Wax & Co livre gratuitement partout au Sénégal.
    {
      storeId: waxCo ?? null,
      scope: "VENDOR" as const,
      method: "STANDARD" as const,
      zone: null,
      minCartValue: 10000n,
      fee: 0n,
      freeAbove: null,
      priority: 20,
      isActive: true,
    },
    // Règle vendeur : Ateliers de Saint-Louis, express disponible en plus.
    {
      storeId: stLouis ?? null,
      scope: "VENDOR" as const,
      method: "EXPRESS" as const,
      zone: "Dakar",
      minCartValue: 0n,
      fee: 5000n,
      freeAbove: null,
      priority: 20,
      isActive: true,
    },
  ];

  for (const r of rules) {
    await prisma.deliveryRule.create({ data: r });
  }
  console.log(`  Règles de livraison : ${rules.length}`);
}

async function seedCoupons() {
  const coupons = [
    {
      code: "BIENVENUE10",
      type: "PERCENT_BP" as const,
      value: 1000n, // 10 %
      minCartValue: 20000n,
      maxDiscount: 5000n,
      maxUses: 100,
    },
    {
      code: "FIXE2000",
      type: "FIXED" as const,
      value: 2000n, // 2 000 FCFA
      minCartValue: 15000n,
      maxUses: 50,
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: { ...c, isActive: true },
      create: { ...c },
    });
  }
  console.log(`  Coupons : ${coupons.length}`);
}

async function main() {
  console.log("Seed Teranga Business — démarrage");

  await seedSettings();
  await seedCategories();
  const users = await seedUsers();
  const storeIds = await seedStores(users);
  await seedProducts(storeIds);
  await seedAddresses(users);
  await seedDeliveryRules(storeIds);
  await seedCoupons();

  const counts = {
    utilisateurs: await prisma.user.count(),
    vendeurs: await prisma.sellerProfile.count(),
    boutiques: await prisma.store.count(),
    categories: await prisma.category.count(),
    produits: await prisma.product.count(),
    medias: await prisma.mediaAsset.count(),
    adresses: await prisma.address.count(),
    reglesLivraison: await prisma.deliveryRule.count(),
    coupons: await prisma.coupon.count(),
    reglages: await prisma.setting.count(),
  };
  console.log("Seed Teranga Business — terminé");
  console.log("Résumé :", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
