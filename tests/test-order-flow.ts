import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("=== TEST FLUX COMPLET DE COMMANDE ===\n");

    // ─── ÉTAPE 0 : S'assurer qu'un admin existe ───
    const adminEmail = "admin@terangabusiness.sn";
    let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
      const hash = await bcrypt.hash("admin", 12);
      admin = await prisma.user.create({
        data: { name: "Admin", email: adminEmail, passwordHash: hash, role: "ADMIN" },
      });
      console.log("✓ Admin créé");
    } else {
      console.log("✓ Admin existe déjà");
    }

    // ─── ÉTAPE 1 : Trouver le client ───
    const client = await prisma.user.findUnique({
      where: { email: "client@terangabusiness.sn" },
    });
    if (!client) throw new Error("Client introuvable !");
    console.log(`\n1. Client trouvé : ${client.name} (${client.id})`);

    // ─── ÉTAPE 2 : Trouver le produit ───
    const product = await prisma.product.findFirst({
      where: { status: "PUBLISHED" },
    });
    if (!product) throw new Error("Aucun produit publié !");
    console.log(`2. Produit trouvé : ${product.name} — ${product.price} FCFA, stock=${product.stock}`);

    // ─── ÉTAPE 3 : Vérifier/créer adresse ───
    let address = await prisma.address.findFirst({ where: { userId: client.id } });
    if (!address) {
      address = await prisma.address.create({
        data: {
          userId: client.id,
          label: "Domicile",
          fullName: client.name,
          phone: "+221 77 123 45 67",
          country: "SN",
          region: "Dakar",
          city: "Plateau",
          addressLine: "12 Rue Amadou Assane Ndoye",
          isDefault: true,
        },
      });
      console.log("3. Adresse créée");
    } else {
      console.log(`3. Adresse trouvée : ${address.label} — ${address.city}`);
    }

    // ─── ÉTAPE 4 : Créer panier + ajouter produit ───
    let cart = await prisma.cart.findUnique({ where: { userId: client.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: client.id } });
    }
    // Supprimer les anciens items du panier
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    const cartItem = await prisma.cartItem.create({
      data: { cartId: cart.id, productId: product.id, quantity: 2 },
    });
    console.log(`4. Produit ajouté au panier (qty=2)`);

    // ─── ÉTAPE 5 : Simuler placeOrder (même logique que checkout.ts) ───
    console.log("\n5. Création de la commande...");

    const quantity = cartItem.quantity;
    const unitPrice = product.discountPrice && product.discountPrice > 0n
      ? product.discountPrice
      : product.price;
    const lineTotal = unitPrice * BigInt(quantity);
    const deliveryFee = BigInt(2500); // Frais de livraison standard

    // Trouver le vendeur
    const store = await prisma.store.findUnique({
      where: { id: product.storeId },
      include: { sellerProfile: true },
    });
    if (!store) throw new Error("Boutique introuvable !");

    const commissionRateBp = store.sellerProfile.commissionRateBp ?? 1000;
    const commissionAmount = (lineTotal * BigInt(commissionRateBp)) / 10000n;
    const payableAmount = lineTotal + deliveryFee - commissionAmount;

    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `TB-${ts}-${rand}`;

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        number: orderNumber,
        userId: client.id,
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotal: lineTotal,
        deliveryTotal: deliveryFee,
        grandTotal: lineTotal + deliveryFee,
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          addressLine: address.addressLine,
          city: address.city,
          region: address.region,
        },
      },
    });
    console.log(`   Commande créée : ${order.number} (ID: ${order.id})`);

    // SubOrder
    const subOrder = await prisma.subOrder.create({
      data: {
        orderId: order.id,
        storeId: store.id,
        sellerProfileId: store.sellerProfile.id,
        status: "PENDING",
        subtotal: lineTotal,
        deliveryFee,
        commissionRateBp,
        commissionAmount,
        payableAmount,
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          addressLine: address.addressLine,
          city: address.city,
        },
      },
    });
    console.log(`   SubOrder créée (ID: ${subOrder.id})`);

    // OrderItem
    const orderItem = await prisma.orderItem.create({
      data: {
        subOrderId: subOrder.id,
        productId: product.id,
        productName: product.name,
        unitPrice,
        quantity,
        lineTotal,
      },
    });
    console.log(`   OrderItem créée : ${product.name} x${quantity}`);

    // Mettre à jour le stock
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: { decrement: quantity }, soldCount: { increment: quantity } },
    });
    console.log(`   Stock mis à jour : ${product.stock} → ${product.stock - quantity}`);

    // Paiement COD (simulé)
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: "COD",
        amount: lineTotal + deliveryFee,
        status: "PENDING",
      },
    });
    console.log(`   Paiement COD créé (ID: ${payment.id})`);

    // Livraison
    const delivery = await prisma.delivery.create({
      data: {
        subOrderId: subOrder.id,
        method: "STANDARD",
        status: "PENDING",
        fee: deliveryFee,
        zone: "Dakar",
        estimatedDays: 3,
      },
    });
    console.log(`   Livraison créée (ID: ${delivery.id})`);

    // Commission
    const commission = await prisma.commission.create({
      data: {
        orderId: order.id,
        subOrderId: subOrder.id,
        storeId: store.id,
        rateBp: commissionRateBp,
        amount: commissionAmount,
        status: "PENDING",
      },
    });
    console.log(`   Commission créée : ${commissionAmount} FCFA`);

    // Status history
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: "PENDING", note: "Commande créée" },
    });

    // Vider le panier
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    console.log(`   Panier vidé`);

    // ─── ÉTAPE 6 : Vérification finale ───
    console.log("\n═══════════════════════════════════════");
    console.log("6. VÉRIFICATION FINALE");
    console.log("═══════════════════════════════════════\n");

    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        subOrders: {
          include: { items: true, delivery: true },
        },
        payment: true,
        commission: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!finalOrder) throw new Error("Commande introuvable !");

    console.log(`Commande    : ${finalOrder.number}`);
    console.log(`Client      : ${finalOrder.user?.name} (${finalOrder.user?.email})`);
    console.log(`Statut      : ${finalOrder.status}`);
    console.log(`Paiement    : ${finalOrder.payment?.method} [${finalOrder.payment?.status}]`);
    console.log(`Sous-totaux : ${finalOrder.subtotal} FCFA`);
    console.log(`Livraison   : ${finalOrder.deliveryTotal} FCFA`);
    console.log(`Total       : ${finalOrder.grandTotal} FCFA`);
    console.log(`\nSous-commandes :`);

    for (const so of finalOrder.subOrders) {
      console.log(`  - SubOrder ${so.id.substring(0, 8)}...`);
      console.log(`    Boutique    : ${store.name}`);
      console.log(`    Statut      : ${so.status}`);
      console.log(`    Sous-total  : ${so.subtotal} FCFA`);
      console.log(`    Livraison   : ${so.deliveryFee} FCFA`);
      console.log(`    Commission  : ${so.commissionAmount} FCFA (${so.commissionRateBp} bp)`);
      console.log(`    À payer     : ${so.payableAmount} FCFA`);
      console.log(`    Produits    :`);
      for (const item of so.items) {
        console.log(`      - ${item.productName} x${item.quantity} = ${item.lineTotal} FCFA`);
      }
      console.log(`    Livraison   : ${so.delivery?.method} [${so.delivery?.status}]`);
    }

    const comm = Array.isArray(finalOrder.commission) ? finalOrder.commission[0] : finalOrder.commission;
    console.log(`\nCommission vendeur : ${comm?.amount} FCFA [${comm?.status}]`);

    // Vérifier le stock
    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    console.log(`\nStock produit     : ${updatedProduct?.stock} (était ${product.stock})`);
    console.log(`Produits vendus   : ${updatedProduct?.soldCount}`);

    // Vérifier le panier est vide
    const cartCount = await prisma.cartItem.count({ where: { cartId: cart.id } });
    console.log(`Panier            : ${cartCount} items`);

    console.log("\n✅ FLUX DE COMMANDE TERMINÉ AVEC SUCCÈS !");

  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("\n❌ ERREUR :", e.message);
  process.exit(1);
});
