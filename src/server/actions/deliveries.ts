"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function getDeliveryBySubOrderId(subOrderId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  const delivery = await prisma.delivery.findUnique({
    where: { subOrderId },
    include: {
      history: { orderBy: { createdAt: "desc" } },
      subOrder: {
        include: {
          order: { select: { id: true, number: true, userId: true } },
          store: { select: { name: true } },
          items: { select: { productName: true, quantity: true } },
        },
      },
    },
  });

  if (!delivery) throw new Error("Livraison introuvable.");

  // Access check: buyer, seller, or admin
  const isBuyer = delivery.subOrder.order.userId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isBuyer && !isAdmin) {
    const store = await prisma.store.findUnique({
      where: { id: delivery.subOrder.storeId },
      include: { sellerProfile: { select: { userId: true } } },
    });
    const isSeller = store?.sellerProfile.userId === user.id;
    if (!isSeller) throw new Error("Non autorisé.");
  }

  return delivery;
}

export async function getAllDeliveries(filters?: {
  status?: string;
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

  const [deliveries, total] = await Promise.all([
    prisma.delivery.findMany({
      where,
      include: {
        subOrder: {
          include: {
            order: { select: { number: true, createdAt: true } },
            store: { select: { name: true } },
            items: { select: { productName: true, quantity: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.delivery.count({ where }),
  ]);

  return { deliveries, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getDeliveryStats() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Non autorisé.");

  const byStatus = await prisma.delivery.groupBy({ by: ["status"], _count: true });
  return Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
}
