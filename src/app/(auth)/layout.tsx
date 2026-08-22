import type { ReactNode } from "react";
import Link from "next/link";
import { Store } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2.5 text-primary"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
            <Store className="size-5" aria-hidden />
          </span>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Teranga Business
          </span>
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );
}
