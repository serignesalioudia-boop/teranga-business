import { notFound, redirect } from "next/navigation";
import { getProductById, getProductMedia } from "@/server/actions/products";
import { getCategories } from "@/server/actions/categories";
import { getSellerStore } from "@/server/actions/seller-stats";
import { ProductForm } from "@/components/product/product-form";

type Props = { params: Promise<{ id: string }> };


export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);
  return { title: `Modifier « ${product?.name ?? id} » — Vendeur — Teranga Business` };
}

export default async function SellerEditProductPage({ params }: Props) {
  const { id } = await params;

  let store;
  try {
    const result = await getSellerStore();
    store = result.store;
  } catch {
    redirect("/");
  }

  const [product, categories, media] = await Promise.all([
    getProductById(id),
    getCategories(true),
    getProductMedia(id),
  ]);

  if (!product || product.storeId !== store.id) notFound();

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
        stores={[store]}
        categories={categories}
        existingMedia={media}
      />
    </div>
  );
}
