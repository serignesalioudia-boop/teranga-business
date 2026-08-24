"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { LogOut, Store, User, Shield, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function MobileMenu({
  isLoggedIn,
  isAdmin,
  sellerStatus,
  userName,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
  sellerStatus: string | null;
  userName: string | null;
}) {
  const [open, setOpen] = useState(false);

  const initials = userName
    ? userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {open ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </Button>

      {open && (
        <div className="absolute left-0 right-0 top-14 z-50 border-b bg-background p-4 shadow-lg">
          <div className="mb-3 flex items-center gap-2 md:hidden">
            <div className="flex-1">
              <SearchBar />
            </div>
            <ThemeToggle />
          </div>
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              <Logo size="sm" />
              Accueil
            </Link>
            <Link
              href="/shop"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              <Store className="h-4 w-4" />
              Boutique
            </Link>

            {isLoggedIn && (
              <>
                <div className="my-1 border-t" />
                <Link
                  href="/account"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Mon profil
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  <Store className="h-4 w-4" />
                  Mes commandes
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                    onClick={() => setOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                )}
                {sellerStatus === "ACTIVE" ? (
                  <Link
                    href="/seller"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                    onClick={() => setOpen(false)}
                  >
                    <Store className="h-4 w-4" />
                    Espace vendeur
                  </Link>
                ) : (
                  <Link
                    href="/account/become-seller"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                    onClick={() => setOpen(false)}
                  >
                    <UserCircle className="h-4 w-4" />
                    Devenir vendeur
                  </Link>
                )}
                <div className="my-1 border-t" />
                <button
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </>
            )}

            {!isLoggedIn && (
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                Connexion
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
