import Link from "next/link";
import { getCategories } from "@/server/actions/categories";


export const dynamic = "force-dynamic";

export const metadata = {
  title: "Catégories — Teranga Business",
  description: "Explorez toutes les catégories de produits disponibles.",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Catégories</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="group flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition hover:shadow-md"
          >
            {cat.imageUrl ? (
              <img
                src={cat.imageUrl}
                alt={cat.name}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl">{cat.icon || "📂"}</span>
            )}
            <span className="font-medium group-hover:text-primary">{cat.name}</span>
            {cat.description && (
              <span className="line-clamp-2 text-xs text-muted-foreground">
                {cat.description}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {cat._count.products} produits
              {cat._count.children > 0 &&
                ` · ${cat._count.children} sous-catégories`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
