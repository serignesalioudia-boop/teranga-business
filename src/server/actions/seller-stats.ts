"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function getSellerStore() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
    include: { store: true },
  });

  if (!sellerProfile?.store) throw new Error("Boutique introuvable.");
  return { sellerProfile, store: sellerProfile.store };
}

export async function getSellerStats(storeId: string) {
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

  const [productCount, orderCount, revenue, topProducts, pendingCommission, paidCommission] =
    await Promise.all([
      prisma.product.count({ where: { storeId } }),
      prisma.subOrder.count({ where: { storeId } }),
      prisma.subOrder.aggregate({
        where: { storeId, status: { not: "CANCELLED" } },
        _sum: { payableAmount: true },
      }),
      prisma.orderItem.findMany({
        where: { subOrder: { storeId } },
        include: { product: { select: { name: true } } },
        orderBy: { subOrder: { createdAt: "desc" } },
        take: 50,
      }),
      prisma.commission.aggregate({
        where: { storeId, status: "PENDING" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.commission.aggregate({
        where: { storeId, status: "PAID" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

  const productSales = new Map<string, { name: string; quantity: number; revenue: bigint }>();
  for (const item of topProducts) {
    const key = item.productId ?? item.productName;
    const existing = productSales.get(key);
    if (existing) {
      existing.quantity += item.quantity;
      existing.revenue += item.lineTotal;
    } else {
      productSales.set(key, {
        name: item.product?.name ?? item.productName,
        quantity: item.quantity,
        revenue: item.lineTotal,
      });
    }
  }

  const topSelling = [...productSales.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    productCount,
    orderCount,
    totalRevenue: revenue._sum.payableAmount ?? BigInt(0),
    topProducts: topSelling,
    pendingCommission: pendingCommission._sum.amount ?? BigInt(0),
    pendingCommissionCount: pendingCommission._count,
    paidCommission: paidCommission._sum.amount ?? BigInt(0),
    paidCommissionCount: paidCommission._count,
  };
}

export async function getSellerCommissions(storeId: string) {
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

  return prisma.commission.findMany({
    where: { storeId },
    include: {
      order: { select: { number: true, createdAt: true } },
      subOrder: { select: { payableAmount: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
