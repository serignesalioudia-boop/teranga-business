"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type StoreRow = {
  id: string;
  name: string;
  isActive: boolean;
  ratingAvg: number;
  ratingCount: number;
  sellerProfile: {
    isVerified: boolean;
    user: { name: string; email: string };
  };
  _count: { products: number };
};

type Props = {
  stores: StoreRow[];
  search?: string;
};

export function StoreTable({ stores, search }: Props) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(search ?? "");

  const filtered = search
    ? stores.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.sellerProfile.user.name.toLowerCase().includes(search.toLowerCase()) ||
          s.sellerProfile.user.email.toLowerCase().includes(search.toLowerCase())
      )
    : stores;

  function applySearch() {
    const params = new URLSearchParams();
    if (searchInput) params.set("search", searchInput);
    router.push(`/admin/stores?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Rechercher une boutique..."
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
              <th className="p-3 font-medium">Vendeur</th>
              <th className="p-3 font-medium">Produits</th>
              <th className="p-3 font-medium">Note</th>
              <th className="p-3 font-medium">Statut</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3">
                  <p className="text-xs">{s.sellerProfile.user.name}</p>
                  <p className="text-xs text-muted-foreground">{s.sellerProfile.user.email}</p>
                </td>
                <td className="p-3 text-xs">{s._count.products}</td>
                <td className="p-3 text-xs">
                  {s.ratingCount > 0
                    ? `${Number(s.ratingAvg).toFixed(1)} (${s.ratingCount})`
                    : "—"}
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {s.isActive ? (
                      <Badge variant="default">Actif</Badge>
                    ) : (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                    {s.sellerProfile.isVerified && (
                      <Badge variant="outline">Vérifié</Badge>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/stores/${s.id}`}>Modifier</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Aucune boutique.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
