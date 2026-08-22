"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, Menu, X } from "lucide-react";

export function StoreSidebar({
  storeSlug,
  categories,
}: {
  storeSlug: string;
  categories: { id: string; name: string; slug: string; count: number }[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (catSlug: string) =>
    pathname.includes(`/store/${storeSlug}/category/${catSlug}`);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 flex size-12 items-center justify-center rounded-full border bg-card shadow-lg md:hidden"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r bg-card p-4 pt-20 transition-transform
          md:static md:translate-x-0 md:w-56 md:flex-shrink-0 md:pt-0 md:block
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <nav className="space-y-1">
          {/* Accueil boutique */}
          <Link
            href={`/store/${storeSlug}`}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
              pathname === `/store/${storeSlug}`
                ? "bg-primary/10 font-medium text-primary"
                : "hover:bg-accent"
            }`}
          >
            <LayoutGrid className="size-4" />
            Tous les produits
          </Link>

          {/* Catégories */}
          {categories.length > 0 && (
            <>
              <p className="pt-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Catégories
              </p>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/store/${storeSlug}/category/${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                    isActive(cat.slug)
                      ? "bg-primary/10 font-medium text-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {cat.count}
                  </span>
                </Link>
              ))}
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
