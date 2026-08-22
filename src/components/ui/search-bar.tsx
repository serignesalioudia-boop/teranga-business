"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { getSearchSuggestions } from "@/server/actions/products";

type Suggestion = {
  products: { id: string; name: string; slug: string; price: bigint; media: { url: string }[] }[];
  categories: { id: string; name: string; slug: string }[];
};

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchSuggestions = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.trim().length < 2) {
      setSuggestions(null);
      return;
    }
    timerRef.current = setTimeout(() => {
      getSearchSuggestions(q).then(setSuggestions);
    }, 300);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    if (query.trim()) {
      startTransition(() => router.push(`/products?search=${encodeURIComponent(query.trim())}`));
    }
  }

  function navigate(path: string) {
    setOpen(false);
    setQuery("");
    startTransition(() => router.push(path));
  }

  const hasSuggestions = suggestions && (suggestions.products.length > 0 || suggestions.categories.length > 0);

  return (
    <div ref={ref} className="relative flex-1 max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            fetchSuggestions(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Rechercher..."
          className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </form>

      {open && hasSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-background p-2 shadow-lg">
          {suggestions.categories.length > 0 && (
            <div className="mb-2">
              <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">Catégories</p>
              {suggestions.categories.map((c) => (
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
          {suggestions.products.length > 0 && (
            <div>
              <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">Produits</p>
              {suggestions.products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/product/${p.slug}`)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  {p.media[0] && (
                    <img src={p.media[0].url} alt="" className="h-8 w-8 rounded object-cover" loading="lazy" />
                  )}
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF" }).format(Number(p.price))}
                  </span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => navigate(`/products?search=${encodeURIComponent(query)}`)}
            className="mt-1 w-full rounded-md px-2 py-1.5 text-center text-xs font-medium text-primary hover:bg-accent"
          >
            Voir tous les résultats →
          </button>
        </div>
      )}
    </div>
  );
}
