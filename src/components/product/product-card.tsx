import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { FavoriteButton } from "./favorite-button";

type ProductCardProduct = {
  id: string;
  name: string;
  slug: string;
  price: number | string | bigint;
  discountPrice: number | string | bigint | null;
  ratingCount?: number;
  ratingAvg?: number | string | { toString(): string } | null;
  media: { url: string; alt: string | null }[];
  store?: { id?: string; name: string; slug?: string };
  category?: { name: string };
};

export function ProductCard({
  product: p,
  favoriteIds,
  subtitle = "store",
  variant = "marketplace",
}: {
  product: ProductCardProduct;
  favoriteIds?: Set<string>;
  subtitle?: "store" | "category";
  variant?: "marketplace" | "store";
}) {
  const discount = p.discountPrice && BigInt(p.discountPrice) > 0;
  const subtitleText =
    subtitle === "category" && p.category ? p.category.name : p.store?.name ?? "";

  if (variant === "store") {
    return (
      <div className="group relative overflow-hidden rounded-xl bg-[#fffdf8] shadow-md transition hover:-translate-y-1 hover:shadow-xl">
        <Link href={`/product/${p.slug}`} className="block">
          <div className="relative aspect-square overflow-hidden bg-[#f7ead3]">
            {p.media[0] ? (
              <img
                src={p.media[0].url}
                alt={p.media[0].alt ?? p.name}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl text-[#c8922d]">
                📦
              </div>
            )}
          </div>
          <div className="p-4">
            {subtitleText && (
              <p className="mb-1 text-xs font-semibold uppercase text-[#c8922d]">
                {subtitleText}
              </p>
            )}
            <h3 className="mb-1 text-base font-medium text-[#24160c] group-hover:text-[#c8922d]">
              {p.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#7a4712]">
                {discount ? formatPrice(p.discountPrice!) : formatPrice(p.price)}
              </span>
              {discount && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(p.price)}
                </span>
              )}
            </div>
            {p.ratingCount !== undefined && p.ratingCount > 0 && (
              <p className="mt-1 text-xs text-[#c8922d]">
                ★ {Number(p.ratingAvg).toFixed(1)} ({p.ratingCount})
              </p>
            )}
          </div>
        </Link>
        {favoriteIds && (
          <FavoriteButton
            productId={p.id}
            initialFavorited={favoriteIds.has(p.id)}
          />
        )}
      </div>
    );
  }

  return (
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
        <p className="text-xs text-muted-foreground">{subtitleText}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold">
            {discount ? formatPrice(p.discountPrice!) : formatPrice(p.price)}
          </span>
          {discount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(p.price)}
            </span>
          )}
        </div>
        {p.ratingCount !== undefined && p.ratingCount > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            ★ {Number(p.ratingAvg).toFixed(1)} ({p.ratingCount})
          </p>
        )}
      </Link>
      {favoriteIds && (
        <FavoriteButton
          productId={p.id}
          initialFavorited={favoriteIds.has(p.id)}
        />
      )}
    </div>
  );
}
