"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { addToCart } from "@/server/actions/cart";

export function AddToCartButton({
  productId,
}: {
  productId: string;
  storeSlug?: string;
}) {
  const [state, setState] = useState<"idle" | "adding" | "done" | "error">("idle");

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (state === "adding") return;

    setState("adding");
    try {
      await addToCart(productId, 1);
      setState("done");
      window.dispatchEvent(new Event("cart-updated"));
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 1500);
    }
  }

  if (state === "done") {
    return (
      <div className="absolute bottom-3 right-3 z-10 flex size-10 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
        <Check className="size-5" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="absolute bottom-3 right-3 z-10 flex size-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg">
        <span className="text-xs">!</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={state === "adding"}
      className="absolute bottom-3 right-3 z-10 flex size-10 items-center justify-center rounded-full bg-[#c8922d] text-white shadow-lg transition hover:bg-[#7a4712] active:scale-95 disabled:opacity-60"
      title="Ajouter au panier"
    >
      <ShoppingCart className="size-5" />
    </button>
  );
}
