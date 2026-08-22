"use client";

import { useActionState } from "react";
import { processRefund } from "@/server/actions/refunds";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";

type FormState = { error?: string; success?: boolean };

export function RefundActions({ refundId }: { refundId: string }) {
  return (
    <div className="flex gap-1">
      <ProcessButton refundId={refundId} action="APPROVED" />
      <ProcessButton refundId={refundId} action="REJECTED" />
    </div>
  );
}

function ProcessButton({
  refundId,
  action,
}: {
  refundId: string;
  action: "APPROVED" | "REJECTED";
}) {
  const isApproved = action === "APPROVED";

  async function handleProcess(_prev: FormState, formData: FormData): Promise<FormState> {
    try {
      await processRefund(refundId, action);
      return { success: true };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Erreur." };
    }
  }

  const [state, formAction, pending] = useActionState(handleProcess, {});

  if (state.success) {
    return (
      <span className="text-xs text-green-600">
        {isApproved ? "Approuvé" : "Rejeté"}
      </span>
    );
  }

  return (
    <form action={formAction}>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <Button
        type="submit"
        variant={isApproved ? "default" : "destructive"}
        size="sm"
        disabled={pending}
      >
        {pending ? <Loader2 className="size-3 animate-spin" /> : isApproved ? <Check className="size-3" /> : <X className="size-3" />}
      </Button>
    </form>
  );
}
