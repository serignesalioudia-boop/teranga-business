"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Truck, PackageCheck } from "lucide-react";
import { updateSubOrderStatus } from "@/server/actions/orders";
import { VALID_SUBORDER_TRANSITIONS } from "@/lib/order-status";

export function SubOrderActions({ subOrderId, currentStatus }: { subOrderId: string; currentStatus: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = VALID_SUBORDER_TRANSITIONS[currentStatus] ?? [];

  async function handleSubOrderStatus(status: string) {
    setPending(true);
    setError(null);
    try {
      await updateSubOrderStatus(subOrderId, status);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  async function handleShip() {
    setPending(true);
    setError(null);
    try {
      await updateSubOrderStatus(subOrderId, "PROCESSING");
      await updateSubOrderStatus(subOrderId, "SHIPPED");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  if (allowed.length === 0) return null;

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Actions :</span>
        {allowed.includes("ACCEPTED") && (
          <Button size="sm" onClick={() => handleSubOrderStatus("ACCEPTED")} disabled={pending}>
            {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />}
            Accepter
          </Button>
        )}
        {allowed.includes("REJECTED") && (
          <Button size="sm" variant="destructive" onClick={() => handleSubOrderStatus("REJECTED")} disabled={pending}>
            {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <XCircle className="mr-1 h-4 w-4" />}
            Refuser
          </Button>
        )}
        {allowed.includes("PROCESSING") && (
          <Button size="sm" onClick={handleShip} disabled={pending}>
            {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Truck className="mr-1 h-4 w-4" />}
            Expédier
          </Button>
        )}
        {allowed.includes("SHIPPED") && (
          <Button size="sm" onClick={() => handleSubOrderStatus("DELIVERED")} disabled={pending}>
            {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-1 h-4 w-4" />}
            Livrée
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
