"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type AdminAnalyticsData = {
  revenueByWeek: { week: string; revenue: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; revenue: number; quantity: number }[];
  topStores: { name: string; revenue: number }[];
  newUsersByWeek: { week: string; count: number }[];
  ordersByPaymentMethod: { method: string; count: number }[];
  conversionMetrics: {
    totalUsers: number;
    totalOrders: number;
    activeSellers: number;
    conversionRate: number;
  };
  avgOrderValue: number;
  pendingActions: {
    pendingReviews: number;
    pendingRefunds: number;
    pendingSellerApplications: number;
  };
  kpis: {
    revenueThisMonth: number;
    ordersThisMonth: number;
    newUsersThisMonth: number;
    avgOrderValue: number;
  };
};

export async function getAdminAnalytics(): Promise<AdminAnalyticsData> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Non autorisé.");

  const now = new Date();

  const twelveWeeksAgo = new Date(now);
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    ordersRaw,
    monthlyOrdersRaw,
    statusCounts,
    topProductsRaw,
    topStoresRaw,
    newUsersRaw,
    paymentMethodCounts,
    totalUsers,
    totalOrdersCount,
    totalRevenue,
    activeSellers,
    pendingReviews,
    pendingRefunds,
    pendingSellerApplications,
    monthlyOrdersCount,
    monthlyRevenue,
    monthlyNewUsers,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: twelveWeeksAgo }, status: { not: "CANCELLED" } },
      select: { grandTotal: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, status: { not: "CANCELLED" } },
      select: { grandTotal: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      _sum: { lineTotal: true, quantity: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 10,
    }),
    prisma.subOrder.groupBy({
      by: ["storeId"],
      _sum: { payableAmount: true },
      where: {
        status: { not: "CANCELLED" },
        order: { createdAt: { gte: twelveWeeksAgo } },
      },
      orderBy: { _sum: { payableAmount: "desc" } },
      take: 10,
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: twelveWeeksAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.payment.groupBy({
      by: ["method"],
      _count: { method: true },
      where: {
        status: "SUCCESS",
        createdAt: { gte: twelveWeeksAgo },
      },
    }),
    prisma.user.count(),
    prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { status: { not: "CANCELLED" } },
    }),
    prisma.sellerProfile.count({ where: { status: "ACTIVE" } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.refund.count({ where: { status: "PENDING" } }),
    prisma.sellerProfile.count({ where: { status: "PENDING" } }),
    prisma.order.count({
      where: { createdAt: { gte: thisMonthStart }, status: { not: "CANCELLED" } },
    }),
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { createdAt: { gte: thisMonthStart }, status: { not: "CANCELLED" } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: thisMonthStart } },
    }),
  ]);

  const weekMap = new Map<string, number>();
  for (const o of ordersRaw) {
    const d = new Date(o.createdAt);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    const key = `${d.getFullYear()}-S${String(weekNum).padStart(2, "0")}`;
    weekMap.set(key, (weekMap.get(key) ?? 0) + Number(o.grandTotal));
  }
  const revenueByWeek = Array.from(weekMap.entries())
    .slice(-12)
    .map(([week, revenue]) => ({ week, revenue }));

  const monthLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const monthMap = new Map<string, number>();
  for (const o of monthlyOrdersRaw) {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + Number(o.grandTotal));
  }
  const revenueByMonth = Array.from(monthMap.entries())
    .slice(-6)
    .map(([key, revenue]) => {
      const monthIndex = parseInt(key.split("-")[1], 10) - 1;
      return { month: monthLabels[monthIndex], revenue };
    });

  const statusLabels: Record<string, string> = {
    PENDING: "En attente",
    CONFIRMED: "Confirmée",
    PROCESSING: "En préparation",
    SHIPPED: "Expédiée",
    DELIVERED: "Livrée",
    CANCELLED: "Annulée",
    REFUNDED: "Remboursée",
    PARTIALLY_REFUNDED: "Partielle remboursée",
  };
  const ordersByStatus = statusCounts.map((s) => ({
    status: statusLabels[s.status] ?? s.status,
    count: s._count.status,
  }));

  const topProducts = topProductsRaw.map((p) => ({
    name: p.productName.length > 25 ? p.productName.slice(0, 25) + "…" : p.productName,
    revenue: Number(p._sum.lineTotal ?? 0),
    quantity: p._sum.quantity ?? 0,
  }));

  const storeIds = topStoresRaw.map((s) => s.storeId);
  const stores = await prisma.store.findMany({
    where: { id: { in: storeIds } },
    select: { id: true, name: true },
  });
  const storeNameMap = new Map(stores.map((s) => [s.id, s.name]));
  const topStores = topStoresRaw.map((s) => ({
    name: storeNameMap.get(s.storeId) ?? s.storeId,
    revenue: Number(s._sum.payableAmount ?? 0),
  }));

  const userWeekMap = new Map<string, number>();
  for (const u of newUsersRaw) {
    const d = new Date(u.createdAt);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    const key = `${d.getFullYear()}-S${String(weekNum).padStart(2, "0")}`;
    userWeekMap.set(key, (userWeekMap.get(key) ?? 0) + 1);
  }
  const newUsersByWeek = Array.from(userWeekMap.entries())
    .slice(-12)
    .map(([week, count]) => ({ week, count }));

  const methodLabels: Record<string, string> = {
    WAVE: "Wave",
    ORANGE_MONEY: "Orange Money",
    COD: "Paiement à la livraison",
  };
  const ordersByPaymentMethod = paymentMethodCounts.map((p) => ({
    method: methodLabels[p.method] ?? p.method,
    count: p._count.method,
  }));

  const conversionRate =
    totalUsers > 0 ? Math.round((totalOrdersCount / totalUsers) * 10000) / 100 : 0;

  const avgOrderValue =
    totalOrdersCount > 0
      ? Math.round(Number(totalRevenue._sum.grandTotal ?? 0) / totalOrdersCount)
      : 0;

  const revenueThisMonth = Number(monthlyRevenue._sum.grandTotal ?? 0);

  return {
    revenueByWeek,
    revenueByMonth,
    ordersByStatus,
    topProducts,
    topStores,
    newUsersByWeek,
    ordersByPaymentMethod,
    conversionMetrics: {
      totalUsers,
      totalOrders: totalOrdersCount,
      activeSellers,
      conversionRate,
    },
    avgOrderValue,
    pendingActions: {
      pendingReviews,
      pendingRefunds,
      pendingSellerApplications,
    },
    kpis: {
      revenueThisMonth,
      ordersThisMonth: monthlyOrdersCount,
      newUsersThisMonth: monthlyNewUsers,
      avgOrderValue,
    },
  };
}
