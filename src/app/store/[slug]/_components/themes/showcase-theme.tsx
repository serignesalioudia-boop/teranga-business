"use client";

import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { formatPrice } from "@/lib/format";
import { ShareButtons } from "@/components/social/share-buttons";
import { ThemeStoreHeader } from "./theme-store-header";
import { ThemeFilters } from "./theme-filters";
import type { ThemeProps } from "./types";

export function ShowcaseTheme({
  store,
  products,
  categories,
  favoriteIds,
  sellerName,
  storeSlug,
  currentCategory,
  currentSearch,
  currentSort,
}: ThemeProps) {
  const [featured, ...rest] = products;

  return (
    <>
      <ThemeStoreHeader store={store} />

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{store.name}</h1>
          <p className="text-sm text-muted-foreground">
            {sellerName}
            {store.isVerified && (
              <span className="ml-1 text-primary">✓ Vérifié</span>
            )}
            {store.ratingCount > 0 && (
              <span className="ml-2">
                ★ {Number(store.ratingAvg).toFixed(1)} ({store.ratingCount} avis)
              </span>
            )}
          </p>
          {store.description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{store.description}</p>
          )}
        </div>

        <div className="mb-6">
          <ShareButtons
            targetType="STORE"
            targetId={store.slug}
            targetSlug={store.slug}
            title={store.name}
            description={store.description ?? undefined}
            imageUrl={store.logoUrl ?? store.bannerUrl ?? undefined}
            url={`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/store/${store.slug}`}
          />
        </div>

        {featured && (
          <div className="mb-12 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="grid md:grid-cols-2">
              <div className="relative aspect-square bg-muted">
                {featured.media[0] ? (
                  <img
                    src={featured.media[0].url}
                    alt={featured.media[0].alt ?? featured.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-6xl text-muted-foreground">
                    📦
                  </div>
                )}
                <div className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Produit phare
                </div>
              </div>
              <div className="flex flex-col justify-center p-8">
                {featured.category && (
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">
                    {featured.category.name}
                  </p>
                )}
                <h2 className="text-3xl font-bold">{featured.name}</h2>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-3xl font-bold">
                    {featured.discountPrice && BigInt(featured.discountPrice) > 0
                      ? formatPrice(featured.discountPrice)
                      : formatPrice(featured.price)}
                  </span>
                  {featured.discountPrice && BigInt(featured.discountPrice) > 0 && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(featured.price)}
                    </span>
                  )}
                </div>
                {featured.ratingCount !== undefined && featured.ratingCount > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    ★ {Number(featured.ratingAvg).toFixed(1)} ({featured.ratingCount} avis)
                  </p>
                )}
                <Link
                  href={`/product/${featured.slug}`}
                  className="mt-6 inline-flex w-fit items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  Voir le produit
                </Link>
              </div>
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <>
            <ThemeFilters
              storeSlug={storeSlug}
              categories={categories}
              currentCategory={currentCategory}
              currentSearch={currentSearch}
              currentSort={currentSort}
            />

            <h2 className="mb-4 text-lg font-semibold">
              Plus de produits ({rest.length})
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {rest.map((p) => (
                <ProductCard key={p.id} product={p} favoriteIds={favoriteIds} subtitle="category" />
              ))}
            </div>
          </>
        )}

        {products.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-lg">Aucun produit trouvé.</p>
            <Link href={`/store/${storeSlug}`} className="mt-2 text-sm text-primary hover:underline">
              Voir tous les produits
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
