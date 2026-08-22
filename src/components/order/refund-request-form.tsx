"use client";

import { useActionState } from "react";
import { requestRefund } from "@/server/actions/refunds";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";

type FormState = { error?: string; success?: boolean };

async function handleRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await requestRefund({
      subOrderId: formData.get("subOrderId") as string,
      reason: formData.get("reason") as string,
    });
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur." };
  }
}

export function RefundRequestForm({ subOrderId }: { subOrderId: string }) {
  const [state, formAction, pending] = useActionState(handleRequest, {});
  const [open, setOpen] = useState(false);

  if (state.success) {
    return (
      <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-600">
        Demande de remboursement envoyée. Vous serez notifié de la décision.
      </div>
    );
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <AlertTriangle className="mr-1 size-3.5" />
        Demander un remboursement
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border p-4">
      <input type="hidden" name="subOrderId" value={subOrderId} />

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="space-y-2">
        <label htmlFor="reason" className="text-sm font-medium">
          Raison du remboursement
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          required
          minLength={10}
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Décrivez le problème (produit défectueux, non reçu, etc.)"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="destructive" size="sm" disabled={pending}>
          {pending ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : null}
          Confirmer la demande
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
