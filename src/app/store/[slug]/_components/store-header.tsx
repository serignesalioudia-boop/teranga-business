"use client";

import Link from "next/link";
import { ShoppingCart, MessageCircle } from "lucide-react";

export function StoreHeader({
  storeName,
  storeSlug,
  logoUrl,
  whatsapp,
}: {
  storeName: string;
  storeSlug: string;
  logoUrl: string | null;
  whatsapp: string | null;
}) {
  return (
    <div className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo + Nom */}
        <Link
          href={`/store/${storeSlug}`}
          className="flex items-center gap-3 hover:opacity-80"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={storeName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg">
              🏪
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold leading-tight">{storeName}</h2>
            <p className="text-xs text-muted-foreground">Boutique sur Teranga</p>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-green-600 px-3 py-1.5 text-xs text-green-600 transition hover:bg-green-50 dark:hover:bg-green-950"
            >
              <MessageCircle className="size-3.5" />
              WhatsApp
            </a>
          )}
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition hover:bg-accent"
          >
            <ShoppingCart className="size-3.5" />
            Panier
          </Link>
        </div>
      </div>
    </div>
  );
}
