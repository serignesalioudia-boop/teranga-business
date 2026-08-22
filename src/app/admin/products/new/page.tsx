export const dynamic = "force-dynamic";

import { getCategories } from "@/server/actions/categories";
import { getStores } from "@/server/actions/products";
import { ProductForm } from "@/components/product/product-form";


export const metadata = { title: "Nouveau produit — Admin" };

export default async function NewProductPage() {
  const [categories, stores] = await Promise.all([
    getCategories(true),
    getStores(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nouveau produit</h1>
      <ProductForm stores={stores} categories={categories} />
    </div>
  );
}
