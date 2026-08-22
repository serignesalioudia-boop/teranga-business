"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { clearCart } from "./cart";
import { randomBytes } from "node:crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Prisma } from "@/generated/prisma/client";

// ─── Générer numéro de commande unique ───────────────────

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `TB-${ts}-${rand}`;
}

// ─── Calculer les frais de livraison ─────────────────────

async function computeDeliveryFee(
  storeId: string,
  subtotal: bigint,
): Promise<bigint> {
  // Chercher une règle pour ce magasin d'abord, puis globale
  const rule = await prisma.deliveryRule.findFirst({
    where: {
      OR: [
        { storeId, scope: "VENDOR" },
        { storeId: null, scope: "GLOBAL" },
      ],
      isActive: true,
    },
    orderBy: [{ scope: "asc" }, { priority: "desc" }],
  });

  if (!rule) return BigInt(500); // Frais par défaut 500 XOF

  // Gratuit si freeAbove défini et subtotal atteint
  if (rule.freeAbove && subtotal >= rule.freeAbove) return BigInt(0);

  return rule.fee;
}

// ─── Créer une commande à partir du panier ───────────────

export async function placeOrder(input: {
  addressId: string;
  paymentMethod: "WAVE" | "ORANGE_MONEY" | "COD";
  guestEmail?: string;
  guestPhone?: string;
}) {
  const rl = checkRateLimit("checkout", 5, 60_000);
  if (!rl.allowed) {
    throw new Error("Trop de commandes. Veuillez patienter 1 minute.");
  }

  const user = await getCurrentUser();

  // ── 1. Récupérer le panier ──
  let cart;
  if (user) {
    cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                store: {
                  include: { sellerProfile: true },
                },
                media: { where: { position: 0 }, take: 1 },
              },
            },
          },
        },
      },
    });
  } else {
    // Guest checkout — non supporté proxy exige auth, mais on garde le code
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
                store: {
                  include: { sellerProfile: true },
                },
                media: { where: { position: 0 }, take: 1 },
              },
            },
          },
        },
      },
    });
  }

  if (!cart || cart.items.length === 0) throw new Error("Panier vide.");

  // ── 2. Valider l'adresse ──
  const address = await prisma.address.findUnique({
    where: { id: input.addressId },
  });
  if (!address) throw new Error("Adresse introuvable.");
  if (user && address.userId !== user.id) throw new Error("Adresse non autorisée.");
  if (!user && address.userId) throw new Error("Adresse non autorisée.");

  // ── 3. Grouper par vendeur (storeId) ──
  const byStore = new Map<
    string,
    {
      storeId: string;
      sellerProfileId: string;
      commissionRateBp: number;
      items: typeof cart.items;
    }
  >();

  for (const item of cart.items) {
    const sid = item.product.storeId;
    const existing = byStore.get(sid);
    if (existing) {
      existing.items.push(item);
    } else {
      byStore.set(sid, {
        storeId: sid,
        sellerProfileId: item.product.store.sellerProfileId,
        commissionRateBp: item.product.store.sellerProfile?.commissionRateBp ?? 500,
        items: [item],
      });
    }
  }

  // ── 4. Créer la commande ──
  const orderNumber = generateOrderNumber();

  let grandSubtotal = BigInt(0);
  let grandDelivery = BigInt(0);
  let grandCommission = BigInt(0);

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        number: orderNumber,
        userId: user?.id ?? null,
        guestEmail: input.guestEmail ?? null,
        guestPhone: input.guestPhone ?? null,
        status: "PENDING",
        paymentStatus: "PENDING",
        shippingAddress: JSON.parse(JSON.stringify(address)) as Prisma.InputJsonValue,
        billingAddress: JSON.parse(JSON.stringify(address)) as Prisma.InputJsonValue,
        subtotal: BigInt(0),
        deliveryTotal: BigInt(0),
        commissionTotal: BigInt(0),
        grandTotal: BigInt(0),
      },
    });

    // ── Créer le Payment d'abord (pour les FK des PaymentSplit) ──
    const payment = await tx.payment.create({
      data: {
        orderId: createdOrder.id,
        method: input.paymentMethod,
        amount: BigInt(0),
        status: "PENDING",
      },
    });

    // ── 6. Créer les sous-commandes par vendeur ──
    for (const [, group] of byStore) {
      let subSubtotal = BigInt(0);

      // Calculer le sous-total du vendeur
      for (const item of group.items) {
        const price =
          item.product.discountPrice && item.product.discountPrice > 0
            ? item.product.discountPrice
            : item.product.price;
        subSubtotal += price * BigInt(item.quantity);
      }

      // Frais de livraison
      const deliveryFee = await computeDeliveryFee(
        group.storeId,
        subSubtotal,
      );

      // Commission
      const commissionAmount =
        (subSubtotal * BigInt(group.commissionRateBp)) / BigInt(10000);

      const payableAmount = subSubtotal + deliveryFee;

      const subOrder = await tx.subOrder.create({
        data: {
          orderId: createdOrder.id,
          storeId: group.storeId,
          sellerProfileId: group.sellerProfileId,
          status: "PENDING",
          subtotal: subSubtotal,
          deliveryFee,
          commissionRateBp: group.commissionRateBp,
          commissionAmount,
          payableAmount,
          shippingAddress: JSON.parse(JSON.stringify(address)) as Prisma.InputJsonValue,
        },
      });

      // ── 7. Créer les items + réserver le stock ──
      for (const item of group.items) {
        const currentProduct = await tx.product.findUnique({
          where: { id: item.product.id },
          select: { stock: true, name: true, isDigital: true },
        });
        if (!currentProduct) {
          throw new Error(`Produit introuvable.`);
        }
        if (!currentProduct.isDigital && currentProduct.stock < item.quantity) {
          throw new Error(
            `Stock insuffisant pour "${currentProduct.name}" (disponible: ${currentProduct.stock}).`,
          );
        }

        const price =
          item.product.discountPrice && item.product.discountPrice > 0
            ? item.product.discountPrice
            : item.product.price;

        await tx.orderItem.create({
          data: {
            subOrderId: subOrder.id,
            productId: item.product.id,
            productName: item.product.name,
            productImage:
              item.product.media.find((m) => m.position === 0)?.url ?? null,
            unitPrice: price,
            quantity: item.quantity,
            lineTotal: price * BigInt(item.quantity),
          },
        });

        // Décrémenter le stock (pas pour les digitaux)
        if (!item.product.isDigital) {
          await tx.product.update({
            where: { id: item.product.id },
            data: {
              stock: { decrement: item.quantity },
              soldCount: { increment: item.quantity },
            },
          });
        } else {
          await tx.product.update({
            where: { id: item.product.id },
            data: { soldCount: { increment: item.quantity } },
          });
        }
      }

      // ── 8. Créer le PaymentSplit ──
      await tx.paymentSplit.create({
        data: {
          paymentId: payment.id,
          subOrderId: subOrder.id,
          amount: payableAmount,
          status: "PENDING",
        },
      });

      // ── 9. Créer la Commission ──
      await tx.commission.create({
        data: {
          orderId: createdOrder.id,
          subOrderId: subOrder.id,
          storeId: group.storeId,
          rateBp: group.commissionRateBp,
          amount: commissionAmount,
          status: "PENDING",
        },
      });

      // ── 10. Créer la Delivery ──
      await tx.delivery.create({
        data: {
          subOrderId: subOrder.id,
          method: "STANDARD",
          status: "PENDING",
          fee: deliveryFee,
        },
      });

      grandSubtotal += subSubtotal;
      grandDelivery += deliveryFee;
      grandCommission += commissionAmount;
    }

    const grandTotal = grandSubtotal + grandDelivery;

    // Mettre à jour les totaux de la commande + le montant du Payment
    await tx.order.update({
      where: { id: createdOrder.id },
      data: {
        subtotal: grandSubtotal,
        deliveryTotal: grandDelivery,
        commissionTotal: grandCommission,
        grandTotal,
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: { amount: grandTotal },
    });

    // ── 12. Historique de statut ──
    await tx.orderStatusHistory.create({
      data: {
        orderId: createdOrder.id,
        status: "PENDING",
        note: "Commande créée.",
        changedBy: user?.id ?? "guest",
      },
    });

    return createdOrder;
  });

  // ── 13. Vider le panier ──
  await clearCart();

  // ── 14. Notifications + Emails ──
  const { createNotificationInternal } = await import("@/lib/notifications-internal");
  const { NotificationType } = await import("@/generated/prisma/enums");

  const buyerName = user?.name ?? "Client";

  if (order.userId) {
    await createNotificationInternal({
      userId: order.userId,
      type: NotificationType.ORDER,
      title: `Commande ${order.number} confirmée`,
      content: `Votre commande ${order.number} a été enregistrée avec succès. Montant : ${order.grandTotal} FCFA.`,
      link: `/account/orders/${order.id}`,
    });
  }

  // Récupérer les sous-commandes avec vendeurs pour emails
  const { sendEmail, orderConfirmationEmail, sellerNewOrderEmail } = await import("@/lib/email");
  const fullSubOrders = await prisma.subOrder.findMany({
    where: { orderId: order.id },
    include: {
      store: {
        include: {
          sellerProfile: { select: { userId: true, user: { select: { name: true, email: true } } } },
        },
      },
      items: { select: { productName: true, quantity: true, productId: true } },
    },
  });

  // Email confirmation acheteur
  const buyerEmail = user?.email;
  if (buyerEmail) {
    const itemsList = fullSubOrders
      .flatMap((so) => so.items.map((i) => `${i.productName} ×${i.quantity}`))
      .join(", ");
    const email = orderConfirmationEmail({
      name: buyerName,
      orderNumber: order.number,
      total: order.grandTotal.toString(),
      items: itemsList,
    });
    sendEmail({ to: buyerEmail, subject: email.subject, html: email.html }).catch(() => {});
  }

  // Notify each seller + email
  for (const so of fullSubOrders) {
    const sellerId = so.store.sellerProfile.userId;
    const sellerEmail = so.store.sellerProfile.user.email;
    const sellerName = so.store.sellerProfile.user.name ?? so.store.name;
    if (sellerId) {
      const itemList = so.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ");
      await createNotificationInternal({
        userId: sellerId,
        type: NotificationType.ORDER,
        title: "Nouvelle commande reçue",
        content: `Commande ${order.number} : ${itemList} — ${so.subtotal} FCFA.`,
        link: `/seller/orders`,
      });
      if (sellerEmail) {
        const email = sellerNewOrderEmail({
          sellerName,
          orderNumber: order.number,
          items: itemList,
          total: so.subtotal.toString(),
        });
        sendEmail({ to: sellerEmail, subject: email.subject, html: email.html }).catch(() => {});
      }
    }
  }

  // ── 15. Produits digitaux — lien de téléchargement ──
  if (order.userId) {
    const allItems = fullSubOrders.flatMap((so) => so.items);
    for (const item of allItems) {
      if (!item.productId) continue;
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { isDigital: true, digitalFileUrl: true, digitalFileSize: true, name: true },
      });
      if (!product?.isDigital || !product.digitalFileUrl) continue;

      const downloadUrl = `${process.env.NEXTAUTH_URL ?? "https://terangabusiness.sn"}/account/orders/${order.id}/digital`;

      await createNotificationInternal({
        userId: order.userId,
        type: NotificationType.ORDER,
        title: `Téléchargement disponible : ${product.name}`,
        content: `Votre produit digital « ${product.name} » est prêt à être téléchargé.`,
        link: downloadUrl,
      });

      if (user?.email) {
        const { digitalProductEmail } = await import("@/lib/email");
        const email = digitalProductEmail({
          name: buyerName,
          productName: product.name,
          orderNumber: order.number,
          downloadUrl,
          fileSize: product.digitalFileSize
            ? `${(product.digitalFileSize / (1024 * 1024)).toFixed(2)} Mo`
            : "N/A",
        });
        sendEmail({ to: user.email, subject: email.subject, html: email.html }).catch(() => {});
      }
    }
  }

  return { orderId: order.id, orderNumber: order.number };
}

// ─── Récupérer une commande ──────────────────────────────

export async function getOrderById(orderId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      subOrders: {
        include: {
          items: { include: { product: { select: { slug: true } } } },
          store: { select: { name: true, slug: true, whatsapp: true } },
          delivery: true,
          commission: true,
        },
      },
      payment: true,
      statusHist: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) throw new Error("Commande introuvable.");
  if (order.userId !== user.id && user.role !== "ADMIN")
    throw new Error("Commande non autorisée.");

  return order;
}

// ─── Lister les commandes de l'utilisateur ───────────────

export async function getUserOrders() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  return prisma.order.findMany({
    where: { userId: user.id },
    include: {
      subOrders: {
        include: {
          store: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
