"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/order-status";
import { downloadCsv } from "@/lib/csv";

type OrderRow = {
  id: string;
  number: string;
  status: string;
  grandTotal: number;
  createdAt: string;
  user: { name: string; email: string } | null;
  guestEmail: string | null;
  subOrders: { store: { name: string } }[];
  payment: { method: string; status: string } | null;
};

type Props = {
  data: {
    orders: OrderRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  currentStatus?: string;
  currentSearch?: string;
};

export function OrderTable({ data, currentStatus, currentSearch }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch ?? "");
  const [filterStatus, setFilterStatus] = useState(currentStatus ?? "");

  function applyFilters(status: string, search: string, page?: number) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    if (page && page > 1) params.set("page", String(page));
    router.push(`/admin/orders?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Rechercher par numéro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyFilters(filterStatus, search);
          }}
          className="w-64"
        />
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            applyFilters(e.target.value, search);
          }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={() => applyFilters(filterStatus, search)}>
          Rechercher
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const rows = data.orders.map((o) => ({
              Numéro: o.number,
              Client: o.user?.name ?? "Invité",
              Email: o.user?.email ?? o.guestEmail,
              Vendeurs: o.subOrders.map((so) => so.store.name).join(", "),
              Statut: ORDER_STATUS_LABELS[o.status] ?? o.status,
              Total: Number(o.grandTotal),
              Date: new Date(o.createdAt).toLocaleDateString("fr-SN"),
            }));
            downloadCsv(rows, "commandes.csv");
          }}
        >
          Export CSV
        </Button>
      </div>

      <div className="rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">Numéro</th>
                <th className="p-3 font-medium">Client</th>
                <th className="p-3 font-medium">Vendeur(s)</th>
                <th className="p-3 font-medium">Statut</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {data.orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    Aucune commande trouvée.
                  </td>
                </tr>
              ) : (
                data.orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs font-bold">{order.number}</td>
                    <td className="p-3">
                      <p className="font-medium">{order.user?.name ?? "Invité"}</p>
                      <p className="text-xs text-muted-foreground">{order.user?.email ?? order.guestEmail}</p>
                    </td>
                    <td className="p-3 text-xs">
                      {order.subOrders.map((so) => so.store.name).join(", ")}
                    </td>
                    <td className="p-3">
                      <Badge className={ORDER_STATUS_COLORS[order.status] ?? ""}>
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                    </td>
                    <td className="p-3 font-bold">{formatPrice(order.grandTotal)}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("fr-SN")}
                    </td>
                    <td className="p-3">
                      <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline text-xs">
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === data.page ? "default" : "outline"}
              size="sm"
              onClick={() => applyFilters(filterStatus, search, p)}
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
