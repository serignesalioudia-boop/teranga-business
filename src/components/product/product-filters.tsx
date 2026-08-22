"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = { id: string; name: string; slug: string };
type Store = { id: string; name: string; slug: string };

export function ProductFilters({
  categories,
  stores,
  current,
  basePath = "/products",
}: {
  categories: Category[];
  stores?: Store[];
  current: {
    search?: string;
    categoryId?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    minRating?: string;
    storeId?: string;
  };
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function apply(changes: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    sp.delete("page");
    startTransition(() => {
      router.push(`${basePath}?${sp.toString()}`);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 sm:min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Recherche
          </label>
          <Input
            placeholder="Rechercher un produit..."
            defaultValue={current.search ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                apply({ search: (e.target as HTMLInputElement).value });
              }
            }}
            onBlur={(e) => {
              if (e.target.value !== (current.search ?? "")) {
                apply({ search: e.target.value });
              }
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:min-w-[160px]">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Catégorie
            </label>
            <Select
              defaultValue={current.categoryId ?? ""}
              onValueChange={(v) => apply({ categoryId: v === "all" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {stores && stores.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Boutique
              </label>
              <Select
                defaultValue={current.storeId ?? ""}
                onValueChange={(v) => apply({ storeId: v === "all" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:min-w-[140px]">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Prix min
            </label>
            <Input
              type="number"
              placeholder="0"
              defaultValue={current.minPrice ?? ""}
              onBlur={(e) => apply({ minPrice: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Prix max
            </label>
            <Input
              type="number"
              placeholder="∞"
              defaultValue={current.maxPrice ?? ""}
              onBlur={(e) => apply({ maxPrice: e.target.value })}
            />
          </div>
        </div>

        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Tri
          </label>
          <Select
            defaultValue={current.sort ?? "newest"}
            onValueChange={(v) => apply({ sort: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Plus récents</SelectItem>
              <SelectItem value="price_asc">Prix croissant</SelectItem>
              <SelectItem value="price_desc">Prix décroissant</SelectItem>
              <SelectItem value="popular">Populaires</SelectItem>
              <SelectItem value="rating">Mieux notés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 px-1">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={current.inStock === "1"}
            onChange={(e) => apply({ inStock: e.target.checked ? "1" : "" })}
            className="h-4 w-4 rounded border-gray-300"
          />
          En stock uniquement
        </label>

        <Select
          defaultValue={current.minRating ?? ""}
          onValueChange={(v) => apply({ minRating: v === "all" ? "" : v })}
        >
          <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs">
            <SelectValue placeholder="Toute note" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toute note</SelectItem>
            <SelectItem value="4">4★ et plus</SelectItem>
            <SelectItem value="3">3★ et plus</SelectItem>
            <SelectItem value="2">2★ et plus</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
