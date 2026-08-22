"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { clearCart } from "./cart";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `TB-${ts}-${rand}`;
}

export async function placeStoreOrder(input: {
  storeSlug: string;
  nom: string;
  adresse: string;
  telephone: string;
  modePaiement: "WAVE" | "ORANGE_MONEY" | "COD";
}) {
  const { storeSlug, nom, adresse, telephone, modePaiement } = input;

  if (!nom.trim() || !adresse.trim() || !telephone.trim()) {
    throw new Error("Tous les champs sont requis.");
  }

  const rl = checkRateLimit("placeStoreOrder", 3, 60_000);
  if (!rl.allowed) {
    throw new Error("Trop de commandes. Réessayez dans 1 minute.");
  }

  const user = await getCurrentUser();

  // ── 1. Récupérer le panier filtré par boutique ──
  let cart;
  if (user) {
    cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                store: { include: { sellerProfile: true } },
                media: { where: { position: 0 }, take: 1 },
              },
            },
          },
        },
      },
    });
  } else {
    const { readCartSessionId } = await import("@/lib/guest-session");
    const sid = await readCartSessionId();
    if (!sid) throw new Error("Panier introuvable.");
    cart = await prisma.cart.findFirst({
      where: { sessionId: sid },
      include: {
        items: {
          include: {
            product: {
              include: {
                store: { include: { sellerProfile: true } },
                media: { where: { position: 0 }, take: 1 },
              },
            },
          },
        },
      },
    });
  }

  if (!cart || cart.items.length === 0) throw new Error("Panier vide.");

  // ── 2. Filtrer les items de cette boutique ──
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    include: { sellerProfile: true },
  });
  if (!store) throw new Error("Boutique introuvable.");

  const storeItems = cart.items.filter((item) => item.product.storeId === store.id);
  if (storeItems.length === 0) throw new Error("Aucun produit de cette boutique dans votre panier.");

  // ── 3. Calculer les totaux ──
  let subtotal = BigInt(0);
  for (const item of storeItems) {
    const price =
      item.product.discountPrice && item.product.discountPrice > 0
        ? item.product.discountPrice
        : item.product.price;
    subtotal += price * BigInt(item.quantity);
  }

  const deliveryFee = BigInt(500); // Frais par défaut
  const commissionRateBp = store.sellerProfile?.commissionRateBp ?? 500;
  const commissionAmount = (subtotal * BigInt(commissionRateBp)) / BigInt(10000);
  const grandTotal = subtotal + deliveryFee;

  const shippingAddress = {
    fullName: nom,
    phone: telephone,
    address: adresse,
  };

  // ── 4. Créer la commande dans une transaction ──
  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = generateOrderNumber();

    const createdOrder = await tx.order.create({
      data: {
        number: orderNumber,
        userId: user?.id ?? null,
        guestPhone: telephone,
        status: "PENDING",
        paymentStatus: "PENDING",
        shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
        billingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
        subtotal,
        deliveryTotal: deliveryFee,
        commissionTotal: commissionAmount,
        grandTotal,
      },
    });

    // Payment
    const payment = await tx.payment.create({
      data: {
        orderId: createdOrder.id,
        method: modePaiement,
        amount: grandTotal,
        status: "PENDING",
      },
    });

    // SubOrder
    const subOrder = await tx.subOrder.create({
      data: {
        orderId: createdOrder.id,
        storeId: store.id,
        sellerProfileId: store.sellerProfileId,
        status: "PENDING",
        subtotal,
        deliveryFee,
        commissionRateBp,
        commissionAmount,
        payableAmount: subtotal + deliveryFee,
        shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
      },
    });

    // OrderItems + stock
    for (const item of storeItems) {
      const price =
        item.product.discountPrice && item.product.discountPrice > 0
          ? item.product.discountPrice
          : item.product.price;

      await tx.orderItem.create({
        data: {
          subOrderId: subOrder.id,
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.media.find((m) => m.position === 0)?.url ?? null,
          unitPrice: price,
          quantity: item.quantity,
          lineTotal: price * BigInt(item.quantity),
        },
      });

      await tx.product.update({
        where: { id: item.product.id },
        data: {
          stock: { decrement: item.quantity },
          soldCount: { increment: item.quantity },
        },
      });
    }

    // PaymentSplit
    await tx.paymentSplit.create({
      data: {
        paymentId: payment.id,
        subOrderId: subOrder.id,
        amount: subtotal + deliveryFee,
        status: "PENDING",
      },
    });

    // Commission
    await tx.commission.create({
      data: {
        orderId: createdOrder.id,
        subOrderId: subOrder.id,
        storeId: store.id,
        rateBp: commissionRateBp,
        amount: commissionAmount,
        status: "PENDING",
      },
    });

    // Delivery
    await tx.delivery.create({
      data: {
        subOrderId: subOrder.id,
        method: "STANDARD",
        status: "PENDING",
        fee: deliveryFee,
      },
    });

    // Status history
    await tx.orderStatusHistory.create({
      data: {
        orderId: createdOrder.id,
        status: "PENDING",
        note: `Commande passée depuis la boutique ${store.name}. Client: ${nom}, Tél: ${telephone}.`,
        changedBy: user?.id ?? "guest",
      },
    });

    return createdOrder;
  });

  // ── 5. Supprimer les items de cette boutique du panier ──
  const storeItemIds = storeItems.map((i) => i.id);
  await prisma.cartItem.deleteMany({
    where: { id: { in: storeItemIds } },
  });

  // ── 6. Notification vendeur ──
  const { createNotificationInternal } = await import("@/lib/notifications-internal");
  const sellerId = store.sellerProfile?.userId;
  if (sellerId) {
    const itemList = storeItems.map((i) => `${i.product.name} ×${i.quantity}`).join(", ");
    await createNotificationInternal({
      userId: sellerId,
      type: "ORDER",
      title: "Nouvelle commande reçue",
      content: `Commande ${order.number} : ${itemList} — ${subtotal} FCFA. Client: ${nom}.`,
      link: `/seller/orders`,
    });
  }

  // ── 7. Revalidate ──
  revalidatePath(`/store/${storeSlug}/cart`);
  revalidatePath("/seller/dashboard");
  revalidatePath("/seller/orders");

  return { orderId: order.id, orderNumber: order.number };
}
