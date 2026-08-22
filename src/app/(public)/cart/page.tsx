import Link from "next/link";
import { getCart } from "@/server/actions/cart";
import { CartItemRow, CartSummary } from "@/components/cart/cart-page";
import type { CartItem } from "@/components/cart/cart-page";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { serialize } from "@/lib/serialize";


export const metadata = {
  title: "Panier — Teranga Business",
};

export default async function CartPage() {
  const cart = await getCart();
  const rawItems = cart?.items ?? [];
  const items = serialize(rawItems) as unknown as CartItem[];

  const storeGroups = items.reduce<Record<string, CartItem[]>>((acc, item) => {
    const storeId = item.product.store.id;
    if (!acc[storeId]) acc[storeId] = [];
    acc[storeId].push(item);
    return acc;
  }, {});

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-24 text-center">
          <div className="rounded-full bg-muted p-6">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Votre panier est vide</h1>
            <p className="mt-2 text-muted-foreground">
              Parcourez nos produits et ajoutez ce qui vous plaît.
            </p>
          </div>
          <Button asChild size="lg" className="mt-2 gap-2 rounded-xl">
            <Link href="/shop">
              Découvrir la boutique
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              Mon panier
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({totalItems} article{totalItems > 1 ? "s" : ""})
              </span>
            </h1>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {Object.entries(storeGroups).map(([storeId, storeItems]) => (
                <div key={storeId} className="rounded-2xl border bg-card p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-2 border-b pb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                      <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <Link
                      href={`/store/${storeItems[0].product.store.slug}`}
                      className="text-sm font-semibold hover:text-primary transition"
                    >
                      {storeItems[0].product.store.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      ({storeItems.length} article{storeItems.length > 1 ? "s" : ""})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {storeItems.map((item) => (
                      <CartItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <CartSummary items={items} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
