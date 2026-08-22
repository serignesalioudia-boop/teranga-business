export const dynamic = "force-dynamic";

import Link from "next/link";
import { getProducts } from "@/server/actions/products";
import { Button } from "@/components/ui/button";
import { ProductTable } from "./_components/product-table";


export const metadata = { title: "Gestion des produits — Admin" };

type Props = { searchParams: Promise<{ search?: string; status?: string; page?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const result = await getProducts({
    includeInactive: true,
    search: params.search,
    page: params.page ? Number(params.page) : 1,
    pageSize: 20,
  });

  const serialized = result.products.map((p) => ({
    ...p,
    price: Number(p.price),
    store: p.store as { name: string },
    category: p.category as { name: string },
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Produits{" "}
          <span className="text-sm font-normal text-muted-foreground">({result.total})</span>
        </h1>
        <Button asChild>
          <Link href="/admin/products/new">Nouveau produit</Link>
        </Button>
      </div>
      <ProductTable
        data={{ ...result, products: serialized }}
        currentSearch={params.search}
        currentStatus={params.status}
      />
    </div>
  );
}
