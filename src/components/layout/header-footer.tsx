import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./mobile-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { GlobalSearch } from "@/components/search/global-search";
import { Logo } from "@/components/layout/logo";
import { Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ProfileMenu } from "@/components/auth/profile-menu";

export async function Header() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === Role.ADMIN;

  let sellerStatus: string | null = null;
  if (session?.user?.id) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      select: { status: true },
    });
    sellerStatus = profile?.status ?? null;
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="shrink-0 flex items-center gap-2">
          <Image
            src="/logo.jpeg"
            alt="Logo"
            width={32}
            height={32}
            className="rounded-full object-contain"
          />
          <span className="text-sm sm:text-lg font-bold">
            <span className="text-[#c8922d]">Teranga </span>
            <span className="text-green-700">Business</span>
          </span>
        </Link>

        <div className="hidden md:block mx-auto max-w-md w-full">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />

          <nav className="hidden items-center gap-2 text-sm md:flex">
            <Link href="/" className="flex items-center gap-1.5 rounded-md px-3 py-2 transition hover:bg-accent">
              <Logo size="sm" />
              Accueil
            </Link>
            <Link href="/shop" className="flex items-center gap-1.5 rounded-md px-3 py-2 transition hover:bg-accent">
              <Store className="size-4" />
              Boutique
            </Link>
          </nav>

          {session ? (
            <ProfileMenu
              userName={session.user?.name ?? null}
              isAdmin={isAdmin}
              sellerStatus={sellerStatus}
            />
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Connexion</Link>
            </Button>
          )}
        </div>

        <MobileMenu
          isLoggedIn={!!session}
          isAdmin={isAdmin}
          sellerStatus={sellerStatus}
          userName={session?.user?.name ?? null}
        />
      </div>
    </header>
  );
}

export async function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 text-sm text-muted-foreground">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image
                src="/logo.jpeg"
                alt="Logo"
                width={28}
                height={28}
                className="rounded-full object-contain"
              />
              <h3 className="font-semibold text-foreground">Teranga Business</h3>
            </div>
            <p>La marketplace des commerçants</p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-foreground">Navigation</h3>
            <ul className="space-y-1 text-xs sm:text-sm">
              <li><Link href="/" className="hover:text-primary">Accueil</Link></li>
              <li><Link href="/shop" className="hover:text-primary">Boutique</Link></li>
              <li><Link href="/categories" className="hover:text-primary">Catégories</Link></li>
              <li><Link href="/create-store" className="hover:text-primary">Devenir vendeur</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-foreground">Compte</h3>
            <ul className="space-y-1 text-xs sm:text-sm">
              <li><Link href="/login" className="hover:text-primary">Connexion</Link></li>
              <li><Link href="/register" className="hover:text-primary">Inscription</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-foreground">Contact</h3>
            <p className="text-xs sm:text-sm">Dakar, Sénégal</p>
            <p className="text-xs sm:text-sm">serignesalioudia903@gmail.com</p>
            <p className="text-xs sm:text-sm">+221 76 514 99 10</p>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 border-t pt-4 text-center text-[10px] sm:text-xs">
          © {new Date().getFullYear()} Teranga Business. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
