export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getProductBySlug } from "@/server/actions/products";
import { getStoreBySlug } from "@/server/actions/stores";
import { getCategoryBySlug } from "@/server/actions/categories";
import { SharePage } from "@/components/social/share-page";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ type: string; slug: string }>;
};


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, slug } = await params;

  if (type === "product") {
    const product = await getProductBySlug(slug);
    if (!product) return { title: "Produit introuvable" };
    return {
      title: `Partager ${product.name} — Teranga Business`,
      description: product.description?.slice(0, 160) ?? `Partagez ${product.name}`,
    };
  }

  if (type === "store") {
    const store = await getStoreBySlug(slug);
    if (!store) return { title: "Boutique introuvable" };
    return {
      title: `Partager ${store.name} — Teranga Business`,
      description: store.description ?? `Partagez la boutique ${store.name}`,
    };
  }

  if (type === "category") {
    const category = await getCategoryBySlug(slug);
    if (!category) return { title: "Catégorie introuvable" };
    return {
      title: `Partager ${category.name} — Teranga Business`,
      description: category.description ?? `Partagez la catégorie ${category.name}`,
    };
  }

  return { title: "Partager — Teranga Business" };
}

export default async function ShareRoute({ params }: Props) {
  const { type, slug } = await params;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (type === "product") {
    const product = await getProductBySlug(slug);
    if (!product) notFound();

    return (
      <SharePage
        targetType="PRODUCT"
        targetId={product.id}
        targetSlug={product.slug}
        title={product.name}
        description={product.description ?? undefined}
        imageUrl={product.media[0]?.url}
        url={`${baseUrl}/product/${product.slug}`}
      />
    );
  }

  if (type === "store") {
    const store = await getStoreBySlug(slug);
    if (!store) notFound();

    return (
      <SharePage
        targetType="STORE"
        targetId={store.id}
        targetSlug={store.slug}
        title={store.name}
        description={store.description ?? undefined}
        imageUrl={store.logoUrl ?? store.bannerUrl ?? undefined}
        url={`${baseUrl}/store/${store.slug}`}
      />
    );
  }

  if (type === "category") {
    const category = await getCategoryBySlug(slug);
    if (!category) notFound();

    return (
      <SharePage
        targetType="CATEGORY"
        targetId={category.id}
        targetSlug={category.slug}
        title={category.name}
        description={category.description ?? undefined}
        imageUrl={category.imageUrl ?? undefined}
        url={`${baseUrl}/category/${category.slug}`}
      />
    );
  }

  notFound();
}
