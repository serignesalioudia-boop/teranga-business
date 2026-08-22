"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";

type Filter = { key: string; label: string };

export function ActiveFilters({ filters, basePath = "/products" }: { filters: Filter[]; basePath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function remove(key: string) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete(key);
    sp.delete("page");
    startTransition(() => router.push(`${basePath}?${sp.toString()}`));
  }

  function clearAll() {
    startTransition(() => router.push(basePath));
  }

  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Filtres :</span>
      {filters.map((f) => (
        <span
          key={f.key}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
        >
          {f.label}
          <button onClick={() => remove(f.key)} className="rounded-full p-0.5 hover:bg-primary/20">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        onClick={clearAll}
        className="text-xs text-muted-foreground underline hover:text-foreground"
      >
        Tout effacer
      </button>
    </div>
  );
}
