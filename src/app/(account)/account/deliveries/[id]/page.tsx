import { getDeliveryBySubOrderId } from "@/server/actions/deliveries";
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS } from "@/lib/order-status";
import { formatPrice } from "@/lib/format";
import { DeliveryTimeline } from "@/components/delivery/delivery-timeline";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";


export const metadata = { title: "Suivi livraison — Teranga Business" };

export default async function DeliveryTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const delivery = await getDeliveryBySubOrderId(id);

  return (
    <div className="space-y-6">
      <Link
        href={`/account/orders/${delivery.subOrder.orderId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la commande
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Suivi de livraison</h1>
        <p className="text-sm text-muted-foreground">
          Commande {delivery.subOrder.order.number} — {delivery.subOrder.store.name}
        </p>
      </div>

      {/* Status card */}
      <div className="rounded-xl border p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${DELIVERY_STATUS_COLORS[delivery.status]}`}>
              {DELIVERY_STATUS_LABELS[delivery.status]}
            </span>
            {delivery.trackingNumber && (
              <p className="mt-2 text-sm text-muted-foreground">
                N° de suivi : <span className="font-mono font-medium">{delivery.trackingNumber}</span>
              </p>
            )}
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Frais de livraison : <span className="font-medium text-foreground">{formatPrice(delivery.fee)}</span></p>
            <p>Méthode : {delivery.method}</p>
            {delivery.shippedAt && (
              <p>Expédiée le {new Date(delivery.shippedAt).toLocaleDateString("fr-SN")}</p>
            )}
            {delivery.deliveredAt && (
              <p>Livrée le {new Date(delivery.deliveredAt).toLocaleDateString("fr-SN")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl border p-4">
        <h2 className="mb-3 font-semibold">Articles</h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {delivery.subOrder.items.map((item, i) => (
            <li key={i}>• {item.productName} ×{item.quantity}</li>
          ))}
        </ul>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border p-4">
        <h2 className="mb-4 font-semibold">Historique</h2>
        <DeliveryTimeline history={delivery.history as never} />
      </div>
    </div>
  );
}
