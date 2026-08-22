"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createAddress,
  updateAddress,
  type AddressInput,
} from "@/server/actions/addresses";

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  country: string;
  region: string;
  city: string;
  addressLine: string;
  isDefault: boolean;
};

export function AddressForm({
  address,
  onDone,
}: {
  address?: Address;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const fd = new FormData(e.currentTarget);
    const input: AddressInput = {
      label: String(fd.get("label") ?? ""),
      fullName: String(fd.get("fullName") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      country: String(fd.get("country") ?? "SN"),
      region: String(fd.get("region") ?? ""),
      city: String(fd.get("city") ?? ""),
      addressLine: String(fd.get("addressLine") ?? ""),
      isDefault: fd.get("isDefault") === "on",
    };

    try {
      if (address) {
        await updateAddress(address.id, input);
      } else {
        await createAddress(input);
      }
      onDone?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="label" className="text-sm font-medium">Label</label>
          <input
            id="label"
            name="label"
            required
            placeholder="Maison, Bureau..."
            defaultValue={address?.label ?? ""}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-sm font-medium">Nom complet</label>
          <input
            id="fullName"
            name="fullName"
            required
            placeholder="Prénom Nom"
            defaultValue={address?.fullName ?? ""}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-sm font-medium">Téléphone</label>
          <input
            id="phone"
            name="phone"
            required
            placeholder="+221 77 123 45 67"
            defaultValue={address?.phone ?? ""}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="region" className="text-sm font-medium">Région</label>
          <input
            id="region"
            name="region"
            required
            placeholder="Dakar"
            defaultValue={address?.region ?? ""}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="city" className="text-sm font-medium">Ville</label>
          <input
            id="city"
            name="city"
            required
            placeholder="Dakar"
            defaultValue={address?.city ?? ""}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="country" className="text-sm font-medium">Pays</label>
          <input
            id="country"
            name="country"
            defaultValue={address?.country ?? "SN"}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="addressLine" className="text-sm font-medium">Adresse</label>
        <input
          id="addressLine"
          name="addressLine"
          required
          placeholder="Quartier, rue, repère..."
          defaultValue={address?.addressLine ?? ""}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={address?.isDefault ?? false}
          className="h-4 w-4 rounded border-input"
        />
        Définir comme adresse par défaut
      </label>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
          {address ? "Mettre à jour" : "Enregistrer"}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            <X className="mr-1 h-4 w-4" />
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
