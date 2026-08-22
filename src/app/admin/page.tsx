export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { Package, Store, Tag, ShoppingBag, MessageSquare, Users } from "lucide-react";
import { getDashboardData } from "@/server/actions/dashboard";
import { RevenueChart } from "./_components/revenue-chart";
import { OrdersByStatusChart } from "./_components/orders-by-status-chart";
import { TopProductsChart } from "./_components/top-products-chart";
import { OrdersByDayChart } from "./_components/orders-by-day-chart";


export const metadata = { title: "Tableau de bord — Admin — Teranga Business" };

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [categories, products, stores, orders, revenue, pendingReviews] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.store.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { grandTotal: true }, where: { status: { not: "CANCELLED" } } }),
    prisma.review.count({ where: { status: "PENDING" } }),
  ]);

  const totalRevenue = revenue._sum.grandTotal ?? BigInt(0);
  const dashboard = await getDashboardData();

  const cards = [
    { label: "Commandes", count: orders, href: "/admin/orders", icon: ShoppingBag },
    { label: "Utilisateurs", count: dashboard.totalUsers, href: "/admin/users", icon: Users },
    { label: "Vendeurs", count: dashboard.totalSellers, href: "/admin/stores", icon: Store },
    { label: "Produits actifs", count: dashboard.activeProducts, href: "/admin/products", icon: Package },
    { label: "Catégories", count: categories, href: "/admin/categories", icon: Tag },
    { label: "Avis en attente", count: pendingReviews, href: "/admin/reviews?status=PENDING", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Revenu total</p>
          <p className="text-3xl font-bold">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Panier moyen</p>
          <p className="text-3xl font-bold">{formatPrice(dashboard.avgOrderValue)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Vendeurs actifs</p>
          <p className="text-3xl font-bold">{dashboard.totalSellers}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Commandes (total)</p>
          <p className="text-3xl font-bold">{orders}</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-md"
          >
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
              <c.icon className="size-5 text-primary" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-2xl font-bold">{c.count}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={dashboard.revenueByWeek} />
        <OrdersByStatusChart data={dashboard.ordersByStatus} />
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopProductsChart data={dashboard.topProducts} />
        <OrdersByDayChart data={dashboard.ordersByDay} />
      </div>

      {/* Recent orders */}
      {dashboard.recentOrders.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Dernières commandes</h3>
            <Link href="/admin/orders" className="text-xs text-primary hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="divide-y">
            {dashboard.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-mono text-xs font-bold">{o.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString("fr-SN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPrice(o.grandTotal)}</p>
                  <p className="text-xs text-muted-foreground">{o.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
