import { notFound } from "next/navigation";
import { getCategories, getCategoryById } from "@/server/actions/categories";
import { CategoryForm } from "@/components/category/category-form";


export const metadata = { title: "Modifier la catégorie — Admin" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, allCategories] = await Promise.all([
    getCategoryById(id),
    getCategories(true),
  ]);

  if (!category) notFound();

  const parents = allCategories.filter(
    (c) => c.id !== id && !c.parentId,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Modifier « {category.name} »</h1>
      <CategoryForm category={category} parents={parents} />
    </div>
  );
}
