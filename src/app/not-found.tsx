import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground">404</p>
      <h2 className="text-2xl font-bold">Page introuvable</h2>
      <p className="text-muted-foreground">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Button asChild variant="default">
        <Link href="/">Retour à l&apos;accueil</Link>
      </Button>
    </div>
  );
}
