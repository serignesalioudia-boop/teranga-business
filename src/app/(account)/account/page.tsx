export const dynamic = "force-dynamic";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, Clock, CheckCircle, XCircle, MapPin, Bell, Star, Heart, User } from "lucide-react";


export const metadata = {
  title: "Mon compte — Teranga Business",
};

const SELLER_STATUS_LABELS: Record<string, { label: string; icon: typeof Clock; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "En attente", icon: Clock, variant: "secondary" },
  ACTIVE: { label: "Vendeur actif", icon: CheckCircle, variant: "default" },
  REJECTED: { label: "Refusé", icon: XCircle, variant: "destructive" },
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  const sellerProfile = session?.user?.id
    ? await prisma.sellerProfile.findUnique({
        where: { userId: session.user.id },
        include: { store: { select: { name: true, slug: true } } },
      })
    : null;

  const orderCount = session?.user?.id
    ? await prisma.order.count({ where: { userId: session.user.id } })
    : 0;

  const reviewCount = session?.user?.id
    ? await prisma.review.count({ where: { userId: session.user.id } })
    : 0;

  const notificationCount = session?.user?.id
    ? await prisma.notification.count({ where: { userId: session.user.id, isRead: false } })
    : 0;

  const favoriteCount = session?.user?.id
    ? await prisma.favorite.count({ where: { userId: session.user.id } })
    : 0;

  const sellerStatus = sellerProfile ? SELLER_STATUS_LABELS[sellerProfile.status] : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mon compte</h1>

      {/* Profile card */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <h2 className="font-semibold">Profil</h2>
        <div className="grid gap-2 text-sm">
          <p><strong className="text-muted-foreground">Nom :</strong> {session?.user?.name ?? "—"}</p>
          <p><strong className="text-muted-foreground">Email :</strong> {session?.user?.email ?? "—"}</p>
          <p><strong className="text-muted-foreground">Rôle :</strong> {session?.user?.role ?? "—"}</p>
        </div>
      </div>

      {/* Seller status card */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Espace vendeur</h2>
          {sellerProfile && sellerStatus && (
            <Badge variant={sellerStatus.variant}>
              <sellerStatus.icon className="mr-1 size-3" />
              {sellerStatus.label}
            </Badge>
          )}
        </div>

        {sellerProfile?.status === "ACTIVE" && sellerProfile.store && (
          <div className="flex items-center gap-3 text-sm">
            <Store className="size-4 text-muted-foreground" />
            <span>{sellerProfile.store.name}</span>
            <Button asChild variant="ghost" size="sm">
              <Link href="/seller">Accéder →</Link>
            </Button>
          </div>
        )}

        {sellerProfile?.status === "PENDING" && (
          <p className="text-sm text-muted-foreground">
            Votre candidature est en cours d&apos;examen.
          </p>
        )}

        {sellerProfile?.status === "REJECTED" && (
          <div className="space-y-2">
            {sellerProfile.verificationNote && (
              <p className="text-sm text-destructive">{sellerProfile.verificationNote}</p>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="/account/become-seller">Soumettre une nouvelle candidature</Link>
            </Button>
          </div>
        )}

        {!sellerProfile && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Vous n&apos;avez pas encore de compte vendeur. Créez votre boutique et commencez à vendre !
            </p>
            <Button asChild size="sm">
              <Link href="/account/become-seller">
                <Store className="mr-1 size-4" />
                Devenir vendeur
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/account/profile" className="flex items-center gap-3 rounded-xl border bg-card p-4 transition hover:shadow-md">
          <User className="size-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Profil</p>
            <p className="text-sm font-semibold">Modifier</p>
          </div>
        </Link>
        <Link href="/account/orders" className="flex items-center gap-3 rounded-xl border bg-card p-4 transition hover:shadow-md">
          <MapPin className="size-5 text-muted-foreground" />
          <div>
            <p className="text-2xl font-bold">{orderCount}</p>
            <p className="text-xs text-muted-foreground">Commandes</p>
          </div>
        </Link>
        <Link href="/account/reviews" className="flex items-center gap-3 rounded-xl border bg-card p-4 transition hover:shadow-md">
          <Star className="size-5 text-muted-foreground" />
          <div>
            <p className="text-2xl font-bold">{reviewCount}</p>
            <p className="text-xs text-muted-foreground">Avis</p>
          </div>
        </Link>
        <Link href="/account/notifications" className="flex items-center gap-3 rounded-xl border bg-card p-4 transition hover:shadow-md">
          <Bell className="size-5 text-muted-foreground" />
          <div>
            <p className="text-2xl font-bold">{notificationCount}</p>
            <p className="text-xs text-muted-foreground">Notifications</p>
          </div>
        </Link>
        <Link href="/account/favorites" className="flex items-center gap-3 rounded-xl border bg-card p-4 transition hover:shadow-md">
          <Heart className="size-5 text-muted-foreground" />
          <div>
            <p className="text-2xl font-bold">{favoriteCount}</p>
            <p className="text-xs text-muted-foreground">Favoris</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
