export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getCategories } from "@/server/actions/categories";
import { getProducts, getStores } from "@/server/actions/products";
import { getFavoriteIds } from "@/server/actions/favorites";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/product/product-filters";
import { ActiveFilters } from "@/components/ui/active-filters";
import { buildActiveFilters } from "@/lib/filter-helpers";
import { Pagination } from "@/components/ui/pagination";
import { ShareButtons } from "@/components/social/share-buttons";
import { Suspense } from "react";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};


export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Catégorie introuvable" };

  const url = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/category/${category.slug}`;

  return {
    title: `${category.name} — Teranga Business`,
    description: category.description ?? `Produits dans la catégorie ${category.name}`,
    openGraph: {
      title: `${category.name} — Teranga Business`,
      description: category.description ?? `Découvrez les produits ${category.name} sur Teranga Business`,
      url,
      siteName: "Teranga Business",
      images: category.imageUrl ? [{ url: category.imageUrl, width: 1200, height: 630 }] : [],
      locale: "fr_SN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} — Teranga Business`,
      description: category.description ?? `Découvrez les produits ${category.name} sur Teranga Business`,
      images: category.imageUrl ? [category.imageUrl] : [],
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = Math.max(1, Number(sp.page) || 1);
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";
  const minPrice = typeof sp.minPrice === "string" && sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = typeof sp.maxPrice === "string" && sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  const inStock = typeof sp.inStock === "string" && sp.inStock === "1" ? true : undefined;
  const minRating = typeof sp.minRating === "string" && sp.minRating ? Number(sp.minRating) : undefined;
  const storeId = typeof sp.storeId === "string" ? sp.storeId : undefined;

  const [{ products, total, totalPages }, allCategories, stores, favoriteIds] = await Promise.all([
    getProducts({
      status: "PUBLISHED",
      categoryId: category.id,
      search,
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
    sort, search, minPrice: minPrice ? String(minPrice) : undefined,
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
      {/* Breadcrumbs */}
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Accueil</Link>
        <span className="mx-1">/</span>
        <Link href="/categories" className="hover:text-primary">Catégories</Link>
        {category.parent && (
          <>
            <span className="mx-1">/</span>
            <Link href={`/category/${category.parent.slug}`} className="hover:text-primary">
              {category.parent.name}
            </Link>
          </>
        )}
        <span className="mx-1">/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      <h1 className="mb-2 text-2xl font-bold">
        {category.icon || "📂"} {category.name}
      </h1>
      {category.description && (
        <p className="mb-4 text-muted-foreground">{category.description}</p>
      )}

      {/* Partage catégorie */}
      <div className="mb-6">
        <ShareButtons
          targetType="CATEGORY"
          targetId={category.id}
          targetSlug={category.slug}
          title={category.name}
          description={category.description ?? undefined}
          imageUrl={category.imageUrl ?? undefined}
          url={`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/category/${category.slug}`}
        />
      </div>

      {/* Sous-catégories */}
      {category.children.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/category/${child.slug}`}
                className="rounded-full border px-4 py-2 text-sm transition hover:bg-accent"
              >
                {child.name}
                <span className="ml-1 text-muted-foreground">({child._count.products})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Suspense>
        <ProductFilters
          categories={allCategories}
          stores={stores}
          current={{
            search, sort,
            minPrice: sp.minPrice as string,
            maxPrice: sp.maxPrice as string,
            inStock: sp.inStock as string,
            minRating: sp.minRating as string,
            storeId: sp.storeId as string,
          }}
          basePath={`/category/${slug}`}
        />
      </Suspense>

      <div className="mt-4">
        <Suspense>
          <ActiveFilters filters={filters} />
        </Suspense>
      </div>

      <h2 className="mt-6 mb-4 text-lg font-semibold">
        Produits ({total})
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} favoriteIds={favSet} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="mt-12 text-center text-muted-foreground">
          <p className="text-lg">Aucun produit dans cette catégorie.</p>
          <Link href="/products" className="mt-2 text-sm text-primary hover:underline">
            Voir tous les produits
          </Link>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath={`/category/${slug}`} params={urlParams} />
    </div>
  );
}
