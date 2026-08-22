"use client";

import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { ShareButtons } from "@/components/social/share-buttons";
import { ThemeStoreHeader } from "./theme-store-header";
import { ThemeSidebar } from "./theme-sidebar";
import { ThemeFilters } from "./theme-filters";
import type { ThemeProps } from "./types";

export function BannerTheme({
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
  return (
    <>
      <ThemeStoreHeader store={store} />

      {store.bannerUrl && (
        <div className="mb-6 overflow-hidden rounded-2xl bg-muted">
          <img
            src={store.bannerUrl}
            alt={`Bannière ${store.name}`}
            className="h-48 w-full object-cover md:h-72"
          />
        </div>
      )}

      <div className="mx-auto flex w-full max-w-7xl gap-0 px-4">
        <ThemeSidebar storeSlug={storeSlug} categories={categories} />
        <main className="flex-1 py-6">
          <div className="mb-6 flex items-start gap-4">
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={store.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl">
                🏪
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{store.name}</h1>
              <p className="text-sm text-muted-foreground">
                {sellerName}
                {store.isVerified && (
                  <span className="ml-1 text-primary">✓ Vérifié</span>
                )}
              </p>
              {store.ratingCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  ★ {Number(store.ratingAvg).toFixed(1)} ({store.ratingCount} avis)
                </p>
              )}
            </div>
          </div>

          {store.description && (
            <p className="mb-6 max-w-2xl text-muted-foreground">{store.description}</p>
          )}

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

          <ThemeFilters
            storeSlug={storeSlug}
            categories={categories}
            currentCategory={currentCategory}
            currentSearch={currentSearch}
            currentSort={currentSort}
          />

          <h2 className="mb-4 text-lg font-semibold">
            Produits ({products.length})
          </h2>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} favoriteIds={favoriteIds} subtitle="category" />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-lg">Aucun produit trouvé.</p>
              <Link href={`/store/${storeSlug}`} className="mt-2 text-sm text-primary hover:underline">
                Voir tous les produits
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
