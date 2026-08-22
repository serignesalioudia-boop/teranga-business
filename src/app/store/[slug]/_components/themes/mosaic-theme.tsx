"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ShareButtons } from "@/components/social/share-buttons";
import { ThemeStoreHeader } from "./theme-store-header";
import { ThemeFilters } from "./theme-filters";
import type { ThemeProps } from "./types";

export function MosaicTheme({
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

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{store.name}</h1>
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
          </div>
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

        {store.description && (
          <p className="mb-4 max-w-2xl text-sm text-muted-foreground">{store.description}</p>
        )}

        <ThemeFilters
          storeSlug={storeSlug}
          categories={categories}
          currentCategory={currentCategory}
          currentSearch={currentSearch}
          currentSort={currentSort}
        />

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
              const discount = p.discountPrice && BigInt(p.discountPrice) > 0;
              return (
                <div key={p.id} className="group relative rounded-xl border p-2 transition hover:shadow-md">
                  <Link href={`/product/${p.slug}`} className="block">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                      {p.media[0] ? (
                        <img
                          src={p.media[0].url}
                          alt={p.media[0].alt ?? p.name}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl text-muted-foreground">
                          📦
                        </div>
                      )}
                      {discount && (
                        <div className="absolute right-1 top-1 rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                          Promo
                        </div>
                      )}
                    </div>
                    <h3 className="mt-1.5 line-clamp-1 text-xs font-medium group-hover:text-primary">
                      {p.name}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-xs font-bold">
                        {discount ? formatPrice(p.discountPrice!) : formatPrice(p.price)}
                      </span>
                      {discount && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          {formatPrice(p.price)}
                        </span>
                      )}
                    </div>
                  </Link>
                  <FavoriteButton
                    productId={p.id}
                    initialFavorited={favoriteIds.has(p.id)}
                  />
                </div>
              );
            })}
          </div>
        ) : (
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
