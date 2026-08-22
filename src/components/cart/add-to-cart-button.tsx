"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingCart, Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/server/actions/cart";

export function AddToCartButton({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ text: string; isError: boolean } | null>(null);

  async function handleAdd() {
    setPending(true);
    setMsg(null);
    try {
      await addToCart(productId, qty);
      setMsg({ text: `${qty} article${qty > 1 ? "s" : ""} ajouté${qty > 1 ? "s" : ""} au panier`, isError: false });
      router.refresh();
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Une erreur est survenue. Réessayez.";
      setMsg({ text: message, isError: true });
      setTimeout(() => setMsg(null), 5000);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center text-muted-foreground transition hover:bg-accent"
            disabled={pending}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="flex h-10 w-12 items-center justify-center text-sm font-medium">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(stock, q + 1))}
            className="flex h-10 w-10 items-center justify-center text-muted-foreground transition hover:bg-accent"
            disabled={pending}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <Button
          size="lg"
          onClick={handleAdd}
          disabled={pending || stock === 0}
          className="flex-1"
        >
          {pending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ShoppingCart className="h-5 w-5" />
          )}
          {pending ? "Ajout..." : "Ajouter au panier"}
        </Button>
      </div>

      {msg && (
        <p
          className={`text-sm ${msg.isError ? "text-destructive" : "text-green-600"}`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
