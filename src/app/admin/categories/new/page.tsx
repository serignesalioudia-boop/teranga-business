import { getCategories } from "@/server/actions/categories";
import { CategoryForm } from "@/components/category/category-form";


export const metadata = { title: "Nouvelle catégorie — Admin" };

export default async function NewCategoryPage() {
  const categories = await getCategories(true);
  const parents = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nouvelle catégorie</h1>
      <CategoryForm parents={parents} />
    </div>
  );
}
