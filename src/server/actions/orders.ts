"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { NotificationType } from "@/generated/prisma/enums";
import { createNotificationInternal } from "@/lib/notifications-internal";
import { sendEmail, orderStatusEmail } from "@/lib/email";
import {
  VALID_ORDER_TRANSITIONS,
  VALID_SUBORDER_TRANSITIONS,
  VALID_DELIVERY_TRANSITIONS,
} from "@/lib/order-status";
import { logAction } from "@/lib/audit-log-helper";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PROCESSING: "En préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  COMPLETED: "Terminée",
  REFUNDED: "Remboursée",
  ACCEPTED: "Acceptée",
  PREPARING: "En préparation",
  READY: "Prête",
  IN_TRANSIT: "En transit",
  OUT_FOR_DELIVERY: "En cours de livraison",
};

// ─── Admin : lister toutes les commandes ─────────────────

export async function getAllOrders(filters?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Non autorisé.");

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.OR = [
      { number: { contains: filters.search, mode: "insensitive" } },
      { guestEmail: { contains: filters.search, mode: "insensitive" } },
      { user: { email: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        subOrders: {
          include: { store: { select: { name: true } } },
        },
        payment: { select: { method: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// ─── Admin : stats commandes ─────────────────────────────

export async function getOrderStats() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Non autorisé.");

  const [total, byStatus, totalRevenue] = await Promise.all([
    prisma.order.count(),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.order.aggregate({ _sum: { grandTotal: true }, where: { status: { not: "CANCELLED" } } }),
  ]);

  return {
    total,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
    totalRevenue: totalRevenue._sum.grandTotal ?? BigInt(0),
  };
}

// ─── Admin : mettre à jour le statut d'une commande ──────

export async function updateOrderStatus(
  orderId: string,
  status: string,
  note?: string,
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Non autorisé.");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Commande introuvable.");

  const allowed = VALID_ORDER_TRANSITIONS[order.status];
  if (!allowed || !allowed.includes(status)) {
    throw new Error(
      `Transition invalide : ${order.status} → ${status}`,
    );
  }

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: status as never } }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: status as never,
        note: note ?? `Statut mis à jour : ${status}`,
        changedBy: user.id,
      },
    }),
  ]);

  await logAction({
    action: "ORDER_STATUS_CHANGED",
    entityType: "Order",
    entityId: orderId,
    before: { status: order.status },
    after: { status },
  });

  if (order.userId) {
    await createNotificationInternal({
      userId: order.userId,
      type: NotificationType.ORDER,
      title: `Commande ${order.number} — ${status}`,
      content: `Le statut de votre commande ${order.number} a été mis à jour : ${status}.`,
      link: `/account/orders/${order.id}`,
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { name: true, email: true } } },
    });
    if (fullOrder?.user?.email) {
      const email = orderStatusEmail({
        name: fullOrder.user.name ?? "Client",
        orderNumber: order.number,
        status,
        statusLabel: STATUS_LABELS[status] ?? status,
      });
      sendEmail({ to: fullOrder.user.email, subject: email.subject, html: email.html }).catch(() => {});
    }
  }

  return { ok: true };
}

// ─── Vendeur/Admin : sous-commandes d'un vendeur ─────────

