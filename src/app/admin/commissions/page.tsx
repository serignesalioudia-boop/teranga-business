export const dynamic = "force-dynamic";

import { formatPrice } from "@/lib/format";
import { getCommissionStats, getCommissionByStore } from "@/server/actions/admin-commissions";


export const metadata = { title: "Commissions — Admin" };

export default async function AdminCommissionsPage() {
  const [stats, byStore] = await Promise.all([
    getCommissionStats(),
    getCommissionByStore(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Commissions</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">En attente</p>
          <p className="text-2xl font-bold text-yellow-600">{formatPrice(stats.pendingAmount)}</p>
          <p className="text-xs text-muted-foreground">{stats.pendingCount} commission(s)</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Payées</p>
          <p className="text-2xl font-bold text-green-600">{formatPrice(stats.paidAmount)}</p>
          <p className="text-xs text-muted-foreground">{stats.paidCount} commission(s)</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{formatPrice(stats.totalAmount)}</p>
          <p className="text-xs text-muted-foreground">{stats.totalCount} commission(s)</p>
        </div>
      </div>

      {/* By store */}
      <div className="rounded-xl border">
        <div className="bg-muted/50 px-4 py-3">
          <h3 className="text-sm font-semibold">Par vendeur</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-4 py-3 font-medium">Boutique</th>
              <th className="px-4 py-3 font-medium">Vendeur</th>
              <th className="px-4 py-3 font-medium">En attente</th>
              <th className="px-4 py-3 font-medium">Payées</th>
              <th className="px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {byStore.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Aucune commission.
                </td>
              </tr>
            ) : (
              byStore.map((s) => (
                <tr key={s.storeId} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{s.storeName}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs">{s.sellerName}</p>
                    <p className="text-xs text-muted-foreground">{s.sellerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-yellow-600 font-bold">
                    {formatPrice(s.pendingAmount)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">({s.pendingCount})</span>
                  </td>
                  <td className="px-4 py-3 text-green-600 font-bold">
                    {formatPrice(s.paidAmount)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">({s.paidCount})</span>
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {formatPrice(Number(s.pendingAmount) + Number(s.paidAmount))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
