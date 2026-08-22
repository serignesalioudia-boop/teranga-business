import Link from "next/link";
import { redirect } from "next/navigation";
import { getSellerCategories } from "@/server/actions/categories";
import { Package } from "lucide-react";

export const metadata = { title: "Mes catégories — Vendeur — Teranga Business" };

export default async function SellerCategoriesPage() {
  let categories;
  try {
    categories = await getSellerCategories();
  } catch {
    redirect("/");
  }

  const usedCategories = categories.filter((c) => c.myProductCount > 0);
  const unusedCategories = categories.filter((c) => c.myProductCount === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Catégories{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({usedCategories.length} utilisées / {categories.length} total)
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Répartissez vos produits par catégorie pour faciliter leur découverte.
        </p>
      </div>

      {usedCategories.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Mes catégories</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {usedCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/seller/products?category=${cat.slug}`}
                className="flex items-center gap-4 rounded-lg border bg-card p-4 transition hover:shadow-md"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Package className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{cat.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {cat.myProductCount} produit{cat.myProductCount > 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {cat.myProductCount}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {unusedCategories.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-muted-foreground">
            Catégories disponibles
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unusedCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-4 rounded-lg border border-dashed bg-muted/30 p-4 opacity-60"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Package className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{cat.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Aucun produit
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {categories.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Package className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Aucune catégorie disponible.</p>
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          Les catégories sont gérées par l&apos;administrateur.{" "}
          <Link href="/seller/products/new" className="text-primary hover:underline">
            Créez un produit
          </Link>{" "}
          pour assigner une catégorie.
        </p>
      </div>
    </div>
  );
}
