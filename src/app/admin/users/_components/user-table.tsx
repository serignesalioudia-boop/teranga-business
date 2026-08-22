"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateUserRole, toggleUserActive } from "@/server/actions/users";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  sellerProfile: {
    status: string;
    isVerified: boolean;
    store: { name: string } | null;
  } | null;
  _count: { orders: number; reviews: number };
};

type Props = {
  data: {
    users: UserRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  currentSearch?: string;
  currentRole?: string;
};

const roleLabels: Record<string, string> = {
  USER: "Client",
  SELLER: "Vendeur",
  ADMIN: "Admin",
};

export function UserTable({ data, currentSearch, currentRole }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch ?? "");
  const [isPending, startTransition] = useTransition();

  function applyFilters(role?: string, searchText?: string) {
    const params = new URLSearchParams();
    const r = role ?? currentRole ?? "";
    const s = searchText ?? search;
    if (r) params.set("role", r);
    if (s) params.set("search", s);
    router.push(`/admin/users?${params.toString()}`);
  }

  function handleToggleActive(userId: string) {
    startTransition(async () => {
      await toggleUserActive(userId);
      router.refresh();
    });
  }

  function handleRoleChange(userId: string, newRole: string) {
    startTransition(async () => {
      await updateUserRole(userId, newRole as "USER" | "ADMIN");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyFilters(currentRole, search);
          }}
          className="w-72"
        />
        <select
          value={currentRole ?? ""}
          onChange={(e) => applyFilters(e.target.value, search)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Tous les rôles</option>
          <option value="USER">Clients</option>
          <option value="SELLER">Vendeurs</option>
          <option value="ADMIN">Admins</option>
        </select>
        <Button variant="outline" size="sm" onClick={() => applyFilters(currentRole, search)}>
          Rechercher
        </Button>
      </div>

      <div className="rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">Nom</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Rôle</th>
                <th className="p-3 font-medium">Boutique</th>
                <th className="p-3 font-medium">Commandes</th>
                <th className="p-3 font-medium">Statut</th>
                <th className="p-3 font-medium">Inscrit le</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                data.users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3 text-xs text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={isPending}
                        className="rounded border bg-background px-2 py-1 text-xs"
                      >
                        <option value="USER">Client</option>
                        <option value="SELLER">Vendeur</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="p-3 text-xs">
                      {u.sellerProfile?.store?.name ?? "—"}
                    </td>
                    <td className="p-3 text-xs">{u._count.orders}</td>
                    <td className="p-3">
                      <Badge variant={u.isActive ? "default" : "destructive"}>
                        {u.isActive ? "Actif" : "Banni"}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("fr-SN")}
                    </td>
                    <td className="p-3">
                      <Button
                        variant={u.isActive ? "destructive" : "outline"}
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleToggleActive(u.id)}
                      >
                        {u.isActive ? "Bannir" : "Débannir"}
                      </Button>
                    </td>
                  </tr>
                ))
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
                if (currentRole) params.set("role", currentRole);
                if (search) params.set("search", search);
                if (p > 1) params.set("page", String(p));
                router.push(`/admin/users?${params.toString()}`);
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
