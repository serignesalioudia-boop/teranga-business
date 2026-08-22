export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { getSellerStore } from "@/server/actions/seller-stats";
import { getSellerAnalytics } from "@/server/actions/seller-analytics";
import { TrendingUp, ShoppingBag, DollarSign, BarChart3 } from "lucide-react";
import { SellerRevenueChart } from "./_components/seller-revenue-chart";
import { SellerOrdersByStatusChart } from "./_components/seller-orders-by-status-chart";
import { SellerTopProductsChart } from "./_components/seller-top-products-chart";
import { SellerMonthlyRevenueChart } from "./_components/seller-monthly-revenue-chart";


export const metadata = { title: "Analytics — Vendeur — Teranga Business" };

export default async function SellerAnalyticsPage() {
  let store;
  try {
    const result = await getSellerStore();
    store = result.store;
  } catch {
    redirect("/");
  }

  const analytics = await getSellerAnalytics(store.id);

  const kpis = [
    {
      label: "Revenu total",
      value: formatPrice(analytics.totalRevenue),
      icon: DollarSign,
      color: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      label: "Panier moyen",
      value: formatPrice(analytics.avgOrderValue),
      icon: TrendingUp,
      color: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Commandes",
      value: analytics.totalOrders.toString(),
      icon: ShoppingBag,
      color: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      label: "Taux de conversion",
      value: `${analytics.conversionRate.toFixed(1)}%`,
      icon: BarChart3,
      color: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
            <span className={`flex size-11 items-center justify-center rounded-lg ${kpi.color}`}>
              <kpi.icon className={`size-5 ${kpi.iconColor}`} />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SellerRevenueChart data={analytics.revenueByWeek} />
        <SellerOrdersByStatusChart data={analytics.ordersByStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SellerTopProductsChart data={analytics.topProducts} />
        <SellerMonthlyRevenueChart data={analytics.monthlyRevenue} />
      </div>
    </div>
  );
}
