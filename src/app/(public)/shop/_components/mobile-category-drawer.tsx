"use client";

import Link from "next/link";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string; slug: string; _count: { products: number } };
type Store = { id: string; name: string; slug: string };

export function MobileCategoryDrawer({
  categories,
  stores,
  currentCategoryId,
  currentStoreId,
}: {
  categories: Category[];
  stores: Store[];
  currentCategoryId?: string;
  currentStoreId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <SlidersHorizontal className="h-4 w-4" />
        Filtres
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative ml-auto flex h-full w-72 flex-col bg-background p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Filtres</h2>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Catégories</h3>
              <nav className="mb-6 space-y-1">
                <Link
                  href="/shop"
                  className={`block rounded-md px-3 py-2 text-sm transition hover:bg-accent ${
                    !currentCategoryId ? "bg-accent font-medium" : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Toutes les catégories
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop?categoryId=${cat.id}`}
                    className={`block rounded-md px-3 py-2 text-sm transition hover:bg-accent ${
                      currentCategoryId === cat.id ? "bg-accent font-medium" : ""
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {cat.name}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({cat._count.products})
                    </span>
                  </Link>
                ))}
              </nav>

              {stores.length > 0 && (
                <>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Boutiques</h3>
                  <nav className="space-y-1">
                    <Link
                      href="/shop"
                      className={`block rounded-md px-3 py-2 text-sm transition hover:bg-accent ${
                        !currentStoreId ? "bg-accent font-medium" : ""
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      Toutes les boutiques
                    </Link>
                    {stores.map((s) => (
                      <Link
                        key={s.id}
                        href={`/shop?storeId=${s.id}`}
                        className={`block rounded-md px-3 py-2 text-sm transition hover:bg-accent ${
                          currentStoreId === s.id ? "bg-accent font-medium" : ""
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        {s.name}
                      </Link>
                    ))}
                  </nav>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
