export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getProducts, deleteProduct } from "@/server/actions/products";
import { getSellerStore } from "@/server/actions/seller-stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/admin/delete-button";


export const metadata = { title: "Mes produits — Vendeur — Teranga Business" };

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

export default async function SellerProductsPage() {
  let store;
  try {
    const result = await getSellerStore();
    store = result.store;
  } catch {
    redirect("/");
  }

  const { products, total } = await getProducts({
    storeId: store.id,
    includeInactive: true,
    pageSize: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Produits{" "}
          <span className="text-sm font-normal text-muted-foreground">({total})</span>
        </h1>
        <Button asChild>
          <Link href="/seller/products/new">Nouveau produit</Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Vedette</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.category.name}</TableCell>
                <TableCell>{formatPrice(p.price)}</TableCell>
                <TableCell>{p.stock}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      p.status === "PUBLISHED"
                        ? "default"
                        : p.status === "DRAFT"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {statusLabels[p.status] ?? p.status}
                  </Badge>
                </TableCell>
                <TableCell>{p.isFeatured ? "★" : "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/seller/products/${p.id}`}>Modifier</Link>
                    </Button>
                    <DeleteButton
                      action={deleteProduct.bind(null, p.id)}
                      confirmMessage={`Supprimer le produit « ${p.name} » ?`}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Aucun produit.{" "}
                  <Link href="/seller/products/new" className="text-primary hover:underline">
                    Créer un produit
                  </Link>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
