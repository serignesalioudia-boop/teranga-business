import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const passwordHash = await bcrypt.hash("admin", 12);

  try {
    // 1. Utilisateur client
    const client = await prisma.user.upsert({
      where: { email: "client@terangabusiness.sn" },
      update: { passwordHash },
      create: {
        name: "Aminata Diop",
        email: "client@terangabusiness.sn",
        passwordHash,
        phone: "+221 77 123 45 67",
        role: "USER",
      },
    });

    // 2. Adresse du client
    const address = await prisma.address.create({
      data: {
        userId: client.id,
        label: "Domicile",
        fullName: "Aminata Diop",
        phone: "+221 77 123 45 67",
        country: "SN",
        region: "Dakar",
        city: "Plateau",
        addressLine: "12 Rue Amadou Assane Ndoye",
        isDefault: true,
      },
    });

    // 3. Vendeur
    const seller = await prisma.user.upsert({
      where: { email: "vendeur@terangabusiness.sn" },
      update: { passwordHash },
      create: {
        name: "Ibrahima Fall",
        email: "vendeur@terangabusiness.sn",
        passwordHash,
        phone: "+221 78 654 32 10",
        role: "USER",
      },
    });

    // 4. Profil vendeur + Boutique
    const sellerProfile = await prisma.sellerProfile.upsert({
      where: { userId: seller.id },
      update: {},
      create: {
        userId: seller.id,
        status: "ACTIVE",
        commissionRateBp: 1000,
        isVerified: true,
      },
    });

    const store = await prisma.store.upsert({
      where: { slug: "teranga-tech" },
      update: {},
      create: {
        sellerProfileId: sellerProfile.id,
        name: "Teranga Tech",
        slug: "teranga-tech",
        description: "Électronique et accessoires de qualité au Sénégal",
        whatsapp: "+221 78 654 32 10",
        isActive: true,
      },
    });

    // 5. Catégorie
    const category = await prisma.category.upsert({
      where: { slug: "electronique" },
      update: {},
      create: {
        name: "Électronique",
        slug: "electronique",
        description: "Smartphones, tablettes et accessoires",
        icon: "Cpu",
        sortOrder: 1,
        isActive: true,
      },
    });

    // 6. Produit
    const product = await prisma.product.upsert({
      where: { slug: "smartphone-teranga-pro" },
      update: {},
      create: {
        storeId: store.id,
        categoryId: category.id,
        name: "Smartphone Teranga Pro",
        slug: "smartphone-teranga-pro",
        description: "Smartphone 6.5 pouces, 128 Go, double SIM, batterie 5000 mAh",
        price: BigInt(89500),
        discountPrice: BigInt(79900),
        stock: 25,
        sku: "TT-SP-001",
        status: "PUBLISHED",
        isFeatured: true,
      },
    });

    // 7. Commande
    const order = await prisma.order.create({
      data: {
        number: "TB-SEED-001",
        userId: client.id,
        status: "CONFIRMED",
        paymentStatus: "SUCCESS",
        subtotal: BigInt(79900),
        deliveryTotal: BigInt(2500),
        grandTotal: BigInt(82400),
        shippingAddress: {
          fullName: "Aminata Diop",
          phone: "+221 77 123 45 67",
          addressLine: "12 Rue Amadou Assane Ndoye",
          city: "Dakar",
          region: "Dakar",
        },
      },
    });

    const subOrder = await prisma.subOrder.create({
      data: {
        orderId: order.id,
        storeId: store.id,
        sellerProfileId: sellerProfile.id,
        status: "SHIPPED",
        subtotal: BigInt(79900),
        deliveryFee: BigInt(2500),
        commissionRateBp: 1000,
        commissionAmount: BigInt(7990),
        payableAmount: BigInt(74410),
        shippingAddress: {
          fullName: "Aminata Diop",
          phone: "+221 77 123 45 67",
          addressLine: "12 Rue Amadou Assane Ndoye",
          city: "Dakar",
        },
      },
    });

    const orderItem = await prisma.orderItem.create({
      data: {
        subOrderId: subOrder.id,
        productId: product.id,
        productName: product.name,
        unitPrice: BigInt(79900),
        quantity: 1,
        lineTotal: BigInt(79900),
      },
    });

    // 8. Paiement
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: "WAVE",
        provider: "wave",
        amount: BigInt(82400),
        status: "SUCCESS",
      },
    });

    // 9. Livraison
    await prisma.delivery.create({
      data: {
        subOrderId: subOrder.id,
        method: "STANDARD",
        provider: "Yango Delivery",
        trackingNumber: "YGO-2026-001",
        status: "SHIPPED",
        fee: BigInt(2500),
        zone: "Dakar",
        estimatedDays: 3,
        shippedAt: new Date(),
      },
    });

    // 10. Avis
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: client.id,
        orderItemId: orderItem.id,
        rating: 5,
        title: "Excellent téléphone !",
        content: "Très bon rapport qualité-prix, livraison rapide. Je recommande.",
        status: "APPROVED",
      },
    });

    // 11. Commission
    await prisma.commission.create({
      data: {
        orderId: order.id,
        subOrderId: subOrder.id,
        storeId: store.id,
        rateBp: 1000,
        amount: BigInt(7990),
        status: "PENDING",
      },
    });

    // 12. Coupon
    await prisma.coupon.create({
      data: {
        code: "BIENVENUE10",
        type: "PERCENT_BP",
        value: BigInt(1000),
        minCartValue: BigInt(25000),
        maxDiscount: BigInt(10000),
        maxUses: 100,
        usedCount: 3,
        validFrom: new Date("2026-01-01"),
        validTo: new Date("2026-12-31"),
        isActive: true,
        scope: "PLATFORM",
        storeId: store.id,
      },
    });

    console.log("✅ Seed terminé : 1 entrée par entité créée.");
    console.log(`   Client   : ${client.email}`);
    console.log(`   Vendeur  : ${seller.email}`);
    console.log(`   Boutique : ${store.name} (${store.slug})`);
    console.log(`   Catégorie: ${category.name}`);
    console.log(`   Produit  : ${product.name}`);
    console.log(`   Commande : ${order.number}`);
    console.log(`   Livraison: YGO-2026-001`);
    console.log(`   Avis     : 5★ — "${orderItem.productName}"`);
    console.log(`   Commission: ${subOrder.commissionAmount} XOF`);
    console.log(`   Coupon   : BIENVENUE10`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
