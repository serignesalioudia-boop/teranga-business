import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/server/actions/products";
import { hasUserReviewed } from "@/server/actions/reviews";
import { ProductGallery } from "@/components/product/product-gallery";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ReviewList } from "@/components/reviews/review-list";
import { ReviewForm } from "@/components/reviews/review-form";
import { ShareButtons } from "@/components/social/share-buttons";
import { WhatsAppShareButton } from "@/components/social/whatsapp-share";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produit introuvable" };

  const firstImage = product.media[0];
  const url = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/product/${product.slug}`;

  return {
    title: `${product.name} — Teranga Business`,
    description: product.description?.slice(0, 160) ?? `${product.name} disponible sur Teranga Business`,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) ?? undefined,
      url,
      siteName: "Teranga Business",
      images: firstImage ? [{ url: firstImage.url, alt: firstImage.alt ?? product.name, width: 1200, height: 630 }] : undefined,
      locale: "fr_SN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description?.slice(0, 160) ?? undefined,
      images: firstImage ? [firstImage.url] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const user = await getCurrentUser();
  const alreadyReviewed = user ? await hasUserReviewed(product.id) : false;

  const sellerName =
    product.store.sellerProfile?.user?.name ?? product.store.name;
  const hasDiscount =
    product.discountPrice && BigInt(product.discountPrice) > 0;
  const displayPrice = hasDiscount ? product.discountPrice! : product.price;
  const isLowStock =
    product.lowStockThreshold > 0 &&
    product.stock <= product.lowStockThreshold;

  const productUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/product/${product.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.media[0]?.url ?? undefined,
    sku: product.sku ?? undefined,
    brand: { "@type": "Brand", name: sellerName },
    offers: {
      "@type": "Offer",
      priceCurrency: "XOF",
      price: Number(displayPrice),
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    aggregateRating: product.ratingCount > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: Number(product.ratingAvg),
          reviewCount: product.ratingCount,
        }
      : undefined,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Accueil</Link>
        <span className="mx-1">/</span>
        <Link href={`/category/${product.category.slug}`} className="hover:text-primary">
          {product.category.name}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Images */}
        <ProductGallery
          images={product.media.map((m) => ({
            url: m.url,
            alt: m.alt,
          }))}
        />

        {/* Détails */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {product.category.name}
            </p>
            <h1 className="text-2xl font-bold">
              {product.name}
              {product.isDigital && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Digital
                </Badge>
              )}
            </h1>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-primary">
              {formatPrice(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <div className="space-y-1 text-sm">
            {product.isDigital ? (
              <p>
                Livraison : <span className="text-green-600 font-medium">Téléchargement instantané</span>
              </p>
            ) : (
              <p>
                Stock :{" "}
                {product.stock > 0 ? (
                  <span className={isLowStock ? "text-orange-600" : ""}>
                    {product.stock} disponible{product.stock > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-destructive">Rupture de stock</span>
                )}
              </p>
            )}
            {product.sku && (
              <p className="text-muted-foreground">SKU : {product.sku}</p>
            )}
          </div>

          {product.stock > 0 && (
            <AddToCartButton productId={product.id} stock={product.stock} />
          )}

          {product.description && (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* Vendeur */}
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">Vendu par</p>
            <Link
              href={`/store/${product.store.slug}`}
              className="font-medium hover:text-primary"
            >
              {product.store.name}
            </Link>
            {product.ratingCount > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                ★ {Number(product.ratingAvg).toFixed(1)} ({product.ratingCount} avis)
              </p>
            )}
          </div>

          {/* Contacter via WhatsApp */}
          <WhatsAppShareButton
            productName={product.name}
            productUrl={productUrl}
            storeWhatsapp={product.store.whatsapp}
            price={formatPrice(displayPrice)}
          />

          {/* Partage produit */}
          <div className="rounded-xl border p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Partager ce produit</p>
            <ShareButtons
              targetType="PRODUCT"
              targetId={product.id}
              targetSlug={product.slug}
              title={product.name}
              description={product.description ?? undefined}
              imageUrl={product.media[0]?.url}
              url={productUrl}
            />
          </div>
        </div>
      </div>

      {/* Avis */}
      <section className="mt-10 space-y-6">
        <h2 className="text-xl font-bold">Avis clients</h2>

        {user && !alreadyReviewed && (
          <ReviewForm productId={product.id} />
        )}

        {alreadyReviewed && (
          <p className="text-sm text-muted-foreground">
            Vous avez déjà donné votre avis sur ce produit.
          </p>
        )}

        <ReviewList
          productId={product.id}
          ratingAvg={Number(product.ratingAvg)}
          ratingCount={product.ratingCount}
        />
      </section>
    </div>
  );
}
