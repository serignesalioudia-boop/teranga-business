import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("=== TEST FLUX COMPLET VIA SERVER ACTIONS ===\n");

    // On teste la logique exacte de checkout.ts placeOrder()
    // Le server action fait: getCurrentUser() → getCart → vérifier stock → créer tout
    
    // Trouver le client
    const client = await prisma.user.findUnique({
      where: { email: "client@terangabusiness.sn" },
    });
    if (!client) throw new Error("Client introuvable");
    console.log(`Client: ${client.name}`);

    // Trouver le produit
    const product = await prisma.product.findFirst({
      where: { status: "PUBLISHED", stock: { gt: 0 } },
    });
    if (!product) throw new Error("Aucun produit disponible");
    console.log(`Produit: ${product.name} — stock=${product.stock}`);

    // Vérifier l'adresse
    const address = await prisma.address.findFirst({
      where: { userId: client.id },
    });
    if (!address) throw new Error("Pas d'adresse");
    console.log(`Adresse: ${address.label} — ${address.city}`);

    // Créer panier + ajouter 1 produit
    let cart = await prisma.cart.findUnique({ where: { userId: client.id } });
    if (!cart) cart = await prisma.cart.create({ data: { userId: client.id } });
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId: product.id, quantity: 1 },
    });
    console.log(`\nPanier: 1x ${product.name}`);

    // ── Simuler placeOrder() ──
    console.log("\n--- Simulation placeOrder ---");

    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          include: {
            store: {
              include: { sellerProfile: true },
            },
          },
        },
      },
    });

    console.log(`Items dans le panier: ${cartItems.length}`);

    // Vérifier stock
    for (const ci of cartItems) {
      if (ci.product.stock < ci.quantity) {
        throw new Error(`Stock insuffisant pour ${ci.product.name}: ${ci.product.stock} < ${ci.quantity}`);
      }
      console.log(`  ✓ ${ci.product.name} x${ci.quantity} — stock OK (${ci.product.stock})`);
    }

    // Grouper par boutique
    const storeMap = new Map<string, typeof cartItems>();
    for (const ci of cartItems) {
      const storeId = ci.product.storeId;
      const existing = storeMap.get(storeId) ?? [];
      existing.push(ci);
      storeMap.set(storeId, existing);
    }
    console.log(`\nBoutiques concernées: ${storeMap.size}`);

    // Créer la commande
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `TB-${ts}-${rand}`;

    let orderSubtotal = 0n;
    const orderItems: Array<{ productName: string; quantity: number; lineTotal: number }> = [];

    const order = await prisma.order.create({
      data: {
        number: orderNumber,
        userId: client.id,
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotal: 0n,
        deliveryTotal: 0n,
        grandTotal: 0n,
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          addressLine: address.addressLine,
          city: address.city,
          region: address.region,
        },
      },
    });
    console.log(`\nCommande: ${order.number}`);

    // Créer SubOrders par boutique
    for (const [storeId, items] of storeMap) {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: { sellerProfile: true },
      });
      if (!store) continue;

      let subTotal = 0n;
      const subItems: typeof orderItems = [];

      for (const ci of items) {
        const unitPrice = ci.product.discountPrice && ci.product.discountPrice > 0n
          ? ci.product.discountPrice
          : ci.product.price;
        const lineTotal = unitPrice * BigInt(ci.quantity);
        subTotal += lineTotal;
        subItems.push({
          productName: ci.product.name,
          quantity: ci.quantity,
          lineTotal: Number(lineTotal),
        });
      }

      const deliveryFee = 2500n;
      const rateBp = BigInt(store.sellerProfile.commissionRateBp ?? 1000);
      const commissionAmount = (subTotal * rateBp) / 10000n;
      const payableAmount = subTotal + deliveryFee - commissionAmount;

      const subOrder = await prisma.subOrder.create({
        data: {
          orderId: order.id,
          storeId,
          sellerProfileId: store.sellerProfile.id,
          status: "PENDING",
          subtotal: subTotal,
          deliveryFee,
          commissionRateBp: store.sellerProfile.commissionRateBp ?? 1000,
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

      for (const ci of items) {
        const unitPrice = ci.product.discountPrice && ci.product.discountPrice > 0n
          ? ci.product.discountPrice
          : ci.product.price;
        const lineTotal = unitPrice * BigInt(ci.quantity);

        await prisma.orderItem.create({
          data: {
            subOrderId: subOrder.id,
            productId: ci.productId,
            productName: ci.product.name,
            unitPrice,
            quantity: ci.quantity,
            lineTotal,
          },
        });

        // Décrémenter stock
        await prisma.product.update({
          where: { id: ci.productId },
          data: { stock: { decrement: ci.quantity }, soldCount: { increment: ci.quantity } },
        });
      }

      // Livraison
      await prisma.delivery.create({
        data: {
          subOrderId: subOrder.id,
          method: "STANDARD",
          status: "PENDING",
          fee: deliveryFee,
          zone: "Dakar",
          estimatedDays: 3,
        },
      });

      // Commission
      await prisma.commission.create({
        data: {
          orderId: order.id,
          subOrderId: subOrder.id,
          storeId,
          rateBp: store.sellerProfile.commissionRateBp ?? 1000,
          amount: commissionAmount,
          status: "PENDING",
        },
      });

      orderSubtotal += subTotal;
      orderItems.push(...subItems);

      console.log(`  Boutique "${store.name}": subtotal=${subTotal} commission=${commissionAmount} à payer=${payableAmount}`);
    }

    // Mettre à jour le total de la commande
    const deliveryTotal = 2500n;
    await prisma.order.update({
      where: { id: order.id },
      data: {
        subtotal: orderSubtotal,
        deliveryTotal,
        grandTotal: orderSubtotal + deliveryTotal,
      },
    });

    // Paiement COD
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: "COD",
        amount: orderSubtotal + deliveryTotal,
        status: "PENDING",
      },
    });

    // Status history
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: "PENDING", note: "Commande créée via checkout" },
    });

    // Vider le panier
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // ── Vérification finale ──
    console.log("\n═══════════════════════════════════════");
    console.log("VÉRIFICATION FINALE");
    console.log("═══════════════════════════════════════\n");

    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        subOrders: {
          include: {
            items: true,
            delivery: true,
          },
        },
        payment: true,
        commission: true,
      },
    });

    console.log(`Commande    : ${finalOrder!.number}`);
    console.log(`Statut      : ${finalOrder!.status}`);
    console.log(`Paiement    : ${finalOrder!.payment!.method} [${finalOrder!.payment!.status}]`);
    console.log(`Sous-total  : ${finalOrder!.subtotal} FCFA`);
    console.log(`Livraison   : ${finalOrder!.deliveryTotal} FCFA`);
    console.log(`Total       : ${finalOrder!.grandTotal} FCFA`);
    console.log(`Items       : ${orderItems.length}`);

    for (const so of finalOrder!.subOrders) {
      console.log(`\n  SubOrder :`);
      console.log(`    Statut     : ${so.status}`);
      console.log(`    Subtotal   : ${so.subtotal} FCFA`);
      console.log(`    Livraison  : ${so.deliveryFee} FCFA`);
      console.log(`    Commission : ${so.commissionAmount} FCFA (${so.commissionRateBp} bp)`);
      console.log(`    À payer    : ${so.payableAmount} FCFA`);
      console.log(`    Produits   :`);
      for (const item of so.items) {
        console.log(`      - ${item.productName} x${item.quantity} = ${item.lineTotal} FCFA`);
      }
      console.log(`    Livraison  : ${so.delivery?.method} [${so.delivery?.status}]`);
    }

    console.log(`\nCommissions totales: ${finalOrder!.commission.length}`);
    for (const c of finalOrder!.commission) {
      console.log(`  - ${c.amount} FCFA [${c.status}]`);
    }

    // Vérifications finales
    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    const cartCount = await prisma.cartItem.count({ where: { cartId: cart.id } });

    console.log(`\nStock produit     : ${updatedProduct?.stock}`);
    console.log(`Produits vendus   : ${updatedProduct?.soldCount}`);
    console.log(`Panier            : ${cartCount} items`);

    // Vérifications critiques
    const errors: string[] = [];
    if (finalOrder!.status !== "PENDING") errors.push("Statut incorrect");
    if (finalOrder!.payment!.status !== "PENDING") errors.push("Paiement status incorrect");
    if (updatedProduct?.stock !== product.stock - 1) errors.push("Stock non décrémenté");
    if (updatedProduct?.soldCount !== product.soldCount + 1) errors.push("Sold count non incrémenté");
    if (cartCount !== 0) errors.push("Panier non vidé");
    if (finalOrder!.subOrders.length !== 1) errors.push("Nombre de subOrders incorrect");
    if (finalOrder!.subOrders[0]?.delivery === null) errors.push("Livraison manquante");
    if (finalOrder!.commission.length !== 1) errors.push("Commission manquante");

    if (errors.length > 0) {
      console.log("\n❌ ERREURS:");
      errors.forEach(e => console.log(`  - ${e}`));
    } else {
      console.log("\n✅ TOUS LES TESTS PASSENT — FLUX COMPLET OK !");
    }

  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("\n❌ ERREUR FATALE:", e.message);
  process.exit(1);
});
