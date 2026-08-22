import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";

type CartItem = {
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

export function OrderSummary({
  items,
  onConfirm,
  pending,
}: {
  items: CartItem[];
  onConfirm?: () => void;
  pending?: boolean;
}) {
  const byStore = new Map<string, { storeId: string; storeName: string; items: CartItem[] }>();
  for (const item of items) {
    const storeId = item.product.store.id;
    const storeName = item.product.store.name;
    const existing = byStore.get(storeId);
    if (existing) {
      existing.items.push(item);
    } else {
      byStore.set(storeId, { storeId, storeName, items: [item] });
    }
  }

  const subtotal = items.reduce((sum, item) => {
    const price =
      item.product.discountPrice && Number(item.product.discountPrice) > 0
        ? Number(item.product.discountPrice)
        : Number(item.product.price);
    return sum + price * item.quantity;
  }, 0);

  const deliveryFee = 500;
  const total = subtotal + deliveryFee;
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="rounded-xl border p-4 space-y-4">
      <h3 className="font-bold">Récapitulatif</h3>

      <div className="space-y-3">
        {Array.from(byStore.values()).map((group) => (
          <div key={group.storeId}>
            <p className="text-xs font-medium text-muted-foreground">
              {group.storeName}
            </p>
            {group.items.map((item) => {
              const price =
                item.product.discountPrice && Number(item.product.discountPrice) > 0
                  ? Number(item.product.discountPrice)
                  : Number(item.product.price);
              return (
                <div
                  key={item.id}
                  className="flex justify-between text-sm py-1"
                >
                  <span className="truncate pr-2">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="whitespace-nowrap font-medium">
                    {formatPrice(price * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t pt-3">
        <div className="flex justify-between text-sm">
          <span>Sous-total ({totalItems} article{totalItems > 1 ? "s" : ""})</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Livraison</span>
          <span>{formatPrice(deliveryFee)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 font-bold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {onConfirm ? (
        <Button
          size="lg"
          className="w-full"
          onClick={onConfirm}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <ShoppingBag className="mr-2 h-5 w-5" />
          )}
          {pending ? "Commande en cours..." : "Confirmer la commande"}
        </Button>
      ) : (
        <Button asChild size="lg" className="w-full">
          <Link href="/checkout">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Passer la commande
          </Link>
        </Button>
      )}
    </div>
  );
}
