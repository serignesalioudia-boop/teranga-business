import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { BecomeSellerForm } from "@/components/seller/become-seller-form";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";


export const metadata = { title: "Devenir vendeur — Teranga Business" };

const STATUS_CONFIG = {
  REJECTED: {
    label: "Refusé",
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-200",
    description:
      "Votre boutique a été refusée. Vous pouvez corriger les informations et créer une nouvelle.",
  },
  SUSPENDED: {
    label: "Suspendu",
    icon: XCircle,
    color: "bg-orange-100 text-orange-800 border-orange-200",
    description:
      "Votre boutique a été suspendue. Vous pouvez en créer une nouvelle.",
  },
} as const;

export default async function BecomeSellerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/account/become-seller");

  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
    include: { store: { select: { name: true, slug: true } } },
  });

  // Already active seller → redirect to dashboard
  if (profile?.status === "ACTIVE") {
    redirect("/seller");
  }

  // Rejected or suspended → show reactivation form
  if (profile && (profile.status === "REJECTED" || profile.status === "SUSPENDED")) {
    const config = STATUS_CONFIG[profile.status];
    const Icon = config.icon;

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Devenir vendeur</h1>

        <div className={`flex items-start gap-4 rounded-xl border p-6 ${config.color}`}>
          <Icon className="mt-0.5 size-6 shrink-0" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="font-bold">Statut : {config.label}</h2>
              {profile.store && (
                <Badge variant="outline">{profile.store.name}</Badge>
              )}
            </div>
            <p className="text-sm">{config.description}</p>
          </div>
        </div>

        {profile.verificationNote && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">Motif :</p>
            <p className="text-sm text-red-700">{profile.verificationNote}</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <BecomeSellerForm />
          <div className="flex items-center">
            <Button asChild variant="ghost">
              <Link href="/">Retour à l&apos;accueil</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No profile → show creation form
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Devenir vendeur</h1>
        <p className="mt-1 text-muted-foreground">
          Créez votre boutique et commencez à vendre sur Teranga Business.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <BecomeSellerForm />
        </div>

        <div className="space-y-4 rounded-xl border bg-muted/30 p-6">
          <h3 className="font-bold">Comment ça marche ?</h3>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                1
              </span>
              <span>
                <strong className="text-foreground">Remplissez le formulaire</strong> avec
                le nom et la description de votre boutique.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                2
              </span>
              <span>
                <strong className="text-foreground">Votre boutique est créée</strong> et
                vous accédez immédiatement à votre espace vendeur.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                3
              </span>
              <span>
                <strong className="text-foreground">Publiez vos produits</strong> avec
                photos, prix et descriptions.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                4
              </span>
              <span>
                <strong className="text-foreground">Recevez des commandes</strong> et
                gérez vos ventes depuis votre tableau de bord.
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
