"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddressSelect } from "@/components/checkout/address-select";
import { AddressForm } from "@/components/checkout/address-form";
import { PaymentSelect } from "@/components/checkout/payment-select";
import { OrderSummary } from "@/components/checkout/order-summary";
import { placeOrder } from "@/server/actions/checkout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";

type CartItemSerialized = {
  id: string;
  quantity: number;
  product: {
    name: string;
    slug: string;
    price: string;
    discountPrice: string | null;
    store: { id: string; name: string };
  };
};

type AddressSerialized = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  region: string;
  city: string;
  addressLine: string;
  isDefault: boolean;
};

export function CheckoutClient({
  cartItems,
  addresses,
  storeQrMap,
}: {
  cartItems: CartItemSerialized[];
  addresses: AddressSerialized[];
  storeQrMap: Record<string, string | null>;
}) {
  const router = useRouter();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null,
  );
  const [paymentMethod, setPaymentMethod] = useState("WAVE");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedAddressId) {
      setError("Veuillez sélectionner une adresse de livraison.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const result = await placeOrder({
        addressId: selectedAddressId,
        paymentMethod: paymentMethod as "WAVE" | "ORANGE_MONEY" | "COD",
      });
      router.push(`/checkout/confirmation/${result.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la commande.");
      setPending(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* Formulaire — 3 colonnes */}
      <div className="space-y-8 lg:col-span-3">
        {/* Retour panier */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au panier
        </Link>

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Adresse */}
        <section className="space-y-4">
          {showNewAddress ? (
            <AddressForm
              onDone={() => setShowNewAddress(false)}
            />
          ) : (
            <AddressSelect
              addresses={addresses}
              selectedId={selectedAddressId}
              onSelect={setSelectedAddressId}
              onAddNew={() => setShowNewAddress(true)}
            />
          )}
        </section>

        {/* Paiement */}
        <section>
          <PaymentSelect
            selected={paymentMethod}
            onSelect={setPaymentMethod}
            qrCodeUrl={storeQrMap[cartItems[0]?.product.store.id] ?? null}
          />
        </section>

        {/* Bouton mobile */}
        <div className="lg:hidden">
          <Button
            size="lg"
            className="w-full"
            onClick={handleConfirm}
            disabled={pending || !selectedAddressId}
          >
            {pending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <ShoppingBag className="mr-2 h-5 w-5" />
            )}
            {pending ? "Commande en cours..." : "Confirmer la commande"}
          </Button>
        </div>
      </div>

      {/* Résumé — 2 colonnes (sticky) */}
      <div className="lg:col-span-2">
        <div className="sticky top-20">
          <OrderSummary items={cartItems} onConfirm={handleConfirm} pending={pending} />
        </div>
      </div>
    </div>
  );
}
