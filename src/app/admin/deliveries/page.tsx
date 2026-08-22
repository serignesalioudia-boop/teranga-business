import { getAllDeliveries, getDeliveryStats } from "@/server/actions/deliveries";
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS } from "@/lib/order-status";
import { formatPrice } from "@/lib/format";
import Link from "next/link";

export const metadata = { title: "Livraisons — Admin — Teranga Business" };

export default async function AdminDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "";
  const page = Number(params.page ?? 1);

  const [{ deliveries, totalPages }, stats] = await Promise.all([
    getAllDeliveries({ status, page, pageSize: 20 }),
    getDeliveryStats(),
  ]);

  const totalAll = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Livraisons</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-xl border p-3 text-center">
          <p className="text-2xl font-bold">{totalAll}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        {Object.entries(stats).map(([s, count]) => (
          <Link
            key={s}
            href={`/admin/deliveries?status=${s}`}
            className={`rounded-xl border p-3 text-center transition hover:ring-2 hover:ring-primary ${
              status === s ? "ring-2 ring-primary" : ""
            }`}
          >
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs text-muted-foreground">
              {DELIVERY_STATUS_LABELS[s] ?? s}
            </p>
          </Link>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/deliveries"
          className={`rounded-full border px-3 py-1 text-xs transition ${
            !status ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          }`}
        >
          Toutes
        </Link>
        {Object.entries(DELIVERY_STATUS_LABELS).map(([s, label]) => (
          <Link
            key={s}
            href={`/admin/deliveries?status=${s}`}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              status === s ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Table */}
      {deliveries.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Aucune livraison.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Commande</th>
                <th className="px-4 py-3 text-left font-medium">Boutique</th>
                <th className="px-4 py-3 text-left font-medium">Articles</th>
                <th className="px-4 py-3 text-left font-medium">Méthode</th>
                <th className="px-4 py-3 text-left font-medium">Frais</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-left font-medium">Suivi</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {deliveries.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    {d.subOrder.order.number}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d.subOrder.store.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d.subOrder.items.map((i) => i.productName).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{d.method}</td>
                  <td className="px-4 py-3">{formatPrice(d.fee)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${DELIVERY_STATUS_COLORS[d.status]}`}>
                      {DELIVERY_STATUS_LABELS[d.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {d.trackingNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${d.subOrder.orderId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/deliveries?status=${status}&page=${p}`}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm ${
                p === page ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
