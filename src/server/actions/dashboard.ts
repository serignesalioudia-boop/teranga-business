"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type DashboardChartData = {
  revenueByWeek: { week: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; revenue: number; quantity: number }[];
  ordersByDay: { date: string; count: number }[];
  recentOrders: {
    id: string;
    number: string;
    grandTotal: number;
    status: string;
    createdAt: Date;
  }[];
  totalUsers: number;
  totalSellers: number;
  activeProducts: number;
  avgOrderValue: number;
};

export async function getDashboardData(): Promise<DashboardChartData> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Non autorisé.");
  const now = new Date();
  const twelveWeeksAgo = new Date(now);
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    ordersRaw,
    statusCounts,
    topProductsRaw,
    ordersByDayRaw,
    recentOrdersRaw,
    totalUsers,
    totalSellers,
    activeProducts,
    totalOrdersCount,
    totalRevenue,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: twelveWeeksAgo }, status: { not: "CANCELLED" } },
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
      _count: { id: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, status: { not: "CANCELLED" } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      select: {
        id: true,
        number: true,
        grandTotal: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.user.count(),
    prisma.sellerProfile.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { status: { not: "CANCELLED" } },
    }),
  ]);

  // Group revenue by ISO week
  const weekMap = new Map<string, number>();
  for (const o of ordersRaw) {
    const d = new Date(o.createdAt);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const key = `S${weekNum}`;
    weekMap.set(key, (weekMap.get(key) ?? 0) + Number(o.grandTotal));
  }
  const revenueByWeek = Array.from(weekMap.entries())
    .slice(-12)
    .map(([week, revenue]) => ({ week, revenue }));

  // Orders by status
  const statusLabels: Record<string, string> = {
    PENDING: "En attente",
    CONFIRMED: "Confirmée",
    PROCESSING: "En préparation",
    SHIPPED: "Expédiée",
    DELIVERED: "Livrée",
    CANCELLED: "Annulée",
  };
  const ordersByStatus = statusCounts.map((s) => ({
    status: statusLabels[s.status] ?? s.status,
    count: s._count.status,
  }));

  // Top products
  const topProducts = topProductsRaw.map((p) => ({
    name: p.productName.length > 20 ? p.productName.slice(0, 20) + "…" : p.productName,
    revenue: Number(p._sum.lineTotal ?? 0),
    quantity: p._sum.quantity ?? 0,
  }));

  // Orders by day (last 7 days)
  const dayMap = new Map<string, number>();
  const dayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${dayLabels[d.getDay()]} ${d.getDate()}`;
    dayMap.set(key, 0);
  }
  for (const o of ordersByDayRaw) {
    const d = new Date(o.createdAt);
    const key = `${dayLabels[d.getDay()]} ${d.getDate()}`;
    dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }
  const ordersByDay = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));

  const recentOrders = recentOrdersRaw.map((o) => ({
    ...o,
    grandTotal: Number(o.grandTotal),
  }));

  const avgOrderValue =
    totalOrdersCount > 0 ? Number(totalRevenue._sum.grandTotal ?? 0) / totalOrdersCount : 0;

  return {
    revenueByWeek,
    ordersByStatus,
    topProducts,
    ordersByDay,
    recentOrders,
    totalUsers,
    totalSellers,
    activeProducts,
    avgOrderValue: Math.round(avgOrderValue),
  };
}
