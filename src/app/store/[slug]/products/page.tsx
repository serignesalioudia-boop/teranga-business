export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getStoreBySlug, getStoreProducts, getStoreCategories } from "@/server/actions/stores";
import { getFavoriteIds } from "@/server/actions/favorites";
import { getStoreThemeConfig } from "@/lib/store-theme";
import { StoreProductsPage } from "../_components/store-products-page";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return { title: "Boutique introuvable" };
  return {
    title: `Produits — ${store.name}`,
    description: `Tous les produits de la boutique ${store.name}`,
  };
}

export default async function StoreProducts({ params, searchParams }: Props) {
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

  const [rawProducts, categories] = await Promise.all([
    getStoreProducts(store.id, { categoryId: categoryFilter, search, sort }),
    getStoreCategories(store.id),
  ]);

  const products = rawProducts.map((p) => ({
    ...p,
    price: Number(p.price),
    discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,
    ratingAvg: p.ratingAvg != null ? Number(p.ratingAvg) : null,
  }));

  const storeThemeConfig = getStoreThemeConfig(store.storeTheme);

  return (
    <StoreProductsPage
      store={{
        name: store.name,
        slug: store.slug,
        description: store.description,
        logoUrl: store.logoUrl,
        whatsapp: store.whatsapp,
      }}
      products={products}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: c._count.products,
      }))}
      favoriteIds={favSet}
      currentCategory={categoryFilter}
      currentSearch={search}
      currentSort={sort}
      storeTheme={storeThemeConfig}
    />
  );
}
