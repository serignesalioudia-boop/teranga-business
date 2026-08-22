"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { updateOrderStatus } from "@/server/actions/orders";
import { VALID_ORDER_TRANSITIONS } from "@/lib/order-status";

export function StatusActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = VALID_ORDER_TRANSITIONS[currentStatus] ?? [];

  if (allowed.length === 0) return null;

  async function handleStatus(status: string) {
    setPending(true);
    setError(null);
    try {
      await updateOrderStatus(orderId, status);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border p-4">
      <span className="text-sm font-medium">Actions :</span>
      {allowed.includes("CONFIRMED") && (
        <Button size="sm" onClick={() => handleStatus("CONFIRMED")} disabled={pending}>
          {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />}
          Confirmer
        </Button>
      )}
      {allowed.includes("CANCELLED") && (
        <Button size="sm" variant="destructive" onClick={() => handleStatus("CANCELLED")} disabled={pending}>
          {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <XCircle className="mr-1 h-4 w-4" />}
          Annuler
        </Button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
