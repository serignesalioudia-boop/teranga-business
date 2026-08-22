"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCategory,
  updateCategory,
  type CategoryInput,
} from "@/server/actions/categories";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
};

type Parent = { id: string; name: string; slug: string };

export function CategoryForm({
  category,
  parents,
}: {
  category?: Category;
  parents: Parent[];
}) {
  const router = useRouter();
  const isEdit = !!category;

  async function handleAction(_prev: unknown, formData: FormData) {
    const input: CategoryInput = {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? ""),
      icon: String(formData.get("icon") ?? ""),
      parentId: String(formData.get("parentId") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      isActive: formData.get("isActive") === "on",
    };

    try {
      if (isEdit) {
        await updateCategory(category.id, input);
      } else {
        await createCategory(input);
      }
      router.push("/admin/categories");
      router.refresh();
    } catch (e) {
      return String(e instanceof Error ? e.message : e);
    }
  }

  const [state, formAction, isPending] = useActionState(handleAction, null);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state && typeof state === "string" && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nom *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={category?.name}
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={category?.description ?? ""}
          maxLength={500}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="icon">Icône</Label>
          <Input
            id="icon"
            name="icon"
            defaultValue={category?.icon ?? ""}
            placeholder="ex: shirt"
            maxLength={50}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="imageUrl">URL image</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            defaultValue={category?.imageUrl ?? ""}
            type="url"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Catégorie parente</Label>
          <Select
            name="parentId"
            defaultValue={category?.parentId ?? ""}
          >
            <SelectTrigger>
              <SelectValue placeholder="Aucune (racine)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucune (racine)</SelectItem>
              {parents.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Ordre d&apos;affichage</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={category?.sortOrder ?? 0}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          id="isActive"
          defaultChecked={category?.isActive ?? true}
          className="h-4 w-4"
        />
        <Label htmlFor="isActive" className="font-normal">
          Actif
        </Label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isEdit ? "Enregistrer" : "Créer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
