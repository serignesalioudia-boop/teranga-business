import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SellerSidebar } from "@/components/seller/seller-sidebar";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <Store className="size-12 text-primary" />
      <h1 className="text-2xl font-bold">Devenir vendeur</h1>
      <p className="max-w-md text-muted-foreground">
        Créez votre boutique et commencez à vendre sur Teranga Business.
      </p>
      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/account/become-seller">
            <Store className="mr-2 size-4" />
            Créer ma boutique
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}
