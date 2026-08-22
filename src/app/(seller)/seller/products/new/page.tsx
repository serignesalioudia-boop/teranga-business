export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCategories } from "@/server/actions/categories";
import { getSellerStore } from "@/server/actions/seller-stats";
import { ProductForm } from "@/components/product/product-form";


export const metadata = { title: "Nouveau produit — Vendeur — Teranga Business" };

export default async function SellerNewProductPage() {
  let store;
  try {
    const result = await getSellerStore();
    store = result.store;
  } catch {
    redirect("/");
  }

  const categories = await getCategories(true);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nouveau produit</h1>
      <ProductForm stores={[store]} categories={categories} />
    </div>
  );
}
