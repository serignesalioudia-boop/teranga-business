"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { User, LogOut, Shield, Store } from "lucide-react";

export function ProfileMenu({
  userName,
  isAdmin,
  sellerStatus,
}: {
  userName: string | null;
  isAdmin: boolean;
  sellerStatus: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-accent"
      >
        <User className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border bg-popover p-1.5 shadow-lg">
          <div className="border-b px-3 py-2.5">
            <p className="text-sm font-semibold truncate">{userName || "Utilisateur"}</p>
          </div>

          <div className="py-1.5">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
            >
              <User className="h-4 w-4" />
              Mon profil
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
            >
              <Store className="h-4 w-4" />
              Mes commandes
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
            {sellerStatus === "ACTIVE" ? (
              <Link
                href="/seller"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
              >
                <Store className="h-4 w-4" />
                Espace vendeur
              </Link>
            ) : (
              <Link
                href="/account/become-seller"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
              >
                <Store className="h-4 w-4" />
                Devenir vendeur
              </Link>
            )}
          </div>

          <div className="border-t py-1.5">
            <button
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/login" });
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
