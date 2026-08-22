"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type SellerAnalytics = {
  revenueByWeek: { week: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; revenue: number; quantity: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  conversionRate: number;
  avgOrderValue: number;
  totalRevenue: number;
  totalOrders: number;
};

const SUBORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  REJECTED: "Rejetée",
  PROCESSING: "En préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

export async function getSellerAnalytics(storeId: string): Promise<SellerAnalytics> {
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

  const now = new Date();
  const twelveWeeksAgo = new Date(now);
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    subOrdersRaw,
    statusCounts,
    topProductsRaw,
    monthlyRaw,
    totalRevenueAgg,
    totalOrdersCount,
  ] = await Promise.all([
    prisma.subOrder.findMany({
      where: { storeId, createdAt: { gte: twelveWeeksAgo }, status: { not: "CANCELLED" } },
      select: { payableAmount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.subOrder.groupBy({
      by: ["status"],
      where: { storeId },
      _count: { status: true },
    }),
    prisma.orderItem.findMany({
      where: { subOrder: { storeId } },
      include: { product: { select: { name: true } } },
      orderBy: { subOrder: { createdAt: "desc" } },
      take: 200,
    }),
    prisma.subOrder.findMany({
      where: { storeId, createdAt: { gte: sixMonthsAgo }, status: { not: "CANCELLED" } },
      select: { payableAmount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.subOrder.aggregate({
      where: { storeId, status: { not: "CANCELLED" } },
      _sum: { payableAmount: true },
    }),
    prisma.subOrder.count({ where: { storeId } }),
  ]);

  const weekMap = new Map<string, number>();
  for (const o of subOrdersRaw) {
    const d = new Date(o.createdAt);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const key = `S${weekNum}`;
    weekMap.set(key, (weekMap.get(key) ?? 0) + Number(o.payableAmount));
  }
  const revenueByWeek = Array.from(weekMap.entries())
    .slice(-12)
    .map(([week, revenue]) => ({ week, revenue }));

  const ordersByStatus = statusCounts.map((s) => ({
    status: SUBORDER_STATUS_LABELS[s.status] ?? s.status,
    count: s._count.status,
  }));

  const productSales = new Map<string, { name: string; quantity: number; revenue: bigint }>();
  for (const item of topProductsRaw) {
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
  const topProducts = [...productSales.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map((p) => ({
      name: p.name.length > 20 ? p.name.slice(0, 20) + "…" : p.name,
      revenue: Number(p.revenue),
      quantity: p.quantity,
    }));

  const monthMap = new Map<string, number>();
  const monthLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const key = monthLabels[d.getMonth()];
    monthMap.set(key, 0);
  }
  for (const o of monthlyRaw) {
    const d = new Date(o.createdAt);
    const key = monthLabels[d.getMonth()];
    monthMap.set(key, (monthMap.get(key) ?? 0) + Number(o.payableAmount));
  }
  const monthlyRevenue = Array.from(monthMap.entries()).map(([month, revenue]) => ({ month, revenue }));

  const totalRevenue = Number(totalRevenueAgg._sum.payableAmount ?? 0);
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  return {
    revenueByWeek,
    ordersByStatus,
    topProducts,
    monthlyRevenue,
    conversionRate: 0,
    avgOrderValue,
    totalRevenue,
    totalOrders: totalOrdersCount,
  };
}
