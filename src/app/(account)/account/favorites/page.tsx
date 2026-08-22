import Link from "next/link";
import { getUserFavorites } from "@/server/actions/favorites";
import { ProductCard } from "@/components/product/product-card";
import { Heart } from "lucide-react";


export const metadata = {
  title: "Mes favoris — Teranga Business",
};

export default async function FavoritesPage() {
  const products = await getUserFavorites();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Mes favoris{" "}
        <span className="text-sm font-normal text-muted-foreground">
          ({products.length})
        </span>
      </h1>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <Heart className="h-12 w-12" />
          <p className="text-lg">Aucun produit en favori.</p>
          <Link
            href="/products"
            className="text-sm text-primary hover:underline"
          >
            Explorer les produits
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} favoriteIds={new Set(products.map((x) => x.id))} />
          ))}
        </div>
      )}
    </div>
  );
}
