"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { deleteProduct } from "@/server/actions/products";
import { DeleteButton } from "@/components/admin/delete-button";
import { downloadCsv } from "@/lib/csv";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  status: string;
  isFeatured: boolean;
  store: { name: string };
  category: { name: string };
};

type Props = {
  data: {
    products: ProductRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  currentSearch?: string;
  currentStatus?: string;
};

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

export function ProductTable({ data, currentSearch, currentStatus }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch ?? "");

  function applyFilters(status?: string, searchText?: string) {
    const params = new URLSearchParams();
    const s = searchText ?? search;
    const st = status ?? currentStatus ?? "";
    if (s) params.set("search", s);
    if (st) params.set("status", st);
    router.push(`/admin/products?${params.toString()}`);
  }

  function handleExport() {
    const rows = data.products.map((p) => ({
      Nom: p.name,
      Boutique: p.store.name,
      Catégorie: p.category.name,
      Prix: p.price,
      Stock: p.stock,
      Statut: statusLabels[p.status] ?? p.status,
      Vedette: p.isFeatured ? "Oui" : "Non",
    }));
    downloadCsv(rows, "produits.csv");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyFilters(currentStatus, search);
          }}
          className="w-64"
        />
        <select
          value={currentStatus ?? ""}
          onChange={(e) => applyFilters(e.target.value, search)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="PUBLISHED">Publié</option>
          <option value="DRAFT">Brouillon</option>
          <option value="ARCHIVED">Archivé</option>
        </select>
        <Button variant="outline" size="sm" onClick={() => applyFilters(currentStatus, search)}>
          Rechercher
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">Nom</th>
                <th className="p-3 font-medium">Boutique</th>
                <th className="p-3 font-medium">Catégorie</th>
                <th className="p-3 font-medium">Prix</th>
                <th className="p-3 font-medium">Stock</th>
                <th className="p-3 font-medium">Statut</th>
                <th className="p-3 font-medium">Vedette</th>
                <th className="p-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {data.products.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-xs">{p.store.name}</td>
                  <td className="p-3 text-xs">{p.category.name}</td>
                  <td className="p-3 text-xs">{formatPrice(p.price)}</td>
                  <td className="p-3 text-xs">{p.stock}</td>
                  <td className="p-3">
                    <Badge
                      variant={
                        p.status === "PUBLISHED" ? "default" : p.status === "DRAFT" ? "secondary" : "outline"
                      }
                    >
                      {statusLabels[p.status] ?? p.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs">{p.isFeatured ? "★" : "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/products/${p.id}`}>Modifier</Link>
                      </Button>
                      <DeleteButton
                        action={deleteProduct.bind(null, p.id)}
                        confirmMessage={`Supprimer le produit « ${p.name} » ?`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {data.products.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    Aucun produit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === data.page ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const params = new URLSearchParams();
                if (currentSearch) params.set("search", currentSearch);
                if (currentStatus) params.set("status", currentStatus);
                if (p > 1) params.set("page", String(p));
                router.push(`/admin/products?${params.toString()}`);
              }}
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
