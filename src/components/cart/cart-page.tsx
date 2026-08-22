"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, Store, ArrowRight, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateCartItemQty, removeFromCart } from "@/server/actions/cart";
import { formatPrice } from "@/lib/format";

export type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    discountPrice: string | null;
    stock: number;
    isDigital: boolean;
    media: { url: string }[];
    store: { id: string; name: string; slug: string };
  };
};

function CartItemCard({ item }: { item: CartItem }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const p = item.product;
  const unitPrice = BigInt(p.discountPrice && BigInt(p.discountPrice) > 0 ? p.discountPrice : p.price);
  const lineTotal = unitPrice * BigInt(item.quantity);
  const hasDiscount = p.discountPrice && BigInt(p.discountPrice) > 0;

  async function handleQty(newQty: number) {
    setPending(true);
    try {
      await updateCartItemQty(item.id, newQty);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  async function handleRemove() {
    setPending(true);
    try {
      await removeFromCart(item.id);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex gap-4 rounded-2xl border bg-card p-4 transition hover:shadow-md sm:gap-5 sm:p-5">
      <Link href={`/product/${p.slug}`} className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-28">
        {p.media[0] ? (
          <img src={p.media[0].url} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-muted-foreground">
            <PackageX className="h-8 w-8" />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={`/product/${p.slug}`} className="line-clamp-2 font-semibold hover:text-primary transition">
                {p.name}
              </Link>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Store className="h-3 w-3" />
                {p.store.name}
              </p>
            </div>
            <p className="text-right font-bold whitespace-nowrap">{formatPrice(lineTotal)}</p>
          </div>

          {hasDiscount && (
            <p className="mt-1 text-xs">
              <span className="text-muted-foreground line-through">{formatPrice(BigInt(p.price))}</span>
              <span className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                -{Math.round(((Number(BigInt(p.price)) - Number(unitPrice)) / Number(BigInt(p.price))) * 100)}%
              </span>
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border">
              <button
                type="button"
                onClick={() => handleQty(item.quantity - 1)}
                disabled={pending || item.quantity <= 1}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground transition hover:bg-accent rounded-l-xl disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="flex h-9 w-10 items-center justify-center text-sm font-medium tabular-nums">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => handleQty(item.quantity + 1)}
                disabled={pending || item.quantity >= p.stock}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground transition hover:bg-accent rounded-r-xl disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatPrice(unitPrice)} / unité
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={pending}
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CartSummary({ items }: { items: CartItem[] }) {
  const subtotal = items.reduce((s, i) => {
    const price = BigInt(i.product.discountPrice && BigInt(i.product.discountPrice) > 0 ? i.product.discountPrice : i.product.price);
    return s + price * BigInt(i.quantity);
  }, BigInt(0));

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="sticky top-20 rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">Résumé</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Articles ({totalItems})</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Livraison</span>
          <span className="text-xs text-muted-foreground italic">Calculée à l&apos;étape suivante</span>
        </div>
      </div>

      <div className="my-4 border-t" />

      <div className="flex items-center justify-between text-base font-bold">
        <span>Total</span>
        <span className="text-lg">{formatPrice(subtotal)}</span>
      </div>

      <Button asChild size="lg" className="mt-5 w-full gap-2 rounded-xl text-base font-semibold">
        <Link href="/checkout">
          <ShoppingBag className="h-5 w-5" />
          Passer la commande
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>

      <Button asChild variant="ghost" className="mt-2 w-full">
        <Link href="/shop">Continuer vos achats</Link>
      </Button>
    </div>
  );
}

export function CartItemRow({ item }: { item: CartItem }) {
  return <CartItemCard item={item} />;
}
