"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ShareButtons } from "@/components/social/share-buttons";
import { ThemeStoreHeader } from "./theme-store-header";
import { ThemeFilters } from "./theme-filters";
import type { ThemeProps } from "./types";

export function GalleryTheme({
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
        <div className="mb-6 flex items-center gap-4">
          {store.logoUrl ? (
            <img
              src={store.logoUrl}
              alt={store.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl">
              🏪
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{store.name}</h1>
            <p className="text-xs text-muted-foreground">
              {sellerName}
              {store.isVerified && (
                <span className="ml-1 text-primary">✓</span>
              )}
            </p>
          </div>
          <div className="ml-auto">
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
        </div>

        <ThemeFilters
          storeSlug={storeSlug}
          categories={categories}
          currentCategory={currentCategory}
          currentSearch={currentSearch}
          currentSort={currentSort}
        />

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {products.map((p) => {
              const discount = p.discountPrice && BigInt(p.discountPrice) > 0;
              return (
                <div key={p.id} className="group relative">
                  <Link href={`/product/${p.slug}`} className="block">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                      {p.media[0] ? (
                        <img
                          src={p.media[0].url}
                          alt={p.media[0].alt ?? p.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
                          📦
                        </div>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/0 p-4 text-center opacity-0 transition duration-300 group-hover:bg-black/50 group-hover:opacity-100">
                        <h3 className="text-sm font-bold text-white">{p.name}</h3>
                        <p className="mt-1 text-xs text-white/80">{p.category?.name}</p>
                        <p className="mt-2 text-sm font-bold text-white">
                          {discount
                            ? formatPrice(p.discountPrice!)
                            : formatPrice(p.price)}
                        </p>
                        {discount && (
                          <p className="text-xs text-white/60 line-through">
                            {formatPrice(p.price)}
                          </p>
                        )}
                      </div>
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
