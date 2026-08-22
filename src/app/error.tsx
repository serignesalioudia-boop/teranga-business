"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur globale:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-bold">Oups ! Une erreur est survenue</h2>
      <p className="text-muted-foreground">
        {error.message || "Quelque chose s'est mal passé. Veuillez réessayer."}
      </p>
      <Button onClick={reset} variant="default">
        Réessayer
      </Button>
    </div>
  );
}
