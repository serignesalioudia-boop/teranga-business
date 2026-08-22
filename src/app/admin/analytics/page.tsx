export const dynamic = "force-dynamic";

import { getAdminAnalytics } from "@/server/actions/admin-analytics";
import { formatPrice } from "@/lib/format";
import { RevenueChart } from "./_components/revenue-chart";
import { StatusPieChart } from "./_components/status-pie-chart";
import { PaymentPieChart } from "./_components/payment-pie-chart";
import { TopProductsChart } from "./_components/top-products-chart";
import { TopStoresChart } from "./_components/top-stores-chart";
import { UsersTrendChart } from "./_components/users-trend-chart";


export const metadata = { title: "Analytics — Admin — Teranga Business" };

export default async function AdminAnalyticsPage() {
  const data = await getAdminAnalytics();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytiques</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Revenus du mois"
          value={formatPrice(data.kpis.revenueThisMonth)}
        />
        <KpiCard
          label="Commandes du mois"
          value={data.kpis.ordersThisMonth.toLocaleString("fr-SN")}
        />
        <KpiCard
          label="Nouveaux utilisateurs"
          value={data.kpis.newUsersThisMonth.toLocaleString("fr-SN")}
        />
        <KpiCard
          label="Panier moyen"
          value={formatPrice(data.kpis.avgOrderValue)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Utilisateurs totaux"
          value={data.conversionMetrics.totalUsers.toLocaleString("fr-SN")}
        />
        <KpiCard
          label="Vendeurs actifs"
          value={data.conversionMetrics.activeSellers.toLocaleString("fr-SN")}
        />
        <KpiCard
          label="Taux de conversion"
          value={`${data.conversionMetrics.conversionRate}%`}
        />
        <KpiCard
          label="Panier moyen global"
          value={formatPrice(data.avgOrderValue)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RevenueChart data={data.revenueByWeek} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StatusPieChart data={data.ordersByStatus} />
        <PaymentPieChart data={data.ordersByPaymentMethod} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopProductsChart data={data.topProducts} />
        <TopStoresChart data={data.topStores} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UsersTrendChart data={data.newUsersByWeek} />
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 text-sm font-medium">Actions en attente</h3>
          <div className="space-y-4">
            <PendingRow
              label="Avis en attente"
              count={data.pendingActions.pendingReviews}
            />
            <PendingRow
              label="Remboursements en attente"
              count={data.pendingActions.pendingRefunds}
            />
            <PendingRow
              label="Demandes vendeur en attente"
              count={data.pendingActions.pendingSellerApplications}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function PendingRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-4 py-3">
      <span className="text-sm">{label}</span>
      <span className="text-sm font-semibold">{count}</span>
    </div>
  );
}
