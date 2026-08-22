import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";

const NAV = [
  { href: "/account", label: "Mon compte" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account/addresses", label: "Adresses" },
  { href: "/account/orders", label: "Commandes" },
  { href: "/account/reviews", label: "Mes avis" },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/account");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Mobile horizontal nav */}
      <div className="mb-6 -mx-4 overflow-x-auto px-4 md:hidden">
        <nav className="flex gap-1 pb-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent"
          >
            ← Retour
          </Link>
        </nav>
      </div>

      <div className="grid gap-8 md:grid-cols-4">
        {/* Desktop sidebar */}
        <aside className="hidden space-y-1 md:block md:col-span-1">
          <h2 className="mb-3 text-lg font-bold">Mon compte</h2>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </aside>

        {/* Contenu */}
        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  );
}
