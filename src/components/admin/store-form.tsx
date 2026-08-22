"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateStore, type StoreUpdateInput } from "@/server/actions/stores";

type Store = {
  id: string;
  name: string;
  description: string | null;
  whatsapp: string | null;
  isActive: boolean;
};

export function StoreForm({ store }: { store: Store }) {
  const router = useRouter();

  async function handleAction(_prev: unknown, formData: FormData) {
    const input: StoreUpdateInput = {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      whatsapp: String(formData.get("whatsapp") ?? ""),
      isActive: formData.get("isActive") === "on",
    };

    try {
      await updateStore(store.id, input);
      router.push("/admin/stores");
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
          defaultValue={store.name}
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={store.description ?? ""}
          maxLength={500}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          defaultValue={store.whatsapp ?? ""}
          placeholder="+221770000000"
          maxLength={20}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          id="isActive"
          defaultChecked={store.isActive}
          className="h-4 w-4"
        />
        <Label htmlFor="isActive" className="font-normal">
          Actif
        </Label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
