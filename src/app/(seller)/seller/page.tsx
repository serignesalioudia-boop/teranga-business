export const dynamic = "force-dynamic";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { SUBORDER_STATUS_LABELS, SUBORDER_STATUS_COLORS } from "@/lib/order-status";
import { Package, ShoppingBag, TrendingUp, Box } from "lucide-react";
import { getSellerStore, getSellerStats } from "@/server/actions/seller-stats";
import { prisma } from "@/lib/prisma";


export const metadata = { title: "Dashboard vendeur — Teranga Business" };

export default async function SellerDashboardPage() {
  let store;
  try {
    const result = await getSellerStore();
    store = result.store;
  } catch {
    return null;
  }

  let stats;
  let recentSubOrders;
  try {
    [stats, recentSubOrders] = await Promise.all([
      getSellerStats(store.id),
      prisma.subOrder.findMany({
        where: { storeId: store.id },
        include: {
          order: { select: { number: true, createdAt: true } },
          items: { select: { productName: true, quantity: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);
  } catch {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{store.name}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
            <ShoppingBag className="size-5 text-primary" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Commandes</p>
            <p className="text-2xl font-bold">{stats.orderCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <span className="flex size-11 items-center justify-center rounded-lg bg-blue-100">
            <Box className="size-5 text-blue-600" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Produits</p>
            <p className="text-2xl font-bold">{stats.productCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <span className="flex size-11 items-center justify-center rounded-lg bg-yellow-100">
            <Package className="size-5 text-yellow-600" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">En attente</p>
            <p className="text-2xl font-bold">{stats.pendingCommissionCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <span className="flex size-11 items-center justify-center rounded-lg bg-green-100">
            <TrendingUp className="size-5 text-green-600" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Revenus</p>
            <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
          </div>
        </div>
      </div>

      {stats.topProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Top produits</h2>
            <Link href="/seller/products" className="text-sm text-primary hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="rounded-xl border">
            {stats.topProducts.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b px-4 py-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.quantity} vendu(s)</p>
                </div>
                <p className="font-bold">{formatPrice(p.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Commandes récentes</h2>
          <Link href="/seller/orders" className="text-sm text-primary hover:underline">
            Voir tout
          </Link>
        </div>
        {recentSubOrders.length === 0 ? (
          <p className="text-muted-foreground">Aucune commande.</p>
        ) : (
          <div className="space-y-2">
            {recentSubOrders.map((sub) => (
              <Link
                key={sub.id}
                href={`/seller/orders/${sub.id}`}
                className="flex items-center justify-between rounded-xl border p-4 transition hover:border-primary/50 hover:bg-accent/50"
              >
                <div className="space-y-1">
                  <p className="font-mono text-sm font-bold">{sub.order.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {sub.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sub.order.createdAt).toLocaleDateString("fr-SN")}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={SUBORDER_STATUS_COLORS[sub.status] ?? ""}>
                    {SUBORDER_STATUS_LABELS[sub.status] ?? sub.status}
                  </Badge>
                  <p className="mt-1 text-sm font-bold">{formatPrice(sub.payableAmount)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
