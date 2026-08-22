import Link from "next/link";
import { getSellerStore } from "@/server/actions/seller-store";
import { StoreSettingsForm } from "@/components/seller/store-settings-form";
import { SellerPlanCard } from "@/components/seller/seller-plan-card";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ExternalLink } from "lucide-react";
import { CopyUrlButton } from "@/components/seller/copy-url-button";


export const metadata = {
  title: "Paramètres boutique — Vendeur",
};

export default async function SellerSettingsPage() {
  const store = await getSellerStore();
  const user = await getCurrentUser();

  let sellerProfile = null;
  if (user) {
    sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { plan: true, planExpiresAt: true },
    });
  }

  const storeUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/store/${store.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Paramètres de la boutique</h1>
        <Link
          href={`/store/${store.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-accent"
        >
          <ExternalLink className="h-4 w-4" />
          Voir ma boutique
        </Link>
      </div>

      {/* URL de la boutique */}
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">URL de votre boutique</p>
        <div className="mt-1 flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm font-mono">
            {storeUrl}
          </code>
          <CopyUrlButton url={storeUrl} />
        </div>
      </div>

      {sellerProfile && (
        <section className="rounded-xl border bg-card p-6">
          <SellerPlanCard
            currentPlan={sellerProfile.plan}
            planExpiresAt={sellerProfile.planExpiresAt}
            storeId={store.id}
          />
        </section>
      )}

      <section className="rounded-xl border bg-card p-6">
        <StoreSettingsForm store={store} />
      </section>
    </div>
  );
}
