"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteCategory } from "@/server/actions/categories";
import { DeleteButton } from "@/components/admin/delete-button";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent: { name: string } | null;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number; children: number };
};

type Props = {
  categories: CategoryRow[];
  search?: string;
};

export function CategoryTable({ categories, search }: Props) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(search ?? "");

  const filtered = search
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.slug.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  function applySearch() {
    const params = new URLSearchParams();
    if (searchInput) params.set("search", searchInput);
    router.push(`/admin/categories?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Rechercher une catégorie..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applySearch();
          }}
          className="w-64"
        />
        <Button variant="outline" size="sm" onClick={applySearch}>
          Rechercher
        </Button>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium">Nom</th>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">Parent</th>
              <th className="p-3 font-medium">Produits</th>
              <th className="p-3 font-medium">Sous-cat.</th>
              <th className="p-3 font-medium">Ordre</th>
              <th className="p-3 font-medium">Statut</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((cat) => (
              <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3 font-medium">{cat.name}</td>
                <td className="p-3 text-muted-foreground text-xs">{cat.slug}</td>
                <td className="p-3 text-xs">{cat.parent?.name ?? "—"}</td>
                <td className="p-3 text-xs">{cat._count.products}</td>
                <td className="p-3 text-xs">{cat._count.children}</td>
                <td className="p-3 text-xs">{cat.sortOrder}</td>
                <td className="p-3">
                  {cat.isActive ? (
                    <Badge variant="default">Actif</Badge>
                  ) : (
                    <Badge variant="secondary">Inactif</Badge>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/categories/${cat.id}`}>Modifier</Link>
                    </Button>
                    <DeleteButton
                      action={deleteCategory.bind(null, cat.id)}
                      confirmMessage={`Supprimer la catégorie « ${cat.name} » ?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  Aucune catégorie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
