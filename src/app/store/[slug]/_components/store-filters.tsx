"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

export function StoreFilters({
  storeSlug,
  categories,
  currentCategory,
  currentSearch,
  currentSort,
}: {
  storeSlug: string;
  categories: { id: string; name: string; slug: string; count: number }[];
  currentCategory?: string;
  currentSearch?: string;
  currentSort?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentSearch ?? "");

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/store/${storeSlug}?${params.toString()}`);
    },
    [router, storeSlug, searchParams],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", searchInput.trim() || null);
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Barre de recherche + Tri */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher dans la boutique..."
              className="w-full rounded-lg border bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(""); updateParam("search", null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </form>

        <select
          value={currentSort ?? "newest"}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="newest">Nouveautés</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
          <option value="popular">Populaires</option>
          <option value="rating">Mieux notés</option>
        </select>
      </div>

      {/* Filtres catégorie */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateParam("category", null)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              !currentCategory
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            Tout ({categories.reduce((s, c) => s + c.count, 0)})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam("category", cat.id === currentCategory ? null : cat.id)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                currentCategory === cat.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