export async function getStoreSubOrders(storeId: string, filters?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  if (user.role !== "ADMIN") {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { sellerProfile: { select: { userId: true } } },
    });
    if (!store || store.sellerProfile.userId !== user.id) {
      throw new Error("Non autorisé.");
    }
  }

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { storeId };
  if (filters?.status) where.status = filters.status;

  const [subOrders, total] = await Promise.all([
    prisma.subOrder.findMany({
      where,
      include: {
        order: { select: { number: true, createdAt: true, shippingAddress: true } },
        items: true,
        delivery: true,
        store: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.subOrder.count({ where }),
  ]);

  return { subOrders, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// ─── Vendeur : détail d'une sous-commande ────────────────

export async function getSubOrderDetail(subOrderId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: {
      order: {
        select: {
          number: true,
          createdAt: true,
          shippingAddress: true,
          status: true,
          user: { select: { name: true, email: true } },
        },
      },
      items: true,
      store: { select: { name: true, slug: true } },
      delivery: true,
      commission: true,
      paymentSplit: { include: { payment: true } },
    },
  });

  if (!subOrder) throw new Error("Sous-commande introuvable.");

  // Vérifier que le vendeur est bien propriétaire du store
  if (user.role !== "ADMIN") {
    const store = await prisma.store.findUnique({
      where: { id: subOrder.storeId },
      include: { sellerProfile: { select: { userId: true } } },
    });
    if (!store || store.sellerProfile.userId !== user.id) {
      throw new Error("Non autorisé.");
    }
  }

  return subOrder;
}

// ─── Vendeur/Admin : mettre à jour statut sous-commande ──

export async function updateSubOrderStatus(
  subOrderId: string,
  status: string,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: { store: { include: { sellerProfile: true } } },
  });
  if (!subOrder) throw new Error("Sous-commande introuvable.");

  if (user.role !== "ADMIN" && subOrder.store.sellerProfile.userId !== user.id) {
    throw new Error("Non autorisé.");
  }

  const allowed = VALID_SUBORDER_TRANSITIONS[subOrder.status];
  if (!allowed || !allowed.includes(status)) {
    throw new Error(`Transition invalide : ${subOrder.status} → ${status}`);
  }

  await prisma.subOrder.update({
    where: { id: subOrderId },
    data: { status: status as never },
  });

  await logAction({
    action: "SUBORDER_STATUS_CHANGED",
    entityType: "SubOrder",
    entityId: subOrderId,
    before: { status: subOrder.status },
    after: { status },
  });

  const fullSubOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: { order: { select: { id: true, number: true, userId: true } } },
  });

  if (fullSubOrder?.order.userId) {
    const storeName = subOrder.store.name;
    await createNotificationInternal({
      userId: fullSubOrder.order.userId,
      type: NotificationType.DELIVERY,
      title: `Sous-commande ${fullSubOrder.order.number} — ${status}`,
      content: `La commande auprès de ${storeName} est maintenant : ${status}.`,
      link: `/account/orders/${fullSubOrder.order.id}`,
    });

    const buyer = await prisma.user.findUnique({
      where: { id: fullSubOrder.order.userId },
      select: { name: true, email: true },
    });
    if (buyer?.email) {
      const email = orderStatusEmail({
        name: buyer.name ?? "Client",
        orderNumber: fullSubOrder.order.number,
        status,
        statusLabel: STATUS_LABELS[status] ?? status,
      });
      sendEmail({ to: buyer.email, subject: email.subject, html: email.html }).catch(() => {});
    }
  }

  return { ok: true };
}

// ─── Vendeur/Admin : mettre à jour livraison ─────────────

export async function updateDeliveryStatus(
  deliveryId: string,
  status: string,
  trackingNumber?: string,
  note?: string,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { subOrder: { include: { store: { include: { sellerProfile: true } } } } },
  });
  if (!delivery) throw new Error("Livraison introuvable.");

  if (user.role !== "ADMIN" && delivery.subOrder.store.sellerProfile.userId !== user.id) {
    throw new Error("Non autorisé.");
  }

  const allowed = VALID_DELIVERY_TRANSITIONS[delivery.status];
  if (!allowed || !allowed.includes(status)) {
    throw new Error(`Transition invalide : ${delivery.status} → ${status}`);
  }

  const updateData: Record<string, unknown> = { status: status as never };
  if (trackingNumber) updateData.trackingNumber = trackingNumber;
  if (status === "SHIPPED") updateData.shippedAt = new Date();
  if (status === "DELIVERED") updateData.deliveredAt = new Date();

  await prisma.$transaction([
    prisma.delivery.update({ where: { id: deliveryId }, data: updateData }),
    prisma.deliveryStatusHistory.create({
      data: {
        deliveryId,
        status: status as never,
        note: note ?? `Livraison : ${status}`,
        changedBy: user.id,
      },
    }),
  ]);

  await logAction({
    action: "DELIVERY_STATUS_CHANGED",
    entityType: "Delivery",
    entityId: deliveryId,
    before: { status: delivery.status },
    after: { status },
  });

  const fullDelivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { subOrder: { include: { order: { select: { id: true, number: true, userId: true } } } } },
  });

  if (fullDelivery?.subOrder.order.userId) {
    await createNotificationInternal({
      userId: fullDelivery.subOrder.order.userId,
      type: NotificationType.DELIVERY,
      title: `Livraison ${fullDelivery.subOrder.order.number} — ${status}`,
      content: `Le statut de votre livraison pour la commande ${fullDelivery.subOrder.order.number} est : ${status}.`,
      link: `/account/orders/${fullDelivery.subOrder.order.id}`,
    });

    const buyer = await prisma.user.findUnique({
      where: { id: fullDelivery.subOrder.order.userId },
      select: { name: true, email: true },
    });
    if (buyer?.email) {
      const { deliveryUpdateEmail } = await import("@/lib/email");
      const email = deliveryUpdateEmail({
        name: buyer.name ?? "Client",
        orderNumber: fullDelivery.subOrder.order.number,
        status,
        statusLabel: STATUS_LABELS[status] ?? status,
      });
      sendEmail({ to: buyer.email, subject: email.subject, html: email.html }).catch(() => {});
    }
  }

  return { ok: true };
}
