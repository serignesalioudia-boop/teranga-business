export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getProductById, getProductMedia } from "@/server/actions/products";
import { getCategories } from "@/server/actions/categories";
import { getStores } from "@/server/actions/products";
import { ProductForm } from "@/components/product/product-form";


export const metadata = { title: "Modifier le produit — Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, stores, media] = await Promise.all([
    getProductById(id),
    getCategories(true),
    getStores(),
    getProductMedia(id),
  ]);

  if (!product) notFound();

  const serializedProduct = {
    ...product,
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Modifier « {product.name} »</h1>
      <ProductForm
        product={serializedProduct}
        stores={stores}
        categories={categories}
        existingMedia={media}
      />
    </div>
  );
}
