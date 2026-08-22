import Link from "next/link";
import { Suspense } from "react";
import { getProducts, getStores } from "@/server/actions/products";
import { getCategories } from "@/server/actions/categories";
import { getFavoriteIds } from "@/server/actions/favorites";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/product/product-filters";
import { ActiveFilters } from "@/components/ui/active-filters";
import { buildActiveFilters } from "@/lib/filter-helpers";
import { Pagination } from "@/components/ui/pagination";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Produits — Teranga Business",
  description: "Tous les produits disponibles sur Teranga Business.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const search = typeof sp.search === "string" ? sp.search : undefined;
  const categoryId = typeof sp.categoryId === "string" ? sp.categoryId : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";
  const minPrice = typeof sp.minPrice === "string" && sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = typeof sp.maxPrice === "string" && sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const inStock = typeof sp.inStock === "string" && sp.inStock === "1" ? true : undefined;
  const minRating = typeof sp.minRating === "string" && sp.minRating ? Number(sp.minRating) : undefined;
  const storeId = typeof sp.storeId === "string" ? sp.storeId : undefined;

  const [{ products, total, totalPages }, categories, stores, favoriteIds] = await Promise.all([
    getProducts({
      status: "PUBLISHED",
      search,
      categoryId,
      sort: sort as "newest" | "price_asc" | "price_desc" | "popular" | "rating",
      minPrice,
      maxPrice,
      inStock,
      minRating,
      storeId,
      page,
      pageSize: 20,
    }),
    getCategories(),
    getStores(),
    getFavoriteIds(),
  ]);
  const favSet = new Set(favoriteIds);

  const urlParams: Record<string, string | undefined> = {
    search, categoryId, sort, minPrice: minPrice ? String(minPrice) : undefined,
    maxPrice: maxPrice ? String(maxPrice) : undefined,
    inStock: inStock ? "1" : undefined,
    minRating: minRating ? String(minRating) : undefined,
    storeId,
  };

  const filters = buildActiveFilters(new URLSearchParams(
    Object.entries(urlParams).filter(([, v]) => v) as [string, string][]
  ));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">
        Produits{" "}
        <span className="text-sm font-normal text-muted-foreground">
          ({total})
        </span>
      </h1>

      <Suspense>
        <ProductFilters
          categories={categories}
          stores={stores}
          current={{
            search, categoryId, sort,
            minPrice: sp.minPrice as string,
            maxPrice: sp.maxPrice as string,
            inStock: sp.inStock as string,
            minRating: sp.minRating as string,
            storeId: sp.storeId as string,
          }}
        />
      </Suspense>

      <div className="mt-4">
        <Suspense>
          <ActiveFilters filters={filters} />
        </Suspense>
      </div>

      {search && (
        <p className="mt-4 text-sm text-muted-foreground">
          Résultats pour « <span className="font-medium text-foreground">{search}</span> »
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} favoriteIds={favSet} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="mt-12 text-center text-muted-foreground">
          <p className="text-lg">Aucun produit trouvé.</p>
          <Link href="/products" className="mt-2 text-sm text-primary hover:underline">
            Voir tous les produits
          </Link>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/products" params={urlParams} />
    </div>
  );
}
