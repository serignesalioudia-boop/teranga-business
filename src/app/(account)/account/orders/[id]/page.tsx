import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/server/actions/checkout";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, SUBORDER_STATUS_LABELS, SUBORDER_STATUS_COLORS, DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { RefundRequestForm } from "@/components/order/refund-request-form";

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
  return { title: `Commande ${id.slice(0, 8)}... — Teranga Business` };
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  let order;
  try {
    order = await getOrderById(id);
  } catch {
    notFound();
  }

  const shippingAddr = order.shippingAddress as ShippingAddress | null;

  const user = await getCurrentUser();
  const itemIds = order.subOrders.flatMap((s) => s.items.map((i) => i.id));
  const reviews = user
    ? await prisma.review.findMany({
        where: { userId: user.id, orderItemId: { in: itemIds } },
        select: { orderItemId: true, rating: true },
      })
    : [];
  const reviewedMap = new Map(reviews.map((r) => [r.orderItemId, r.rating]));

  return (
    <div className="space-y-6">
      <Link
        href="/account/orders"
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
        </div>
        <Badge className={ORDER_STATUS_COLORS[order.status] ?? ""}>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </Badge>
      </div>

      {(() => {
        const hasDigital = order.subOrders.some((so) =>
          so.items.some(
            (i) => (i.product as { isDigital?: boolean })?.isDigital,
          ),
        );
        if (!hasDigital) return null;
        return (
          <Link
            href={`/account/orders/${order.id}/digital`}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
          >
            <Download className="h-4 w-4" />
            Télécharger mes produits digitaux
          </Link>
        );
      })()}

      {(() => {
        const orderWhatsappLink = order.subOrders
          .filter((sub) => sub.store.whatsapp)
          .map((sub) => {
            const digits = sub.store.whatsapp!.replace(/\D/g, "");
            const phone = digits.startsWith("221") ? digits : `221${digits}`;
            const msg = encodeURIComponent(`Bonjour! Je vous contacte au sujet de la commande ${order.number}.`);
            return { store: sub.store, href: `https://wa.me/${phone}?text=${msg}` };
          });
        if (orderWhatsappLink.length === 0) return null;
        return (
          <div className="flex flex-wrap gap-2">
            {orderWhatsappLink.map(({ store, href }) => (
              <a
                key={store.slug}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:scale-105"
                style={{ backgroundColor: "#25D366" }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Contacter {store.name}
              </a>
            ))}
          </div>
        );
      })()}

      {order.subOrders.map((sub) => (
        <div key={sub.id} className="rounded-xl border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Link
              href={`/store/${sub.store.slug}`}
              className="font-bold hover:text-primary"
            >
              {sub.store.name}
            </Link>
            <Badge className={SUBORDER_STATUS_COLORS[sub.status] ?? ""}>
              {SUBORDER_STATUS_LABELS[sub.status] ?? sub.status}
            </Badge>
          </div>

          {sub.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-3">
                {item.productImage && (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">
                    {item.productName}
                    {(item.product as { isDigital?: boolean })?.isDigital && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Digital
                      </Badge>
                    )}
                  </p>
                  <p className="text-muted-foreground">
                    {formatPrice(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="font-bold">{formatPrice(item.lineTotal)}</p>
                {item.productId && reviewedMap.has(item.id) && (
                  <p className="text-xs text-muted-foreground">
                    ★ Avis donné ({reviewedMap.get(item.id)}/5)
                  </p>
                )}
              </div>
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
                {sub.delivery.method === "STANDARD"
                  ? "Standard"
                  : sub.delivery.method === "EXPRESS"
                    ? "Express"
                    : "Retrait"}{" "}
                —{" "}
                <Badge className={DELIVERY_STATUS_COLORS[sub.delivery.status] ?? ""}>
                  {DELIVERY_STATUS_LABELS[sub.delivery.status] ?? sub.delivery.status}
                </Badge>
              </p>
              {sub.delivery.trackingNumber && (
                <p>
                  <strong>Tracking :</strong> {sub.delivery.trackingNumber}
                </p>
              )}
              <Link
                href={`/account/deliveries/${sub.id}`}
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                Suivre la livraison →
              </Link>
            </div>
          )}

          {sub.status === "DELIVERED" && sub.items.some((i) => i.productId && !reviewedMap.has(i.id)) && (
            <div className="rounded-lg border border-dashed p-3 text-sm">
              <p className="mb-2 font-medium">Articles à évaluer :</p>
              <div className="space-y-1">
                {sub.items
                  .filter((i) => i.productId && !reviewedMap.has(i.id))
                  .map((i) => (
                    <Link
                      key={i.id}
                      href={`/product/${i.product?.slug ?? ""}`}
                      className="block text-primary hover:underline"
                    >
                      ★ Laisser un avis pour « {i.productName} »
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {["PENDING", "CONFIRMED", "PROCESSING"].includes(sub.status) && (
            <div className="border-t pt-3">
              <RefundRequestForm subOrderId={sub.id} />
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
          <p className="text-sm text-muted-foreground">
            {shippingAddr.fullName} — {shippingAddr.phone}
          </p>
          <p className="text-sm text-muted-foreground">
            {shippingAddr.addressLine}, {shippingAddr.city}, {shippingAddr.region}
          </p>
        </div>
      )}
    </div>
  );
}
