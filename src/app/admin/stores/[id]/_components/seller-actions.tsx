"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approveSeller, rejectSeller } from "@/server/actions/stores";

type Props = {
  storeId: string;
  currentStatus: string;
};

export function SellerActions({ storeId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  function handleApprove() {
    startTransition(async () => {
      await approveSeller(storeId);
      router.refresh();
    });
  }

  function handleReject() {
    if (!showRejectReason) {
      setShowRejectReason(true);
      return;
    }
    startTransition(async () => {
      await rejectSeller(storeId, reason || undefined);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {currentStatus !== "ACTIVE" && (
          <Button
            onClick={handleApprove}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            Approuver le vendeur
          </Button>
        )}
        {currentStatus !== "REJECTED" && (
          <Button
            onClick={handleReject}
            disabled={isPending}
            variant="destructive"
          >
            {showRejectReason ? "Confirmer le rejet" : "Rejeter le vendeur"}
          </Button>
        )}
        {showRejectReason && (
          <Button
            onClick={() => { setShowRejectReason(false); setReason(""); }}
            variant="ghost"
            disabled={isPending}
          >
            Annuler
          </Button>
        )}
      </div>

      {showRejectReason && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reject-reason" className="text-sm font-medium">
            Motif du rejet (optionnel)
          </label>
          <textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Expliquez la raison du rejet…"
            className="w-full max-w-md rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      )}
    </div>
  );
}
