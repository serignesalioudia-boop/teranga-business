export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrderById } from "@/server/actions/checkout";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, Package, ArrowRight, CreditCard } from "lucide-react";

type Props = { params: Promise<{ orderId: string }> };

type ShippingAddress = {
  fullName: string;
  addressLine: string;
  city: string;
};

export async function generateMetadata({ params }: Props) {
  const { orderId } = await params;
  return { title: `Commande ${orderId.slice(0, 8)}... — Teranga Business` };
}

export default async function ConfirmationPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { orderId } = await params;

  let order;
  try {
    order = await getOrderById(orderId);
  } catch {
    redirect("/");
  }

  const shippingAddr = order.shippingAddress as ShippingAddress | null;
  const paymentStatus = order.payment?.status ?? "PENDING";
  const paymentMethod = order.payment?.method ?? "COD";
  const isMobilePayment = paymentMethod === "WAVE" || paymentMethod === "ORANGE_MONEY";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-center">
      {/* Payment status indicator */}
      {isMobilePayment && paymentStatus === "PENDING" ? (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-10 w-10 text-amber-500 animate-pulse" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Paiement en cours...</h1>
          <p className="mt-2 text-muted-foreground">
            Veuillez patienter pendant que nous vérifions votre paiement {paymentMethod === "WAVE" ? "Wave" : "Orange Money"}.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Si vous avez été redirigé ici, votre paiement est en cours de traitement. La page se mettra à jour automatiquement.
          </p>
          {/* Client-side polling script */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  var orderId = "${order.id}";
                  var attempts = 0;
                  var maxAttempts = 30;
                  function checkPayment() {
                    if (attempts >= maxAttempts) return;
                    attempts++;
                    fetch("/api/payments/status?orderId=" + orderId)
                      .then(function(r) { return r.json(); })
                      .then(function(data) {
                        if (data.status === "SUCCESS") {
                          window.location.reload();
                        } else if (data.status === "FAILED") {
                          window.location.reload();
                        } else {
                          setTimeout(checkPayment, 3000);
                        }
                      })
                      .catch(function() {
                        setTimeout(checkPayment, 5000);
                      });
                  }
                  setTimeout(checkPayment, 3000);
                })();
              `,
            }}
          />
        </>
      ) : paymentStatus === "FAILED" ? (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-red-600">Paiement échoué</h1>
          <p className="mt-2 text-muted-foreground">
            Le paiement n&apos;a pas pu être traité. Veuillez réessayer ou choisir un autre mode de paiement.
          </p>
        </>
      ) : (
        <>
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-2xl font-bold">Commande confirmée !</h1>
          <p className="mt-2 text-muted-foreground">
            Merci pour votre commande. Votre numéro de commande est :
          </p>
        </>
      )}

      <p className="mt-1 text-lg font-bold font-mono">{order.number}</p>

      {/* Payment status badge */}
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium">
        <CreditCard className="h-4 w-4" />
        <span>
          {paymentMethod === "WAVE" ? "Wave" : paymentMethod === "ORANGE_MONEY" ? "Orange Money" : "Paiement à la livraison"}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            paymentStatus === "SUCCESS"
              ? "bg-green-100 text-green-700"
              : paymentStatus === "FAILED"
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
          }`}
        >
          {paymentStatus === "SUCCESS"
            ? "Payé"
            : paymentStatus === "FAILED"
              ? "Échoué"
              : "En attente"}
        </span>
      </div>

      {/* Résumé */}
      <div className="mt-8 rounded-xl border p-6 text-left space-y-4">
        <h2 className="font-bold">Détails de la commande</h2>

        {order.subOrders.map((sub) => (
          <div key={sub.id} className="rounded-lg border p-3">
            <p className="text-sm font-medium">{sub.store.name}</p>
            {sub.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm py-1">
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span>{formatPrice(Number(item.lineTotal))}</span>
              </div>
            ))}
            <div className="flex justify-between border-t mt-2 pt-2 text-sm font-medium">
              <span>Sous-total</span>
              <span>{formatPrice(Number(sub.subtotal))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Livraison</span>
              <span>{formatPrice(Number(sub.deliveryFee))}</span>
            </div>
          </div>
        ))}

        <div className="border-t pt-3 flex justify-between font-bold text-lg">
          <span>Total payé</span>
          <span>{formatPrice(Number(order.grandTotal))}</span>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Adresse :</strong>{" "}
            {shippingAddr
              ? `${shippingAddr.fullName}, ${shippingAddr.addressLine}, ${shippingAddr.city}`
              : "—"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href={`/account/orders/${order.id}`}>
            <Package className="mr-2 h-4 w-4" />
            Voir ma commande
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">
            Continuer les achats
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
