import { notFound } from "next/navigation";
import { getStoreById } from "@/server/actions/stores";
import { StoreForm } from "@/components/admin/store-form";
import { SellerActions } from "./_components/seller-actions";
import { Badge } from "@/components/ui/badge";


export const metadata = { title: "Modifier la boutique — Admin" };

export default async function EditStorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await getStoreById(id);

  if (!store) notFound();

  const statusLabels: Record<string, string> = {
    PENDING: "En attente",
    ACTIVE: "Approuvé",
    SUSPENDED: "Suspendu",
    REJECTED: "Rejeté",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Modifier « {store.name} »</h1>
      <p className="text-sm text-muted-foreground">
        Vendeur : {store.sellerProfile.user.name} ({store.sellerProfile.user.email})
      </p>

      <div className="flex items-center gap-3">
        <Badge
          variant={
            store.sellerProfile.status === "ACTIVE"
              ? "default"
              : store.sellerProfile.status === "REJECTED"
                ? "destructive"
                : "secondary"
          }
        >
          {statusLabels[store.sellerProfile.status] ?? store.sellerProfile.status}
        </Badge>
        {store.sellerProfile.isVerified && (
          <Badge variant="outline">Vérifié</Badge>
        )}
      </div>

      <SellerActions
        storeId={store.id}
        currentStatus={store.sellerProfile.status}
      />

      <StoreForm
        store={{
          id: store.id,
          name: store.name,
          description: store.description,
          whatsapp: store.whatsapp,
          isActive: store.isActive,
        }}
      />
    </div>
  );
}
