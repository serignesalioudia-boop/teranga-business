export const dynamic = "force-dynamic";

import Link from "next/link";
import { getUserOrders } from "@/server/actions/checkout";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/order-status";

type OrderWithSubOrders = Awaited<ReturnType<typeof getUserOrders>>[number];


export const metadata = {
  title: "Mes commandes — Teranga Business",
};

export default async function OrdersPage() {
  const orders = await getUserOrders();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes commandes</h1>

      {orders.length === 0 ? (
        <p className="text-muted-foreground">Aucune commande pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order: OrderWithSubOrders) => {
            const storeNames = order.subOrders
              .map((so) => (so as { store: { name: string } }).store.name)
              .join(", ");
            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between rounded-xl border p-4 transition hover:border-primary/50 hover:bg-accent/50"
              >
                <div className="space-y-1">
                  <p className="font-mono text-sm font-bold">{order.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {storeNames} — {order.subOrders.length} article
                    {order.subOrders.length > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("fr-SN")}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    className={ORDER_STATUS_COLORS[order.status] ?? ""}
                  >
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                  <p className="mt-1 text-sm font-bold">
                    {formatPrice(Number(order.grandTotal))}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
