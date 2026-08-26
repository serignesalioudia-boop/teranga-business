export const dynamic = "force-dynamic";

import { getSellerStore, getSellerCommissions, getSellerStats } from "@/server/actions/seller-stats";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


export const metadata = { title: "Revenus — Vendeur — Teranga Business" };

export default async function SellerRevenuePage() {
  let store;
  try {
    const result = await getSellerStore();
    store = result.store;
  } catch {
    return (<div className="flex min-h-[50vh] items-center justify-center"><p className="text-muted-foreground">Chargement…</p></div>);
  }

  const [stats, commissions] = await Promise.all([
    getSellerStats(store.id),
    getSellerCommissions(store.id),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Revenus</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Revenus totaux</p>
          <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Commissions en attente</p>
          <p className="text-2xl font-bold">{formatPrice(stats.pendingCommission)}</p>
          <p className="text-xs text-muted-foreground">{stats.pendingCommissionCount} commande(s)</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Commissions payées</p>
          <p className="text-2xl font-bold">{formatPrice(stats.paidCommission)}</p>
          <p className="text-xs text-muted-foreground">{stats.paidCommissionCount} commande(s)</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">Historique des commissions</h2>
        {commissions.length === 0 ? (
          <p className="text-muted-foreground">Aucune commission pour le moment.</p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs font-bold">
                      {c.order.number}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(c.createdAt).toLocaleDateString("fr-SN")}
                    </TableCell>
                    <TableCell className="font-bold">{formatPrice(c.amount)}</TableCell>
                    <TableCell className="text-sm">{(c.rateBp / 100).toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "PAID" ? "default" : "secondary"}>
                        {c.status === "PAID" ? "Payé" : "En attente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
