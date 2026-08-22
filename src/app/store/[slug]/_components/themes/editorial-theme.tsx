"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ShareButtons } from "@/components/social/share-buttons";
import { ThemeStoreHeader } from "./theme-store-header";
import { ThemeFilters } from "./theme-filters";
import type { ThemeProps } from "./types";

export function EditorialTheme({
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
        <div className="mb-8 grid gap-8 md:grid-cols-2">
          <div>
            <h1 className="text-3xl font-bold">{store.name}</h1>
            <p className="mt-2 text-muted-foreground">
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
              <p className="mt-4 text-muted-foreground leading-relaxed">{store.description}</p>
            )}
          </div>
          <div className="flex items-center justify-end">
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

        {featured && (
          <div className="mb-12 overflow-hidden rounded-2xl border bg-card">
            <Link href={`/product/${featured.slug}`} className="block md:grid md:grid-cols-2">
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
                <div className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Vedette
                </div>
              </div>
              <div className="flex flex-col justify-center p-8">
                {featured.category && (
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {featured.category.name}
                  </p>
                )}
                <h2 className="text-2xl font-bold">{featured.name}</h2>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-2xl font-bold">
                    {featured.discountPrice && BigInt(featured.discountPrice) > 0
                      ? formatPrice(featured.discountPrice)
                      : formatPrice(featured.price)}
                  </span>
                  {featured.discountPrice && BigInt(featured.discountPrice) > 0 && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(featured.price)}
                    </span>
                  )}
                </div>
                {featured.ratingCount !== undefined && featured.ratingCount > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    ★ {Number(featured.ratingAvg).toFixed(1)} ({featured.ratingCount} avis)
                  </p>
                )}
                <p className="mt-4 text-sm text-muted-foreground">
                  Découvrez ce produit vedette de {store.name}.
                </p>
              </div>
            </Link>
          </div>
        )}

        <ThemeFilters
          storeSlug={storeSlug}
          categories={categories}
          currentCategory={currentCategory}
          currentSearch={currentSearch}
          currentSort={currentSort}
        />

        {rest.length > 0 && (
          <>
            <h2 className="mb-6 text-lg font-semibold">
              Autres produits ({rest.length})
            </h2>
            <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
              {rest.map((p) => (
                <div key={p.id} className="mb-4 break-inside-avoid">
                  <div className="group relative rounded-xl border p-3 transition hover:shadow-md">
                    <Link href={`/product/${p.slug}`} className="block">
                      <div className="relative aspect-square rounded-lg bg-muted">
                        {p.media[0] ? (
                          <img
                            src={p.media[0].url}
                            alt={p.media[0].alt ?? p.name}
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-2xl text-muted-foreground">
                            📦
                          </div>
                        )}
                      </div>
                      <h3 className="mt-2 line-clamp-1 text-sm font-medium group-hover:text-primary">
                        {p.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{p.category?.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-bold">
                          {p.discountPrice && BigInt(p.discountPrice) > 0
                            ? formatPrice(p.discountPrice)
                            : formatPrice(p.price)}
                        </span>
                        {p.discountPrice && BigInt(p.discountPrice) > 0 && (
                          <span className="text-xs text-muted-foreground line-through">
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
                </div>
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
