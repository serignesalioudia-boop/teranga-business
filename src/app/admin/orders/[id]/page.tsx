import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/server/actions/checkout";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, SUBORDER_STATUS_LABELS, SUBORDER_STATUS_COLORS, DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/order-status";
import { StatusActions } from "./_components/status-actions";

type Props = { params: Promise<{ id: string }> };

type ShippingAddress = {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  region: string;
};


export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Commande ${id.slice(0, 8)}... — Admin — Teranga Business` };
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;

  let order;
  try {
    order = await getOrderById(id);
  } catch {
    notFound();
  }

  const shippingAddr = order.shippingAddress as ShippingAddress | null;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux commandes
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Commande <span className="font-mono">{order.number}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("fr-SN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            Client : {order.user?.name ?? "Invité"} ({order.user?.email ?? order.guestEmail ?? "—"})
          </p>
        </div>
        <Badge className={ORDER_STATUS_COLORS[order.status] ?? ""}>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </Badge>
      </div>

      <StatusActions orderId={order.id} currentStatus={order.status} />

      {order.subOrders.map((sub) => (
        <div key={sub.id} className="rounded-xl border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Link href={`/store/${sub.store.slug}`} className="font-bold hover:text-primary">
              {sub.store.name}
            </Link>
            <Badge className={SUBORDER_STATUS_COLORS[sub.status] ?? ""}>
              {SUBORDER_STATUS_LABELS[sub.status] ?? sub.status}
            </Badge>
          </div>

          {sub.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                {item.productImage && (
                  <img src={item.productImage} alt={item.productName} className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
                )}
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-muted-foreground">
                    {formatPrice(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
              </div>
              <p className="font-bold">{formatPrice(item.lineTotal)}</p>
            </div>
          ))}

          <div className="border-t pt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{formatPrice(sub.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Livraison</span>
              <span>{formatPrice(sub.deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-1">
              <span>Total vendeur</span>
              <span>{formatPrice(sub.payableAmount)}</span>
            </div>
          </div>

          {sub.delivery && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p>
                <strong>Livraison :</strong>{" "}
                {sub.delivery.method === "STANDARD" ? "Standard" : sub.delivery.method === "EXPRESS" ? "Express" : "Retrait"}{" "}
                — <Badge className={DELIVERY_STATUS_COLORS[sub.delivery.status] ?? ""}>
                  {DELIVERY_STATUS_LABELS[sub.delivery.status] ?? sub.delivery.status}
                </Badge>
              </p>
              {sub.delivery.trackingNumber && (
                <p><strong>Tracking :</strong> {sub.delivery.trackingNumber}</p>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="rounded-xl border p-4 space-y-2">
        <h3 className="font-bold">Paiement</h3>
        <div className="flex justify-between text-sm">
          <span>Sous-total</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Livraison</span>
          <span>{formatPrice(order.deliveryTotal)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 font-bold">
          <span>Total</span>
          <span>{formatPrice(order.grandTotal)}</span>
        </div>
        {order.payment && (
          <p className="text-sm text-muted-foreground">
            Méthode : {PAYMENT_METHOD_LABELS[order.payment.method] ?? order.payment.method}{" "}
            — Statut : {PAYMENT_STATUS_LABELS[order.payment.status] ?? order.payment.status}
          </p>
        )}
      </div>

      {order.statusHist && order.statusHist.length > 0 && (
        <div className="rounded-xl border p-4 space-y-2">
          <h3 className="font-bold">Historique des statuts</h3>
          <div className="space-y-2">
            {order.statusHist.map((h) => (
              <div key={h.id} className="flex items-center justify-between text-sm">
                <div>
                  <Badge className={ORDER_STATUS_COLORS[h.status] ?? ""}>
                    {ORDER_STATUS_LABELS[h.status] ?? h.status}
                  </Badge>
                  {h.note && <span className="ml-2 text-muted-foreground">{h.note}</span>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(h.createdAt).toLocaleDateString("fr-SN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {shippingAddr && (
        <div className="rounded-xl border p-4">
          <h3 className="font-bold mb-2">Adresse de livraison</h3>
          <p className="text-sm text-muted-foreground">{shippingAddr.fullName} — {shippingAddr.phone}</p>
          <p className="text-sm text-muted-foreground">{shippingAddr.addressLine}, {shippingAddr.city}, {shippingAddr.region}</p>
        </div>
      )}
    </div>
  );
}
