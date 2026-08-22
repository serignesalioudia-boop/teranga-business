import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getStoreBySlug, getStoreProducts, getStoreCategories } from "@/server/actions/stores";
import { getFavoriteIds } from "@/server/actions/favorites";
import { ProductCard } from "@/components/product/product-card";
import { StoreLayout } from "../../_components/store-layout";
import { StoreFilters } from "../../_components/store-filters";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string; catSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, catSlug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return { title: "Boutique introuvable" };

  const categories = await getStoreCategories(store.id);
  const cat = categories.find((c) => c.slug === catSlug);

  return {
    title: `${cat?.name ?? catSlug} — ${store.name}`,
    description: `Produits ${cat?.name ?? catSlug} dans la boutique ${store.name}`,
  };
}

export default async function StoreCategoryPage({ params, searchParams }: Props) {
  const { slug, catSlug } = await params;
  const sp = await searchParams;

  const [store, favoriteIds] = await Promise.all([
    getStoreBySlug(slug),
    getFavoriteIds(),
  ]);
  if (!store) notFound();
  const favSet = new Set(favoriteIds);

  const categories = await getStoreCategories(store.id);
  const category = categories.find((c) => c.slug === catSlug);
  if (!category) notFound();

  const search = typeof sp.search === "string" ? sp.search : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";

  const products = await getStoreProducts(store.id, {
    categoryId: category.id,
    search,
    sort,
  });

  return (
    <StoreLayout
      store={{
        name: store.name,
        slug: store.slug,
        logoUrl: store.logoUrl,
        whatsapp: store.whatsapp,
      }}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: c._count.products,
      }))}
    >
      <Link href={`/store/${store.slug}/products?category=${category.id}`} className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-[#cbd5e1] bg-white px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#24160c] transition hover:border-[#c8922d] hover:bg-[#fff7e6] hover:text-[#c8922d] mb-3 sm:mb-4">
        <ArrowLeft className="size-3.5 sm:size-4" />
        Retour
      </Link>
      <h1 className="mb-4 text-xl font-bold">{category.name}</h1>

      <StoreFilters
        storeSlug={store.slug}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          count: c._count.products,
        }))}
        currentCategory={category.id}
        currentSearch={search}
        currentSort={sort}
      />

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} favoriteIds={favSet} subtitle="category" />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg">Aucun produit dans cette catégorie.</p>
          <Link href={`/store/${store.slug}`} className="mt-2 text-sm text-primary hover:underline">
            Voir tous les produits
          </Link>
        </div>
      )}
    </StoreLayout>
  );
}
