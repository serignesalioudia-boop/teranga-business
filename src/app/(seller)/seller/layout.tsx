import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SellerSidebar } from "@/components/seller/seller-sidebar";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export const metadata = { title: "Vendeur — Teranga Business" };

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sellerProfile: any = null;
  try {
    sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });
  } catch (e) {
    console.error("[SellerLayout] DB error:", e);
  }

  if (sellerProfile?.status === "ACTIVE") {
    return (
      <div className="flex min-h-screen">
        <SellerSidebar />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    );
  }

  // No profile or not active → redirect to become-seller
  if (!sellerProfile || (sellerProfile.status !== "ACTIVE" && sellerProfile.status !== "SUSPENDED" && sellerProfile.status !== "REJECTED")) {
    redirect("/account/become-seller");
  }

  // Suspended or rejected
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <AlertTriangle className="size-12 text-orange-500" />
      <h1 className="text-2xl font-bold">Espace vendeur indisponible</h1>
      <p className="max-w-md text-muted-foreground">
        {sellerProfile?.status === "SUSPENDED"
          ? "Votre compte vendeur a été suspendu."
          : sellerProfile?.status === "REJECTED"
            ? "Votre candidature a été refusée."
            : "Vous n'avez pas de compte vendeur."}
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/account/become-seller">
            {sellerProfile ? "Recréer ma boutique" : "Devenir vendeur"}
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}
