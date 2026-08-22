import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getSellerStore } from "@/server/actions/seller-store";
import { StoreSettingsForm } from "@/components/seller/store-settings-form";
import { SellerPlanCard } from "@/components/seller/seller-plan-card";
import { CopyUrlButton } from "@/components/seller/copy-url-button";
import { ExternalLink, Eye, Settings } from "lucide-react";


export const metadata = {
  title: "Ma Boutique — Teranga Business",
};

export default async function ShopPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/shop");

  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
    select: { plan: true, planExpiresAt: true, status: true },
  });

  if (!profile || profile.status !== "ACTIVE") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Aucune boutique</h1>
        <p className="mt-2 text-muted-foreground">
          Vous devez créer une boutique pour accéder à cette page.
        </p>
        <Link
          href="/create-store"
          className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Créer ma boutique
        </Link>
      </div>
    );
  }

  const store = await getSellerStore();
  const storeUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/store/${store.slug}`;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ma Boutique</h1>
          <p className="text-sm text-muted-foreground">
            Aperçu et réglages de votre mini-site.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/store/${store.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-accent"
          >
            <ExternalLink className="h-4 w-4" />
            Voir ma boutique
          </Link>
        </div>
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

      {/* Aperçu du mini-site */}
      <section className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Aperçu du mini-site</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Voici comment votre boutique apparaît aux clients.
        </p>
        <div className="overflow-hidden rounded-lg border">
          <iframe
            src={`/store/${store.slug}`}
            className="h-[500px] w-full border-0"
            title="Aperçu mini-site"
          />
        </div>
      </section>

      {/* Plan vendeur */}
      {profile && (
        <section className="rounded-xl border bg-card p-6">
          <SellerPlanCard
            currentPlan={profile.plan}
            planExpiresAt={profile.planExpiresAt}
            storeId={store.id}
          />
        </section>
      )}

      {/* Réglages */}
      <section className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Réglages de la boutique</h2>
        </div>
        <StoreSettingsForm store={store} />
      </section>
    </div>
  );
}
