"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { globalSearch } from "@/server/actions/search";

type SearchResult = {
  products: { id: string; name: string; slug: string; price: number; discountPrice: number | null; storeName: string; imageUrl: string | null; type: "product" }[];
  stores: { id: string; name: string; slug: string; description: string | null; type: "store" }[];
  categories: { id: string; name: string; slug: string; type: "category" }[];
};

const formatPrice = (n: number) =>
  new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF" }).format(n);

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (q.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;
      globalSearch(q).then((res) => {
        if (!controller.signal.aborted) {
          setResults(res);
          setLoading(false);
        }
      });
    }, 300);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function navigate(path: string) {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(path);
  }

  const hasResults =
    results &&
    (results.products.length > 0 || results.stores.length > 0 || results.categories.length > 0);

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            fetchResults(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Rechercher..."
          className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-lg border bg-background p-2 shadow-lg">
          {loading && !results && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">Recherche en cours...</p>
          )}

          {!loading && results && !hasResults && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">Aucun résultat</p>
          )}

          {results?.categories && results.categories.length > 0 && (
            <div className="mb-2">
              <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">Catégories</p>
              {results.categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/category/${c.slug}`)}
                  className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {results?.stores && results.stores.length > 0 && (
            <div className="mb-2">
              <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">Boutiques</p>
              {results.stores.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/store/${s.slug}`)}
                  className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <span className="font-medium">{s.name}</span>
                  {s.description && (
                    <span className="ml-1 text-xs text-muted-foreground truncate">
                      — {s.description.length > 60 ? s.description.slice(0, 60) + "…" : s.description}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {results?.products && results.products.length > 0 && (
            <div>
              <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">Produits</p>
              {results.products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/product/${p.slug}`)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  {p.imageUrl && (
                    <img src={p.imageUrl} alt="" className="h-8 w-8 rounded object-cover" loading="lazy" />
                  )}
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="whitespace-nowrap text-xs font-medium">
                    {p.discountPrice && p.discountPrice > 0 ? (
                      <>
                        <span className="text-primary">{formatPrice(p.discountPrice)}</span>
                        <span className="ml-1 text-muted-foreground line-through">{formatPrice(p.price)}</span>
                      </>
                    ) : (
                      formatPrice(p.price)
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}

          {results && hasResults && (
            <button
              onClick={() => navigate(`/products?search=${encodeURIComponent(query.trim())}`)}
              className="mt-1 w-full rounded-md px-2 py-1.5 text-center text-xs font-medium text-primary hover:bg-accent"
            >
              Voir tous les résultats →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
