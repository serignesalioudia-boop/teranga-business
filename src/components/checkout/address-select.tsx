"use client";

import { MapPin, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  region: string;
  city: string;
  addressLine: string;
  isDefault: boolean;
};

export function AddressSelect({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
}: {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Adresse de livraison</h3>
        <Button variant="outline" size="sm" onClick={onAddNew}>
          <Plus className="mr-1 h-4 w-4" />
          Nouvelle
        </Button>
      </div>

      {addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune adresse enregistrée. Ajoutez une adresse pour continuer.
        </p>
      ) : (
        <div className="space-y-2">
          {addresses.map((addr) => (
            <label
              key={addr.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                selectedId === addr.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/30"
              }`}
            >
              <input
                type="radio"
                name="addressId"
                value={addr.id}
                checked={selectedId === addr.id}
                onChange={() => onSelect(addr.id)}
                className="mt-1 h-4 w-4"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      <Star className="h-3 w-3" /> Défaut
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {addr.fullName} — {addr.phone}
                </p>
                <p className="text-sm text-muted-foreground">
                  {addr.addressLine}, {addr.city}, {addr.region}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
