export const dynamic = "force-dynamic";

import { getAdminRefunds, getRefundStats } from "@/server/actions/refunds";
import { RefundActions } from "@/components/admin/refund-actions";
import { formatPrice } from "@/lib/format";


export const metadata = {
  title: "Remboursements — Admin",
};

function formatAmount(amount: bigint | string) {
  return formatPrice(typeof amount === "string" ? BigInt(amount) : amount);
}

export default async function AdminRefundsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : undefined;

  const [refunds, stats] = await Promise.all([
    getAdminRefunds(status),
    getRefundStats(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Remboursements</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">En attente</p>
          <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Approuvés</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Rejetés</p>
          <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total remboursé</p>
          <p className="text-2xl font-bold">{formatAmount(stats.totalRefunded)}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <a
            key={s}
            href={s ? `/admin/refunds?status=${s}` : "/admin/refunds"}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              (status ?? "") === s
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            {s === "" ? "Tous" : s === "PENDING" ? "En attente" : s === "APPROVED" ? "Approuvés" : "Rejetés"}
          </a>
        ))}
      </div>

      {/* Liste */}
      {refunds.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          Aucun remboursement.
        </div>
      ) : (
        <div className="space-y-3">
          {refunds.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    Commande #{r.subOrder?.order?.id?.slice(0, 8)} — {r.subOrder?.store?.name}
                  </p>
                  <p className="text-muted-foreground">
                    Montant : {formatAmount(r.amount)}
                  </p>
                  <p className="text-muted-foreground">
                    Raison : {r.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("fr-SN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === "PENDING"
                        ? "bg-orange-100 text-orange-700"
                        : r.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : r.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.status === "PENDING" && <RefundActions refundId={r.id} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
