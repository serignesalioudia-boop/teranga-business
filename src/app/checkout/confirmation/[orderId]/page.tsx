import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrderById } from "@/server/actions/checkout";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ArrowRight } from "lucide-react";

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <h1 className="mt-4 text-2xl font-bold">Commande confirmée !</h1>
      <p className="mt-2 text-muted-foreground">
        Merci pour votre commande. Votre numéro de commande est :
      </p>
      <p className="mt-1 text-lg font-bold font-mono">{order.number}</p>

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
            <strong>Paiement :</strong>{" "}
            {order.payment?.method === "WAVE"
              ? "Wave"
              : order.payment?.method === "ORANGE_MONEY"
                ? "Orange Money"
                : "Paiement à la livraison"}
          </p>
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
