"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin/orders", label: "Commandes" },
  { href: "/admin/deliveries", label: "Livraisons" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/products", label: "Produits" },
  { href: "/admin/stores", label: "Boutiques" },
  { href: "/admin/reviews", label: "Avis" },
  { href: "/admin/commissions", label: "Commissions" },
  { href: "/admin/refunds", label: "Remboursements" },
  { href: "/admin/audit-logs", label: "Journal d'audit" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings", label: "Paramètres" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-2 z-50 md:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Menu admin"
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
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 border-r bg-muted/40 p-4 transition-transform
          md:static md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Link
          href="/admin"
          className="mb-6 block text-lg font-bold"
          onClick={() => setOpen(false)}
        >
          Admin
        </Link>
        <nav className="space-y-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 transition ${
                pathname.startsWith(link.href)
                  ? "bg-accent font-medium"
                  : "hover:bg-accent"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t pt-4">
          <Link
            href="/"
            className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            ← Retour au site
          </Link>
        </div>
      </aside>
    </>
  );
}
