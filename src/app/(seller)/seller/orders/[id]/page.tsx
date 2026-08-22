import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubOrderDetail } from "@/server/actions/orders";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { SUBORDER_STATUS_LABELS, SUBORDER_STATUS_COLORS, DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/order-status";
import { SubOrderActions } from "./_components/suborder-actions";

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
  return { title: `Sous-commande ${id.slice(0, 8)}... — Vendeur — Teranga Business` };
}

export default async function SellerOrderDetailPage({ params }: Props) {
  const { id } = await params;

  let subOrder;
  try {
    subOrder = await getSubOrderDetail(id);
  } catch {
    notFound();
  }

  const shippingAddr = subOrder.shippingAddress as ShippingAddress | null;

  return (
    <div className="space-y-6">
      <Link
        href="/seller/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux commandes
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Commande <span className="font-mono">{subOrder.order.number}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(subOrder.createdAt).toLocaleDateString("fr-SN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {subOrder.order.user && (
            <p className="text-sm text-muted-foreground">
              Client : {subOrder.order.user.name} ({subOrder.order.user.email})
            </p>
          )}
        </div>
        <Badge className={SUBORDER_STATUS_COLORS[subOrder.status] ?? ""}>
          {SUBORDER_STATUS_LABELS[subOrder.status] ?? subOrder.status}
        </Badge>
      </div>

      <SubOrderActions subOrderId={subOrder.id} currentStatus={subOrder.status} />

      <div className="rounded-xl border p-4 space-y-3">
        <h3 className="font-bold">Articles</h3>
        {subOrder.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{item.productName}</p>
              <p className="text-muted-foreground">
                {formatPrice(item.unitPrice)} × {item.quantity}
              </p>
            </div>
            <p className="font-bold">{formatPrice(item.lineTotal)}</p>
          </div>
        ))}
        <div className="border-t pt-2 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Sous-total</span>
            <span>{formatPrice(subOrder.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Livraison</span>
            <span>{formatPrice(subOrder.deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-1">
            <span>Total</span>
            <span>{formatPrice(subOrder.payableAmount)}</span>
          </div>
        </div>
      </div>

      {subOrder.delivery && (
        <div className="rounded-xl border p-4 space-y-2">
          <h3 className="font-bold">Livraison</h3>
          <p className="text-sm">
            Méthode : {subOrder.delivery.method === "STANDARD" ? "Standard" : subOrder.delivery.method === "EXPRESS" ? "Express" : "Retrait"}
          </p>
          <p className="text-sm">
            Statut : <Badge className={DELIVERY_STATUS_COLORS[subOrder.delivery.status] ?? ""}>
              {DELIVERY_STATUS_LABELS[subOrder.delivery.status] ?? subOrder.delivery.status}
            </Badge>
          </p>
          {subOrder.delivery.trackingNumber && (
            <p className="text-sm">Tracking : {subOrder.delivery.trackingNumber}</p>
          )}
        </div>
      )}

      {shippingAddr && (
        <div className="rounded-xl border p-4">
          <h3 className="font-bold mb-2">Adresse de livraison</h3>
          <p className="text-sm text-muted-foreground">{shippingAddr.fullName} — {shippingAddr.phone}</p>
          <p className="text-sm text-muted-foreground">{shippingAddr.addressLine}, {shippingAddr.city}, {shippingAddr.region}</p>
        </div>
      )}

      {subOrder.paymentSplit && (
        <div className="rounded-xl border p-4">
          <h3 className="font-bold mb-2">Paiement</h3>
          <p className="text-sm text-muted-foreground">
            Méthode : {PAYMENT_METHOD_LABELS[subOrder.paymentSplit.payment.method] ?? subOrder.paymentSplit.payment.method}
            {" — "}Statut : {PAYMENT_STATUS_LABELS[subOrder.paymentSplit.status] ?? subOrder.paymentSplit.status}
          </p>
        </div>
      )}
    </div>
  );
}
