"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export function MiniCart({ count }: { count: number }) {
  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition hover:bg-accent"
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">Panier</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
