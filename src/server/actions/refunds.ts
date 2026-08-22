"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

const refundSchema = z.object({
  subOrderId: z.string().min(1, "Commande requise."),
  reason: z.string().min(10, "La raison doit contenir au moins 10 caractères."),
});

export async function requestRefund(input: { subOrderId: string; reason: string }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Connexion requise.");

  const data = refundSchema.parse(input);

  const subOrder = await prisma.subOrder.findUnique({
    where: { id: data.subOrderId },
    include: {
      order: { select: { userId: true } },
      paymentSplit: { select: { paymentId: true, amount: true } },
    },
  });

  if (!subOrder) throw new Error("Commande introuvable.");
  if (subOrder.order.userId !== user.id) throw new Error("Non autorisé.");

  const cancellableStatuses = ["PENDING", "CONFIRMED", "PROCESSING"];
  if (!cancellableStatuses.includes(subOrder.status)) {
    throw new Error("Cette commande ne peut plus faire l'objet d'un remboursement.");
  }

  if (subOrder.paymentSplit) {
    const existingRefund = await prisma.refund.findFirst({
      where: {
        subOrderId: data.subOrderId,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });
    if (existingRefund) {
      throw new Error("Une demande de remboursement est déjà en cours.");
    }
  }

  const refund = await prisma.refund.create({
    data: {
      paymentId: subOrder.paymentSplit?.paymentId ?? "",
      subOrderId: data.subOrderId,
      amount: subOrder.payableAmount,
      reason: data.reason,
      status: "PENDING",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "REFUND_REQUESTED",
      entityType: "Refund",
      entityId: refund.id,
      after: { subOrderId: data.subOrderId, amount: subOrder.payableAmount.toString(), reason: data.reason },
    },
  });

  revalidatePath(`/account/orders/${subOrder.orderId}`);
  revalidatePath("/admin/refunds");
  return { success: true, refundId: refund.id };
}

export async function getRefundBySubOrder(subOrderId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Connexion requise.");

  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: { order: { select: { userId: true } }, store: { include: { sellerProfile: { select: { userId: true } } } } },
  });
  if (!subOrder) throw new Error("Commande introuvable.");

  const isBuyer = subOrder.order.userId === user.id;
  const isSeller = subOrder.store.sellerProfile?.userId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isBuyer && !isSeller && !isAdmin) throw new Error("Non autorisé.");

  return prisma.refund.findFirst({
    where: { subOrderId },
    orderBy: { createdAt: "desc" },
  });
}

export async function processRefund(
  refundId: string,
  action: "APPROVED" | "REJECTED",
  note?: string,
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Accès réservé aux administrateurs.");

  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: { subOrder: true },
  });
  if (!refund) throw new Error("Remboursement introuvable.");
  if (refund.status !== "PENDING") {
    throw new Error("Ce remboursement a déjà été traité.");
  }

  await prisma.refund.update({
    where: { id: refundId },
    data: { status: action },
  });

  if (action === "APPROVED" && refund.subOrderId) {
    await prisma.subOrder.update({
      where: { id: refund.subOrderId },
      data: { status: "CANCELLED" },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: `REFUND_${action}`,
      entityType: "Refund",
      entityId: refundId,
      before: { status: refund.status },
      after: { status: action, note },
    },
  });

  revalidatePath("/admin/refunds");
  revalidatePath(`/account/orders`);
  return { success: true };
}

export async function getAdminRefunds(status?: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Accès réservé aux administrateurs.");

  return prisma.refund.findMany({
    where: status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED" | "FAILED" } : {},
    include: {
      subOrder: {
        include: {
          order: { select: { id: true, userId: true } },
          store: { select: { name: true } },
        },
      },
      payment: { select: { method: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRefundStats() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Accès réservé aux administrateurs.");

  const [pending, approved, rejected, totalAmount] = await Promise.all([
    prisma.refund.count({ where: { status: "PENDING" } }),
    prisma.refund.count({ where: { status: "APPROVED" } }),
    prisma.refund.count({ where: { status: "REJECTED" } }),
    prisma.refund.aggregate({ _sum: { amount: true }, where: { status: "APPROVED" } }),
  ]);

  return {
    pending,
    approved,
    rejected,
    totalRefunded: totalAmount._sum.amount ?? BigInt(0),
  };
}
