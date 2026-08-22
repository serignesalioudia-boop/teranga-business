"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressForm } from "@/components/checkout/address-form";
import { deleteAddress, setDefaultAddress } from "@/server/actions/addresses";

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

export function AddressesClient({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette adresse ?")) return;
    await deleteAddress(id);
    router.refresh();
  }

  async function handleSetDefault(id: string) {
    await setDefaultAddress(id);
    router.refresh();
  }

  const editingAddress = addresses.find((a) => a.id === editingId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes adresses</h1>
        <Button
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
        >
          <MapPin className="mr-1 h-4 w-4" />
          Nouvelle adresse
        </Button>
      </div>

      {(showForm || editingId) && (
        <div className="rounded-xl border p-4">
          <h3 className="mb-3 font-semibold">
            {editingAddress ? "Modifier l'adresse" : "Nouvelle adresse"}
          </h3>
          <AddressForm
            address={editingAddress}
            onDone={() => {
              setShowForm(false);
              setEditingId(null);
              router.refresh();
            }}
          />
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <p className="text-muted-foreground">
          Aucune adresse enregistrée. Ajoutez votre première adresse.
        </p>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex items-start justify-between rounded-xl border p-4"
            >
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        <Star className="h-3 w-3" /> Défaut
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {addr.fullName} — {addr.phone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {addr.addressLine}, {addr.city}, {addr.region}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                {!addr.isDefault && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSetDefault(addr.id)}
                    title="Définir par défaut"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingId(addr.id);
                    setShowForm(false);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(addr.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
