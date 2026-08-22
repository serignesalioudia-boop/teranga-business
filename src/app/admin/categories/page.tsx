export const dynamic = "force-dynamic";

import Link from "next/link";
import { getCategories } from "@/server/actions/categories";
import { Button } from "@/components/ui/button";
import { CategoryTable } from "./_components/category-table";


export const metadata = { title: "Gestion des catégories — Admin" };

type Props = { searchParams: Promise<{ search?: string }> };

export default async function AdminCategoriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const categories = await getCategories(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Catégories</h1>
        <Button asChild>
          <Link href="/admin/categories/new">Nouvelle catégorie</Link>
        </Button>
      </div>
      <CategoryTable categories={categories} search={params.search} />
    </div>
  );
}
