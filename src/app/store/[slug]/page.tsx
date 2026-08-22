export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getStoreBySlug, getStoreProducts, getStoreFeaturedProducts, getStoreCategories } from "@/server/actions/stores";
import { getFavoriteIds } from "@/server/actions/favorites";
import { VendeurTheme } from "./_components/themes/vendeur-theme";
import { getStoreThemeConfig } from "@/lib/store-theme";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return { title: "Boutique introuvable" };

  const url = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/store/${store.slug}`;
  const image = store.logoUrl ?? store.bannerUrl ?? undefined;

  return {
    title: `${store.name} — Teranga Business`,
    description: store.description ?? `Boutique ${store.name} sur Teranga Business`,
    openGraph: {
      title: store.name,
      description: store.description ?? `Découvrez ${store.name} sur Teranga Business`,
      url,
      siteName: "Teranga Business",
      images: image ? [{ url: image, width: 1200, height: 630 }] : [],
      locale: "fr_SN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: store.name,
      description: store.description ?? `Découvrez ${store.name} sur Teranga Business`,
      images: image ? [image] : [],
    },
  };
}

export default async function StorePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const [store, favoriteIds] = await Promise.all([
    getStoreBySlug(slug),
    getFavoriteIds(),
  ]);
  if (!store) notFound();
  const favSet = new Set(favoriteIds);

  const categoryFilter = typeof sp.category === "string" ? sp.category : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";

  const [rawFilteredProducts, rawFeaturedProducts, categories] = await Promise.all([
    getStoreProducts(store.id, { categoryId: categoryFilter, search, sort }),
    getStoreFeaturedProducts(store.id),
    getStoreCategories(store.id),
  ]);

  const filteredProducts = rawFilteredProducts.map((p) => ({
    ...p,
    price: Number(p.price),
    discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,
    ratingAvg: p.ratingAvg != null ? Number(p.ratingAvg) : null,
  }));

  const featuredProducts = rawFeaturedProducts.map((p) => ({
    ...p,
    price: Number(p.price),
    discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,
    ratingAvg: p.ratingAvg != null ? Number(p.ratingAvg) : null,
  }));

  const sellerName = store.sellerProfile?.user?.name ?? store.name;
  const storeThemeConfig = getStoreThemeConfig(store.storeTheme);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            name: store.name,
            description: store.description ?? undefined,
            image: store.logoUrl ?? store.bannerUrl ?? undefined,
            url: `https://terangabusiness.sn/store/${store.slug}`,
          }),
        }}
      />

      <VendeurTheme
        store={{
          name: store.name,
          slug: store.slug,
          description: store.description,
          logoUrl: store.logoUrl,
          bannerUrl: store.bannerUrl,
          whatsapp: store.whatsapp,
          ratingAvg: Number(store.ratingAvg),
          ratingCount: store.ratingCount,
          isVerified: store.sellerProfile?.isVerified ?? false,
        }}
        products={filteredProducts}
        featuredProducts={featuredProducts}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          count: c._count.products,
        }))}
        favoriteIds={favSet}
        sellerName={sellerName}
        storeSlug={store.slug}
        currentCategory={categoryFilter}
        currentSearch={search}
        currentSort={sort}
        storeTheme={storeThemeConfig}
      />
    </>
  );
}
