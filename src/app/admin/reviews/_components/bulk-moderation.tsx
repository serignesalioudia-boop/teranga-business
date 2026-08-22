"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { bulkModerateReviews } from "@/server/actions/reviews";

type Props = {
  selectedIds: string[];
  onClear: () => void;
};

export function BulkModerationBar({ selectedIds, onClear }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handle(status: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      await bulkModerateReviews(selectedIds, status);
      onClear();
      router.refresh();
    });
  }

  if (selectedIds.length === 0) return null;

  return (
    <div className="sticky bottom-0 z-10 flex items-center gap-3 rounded-xl border bg-card p-4 shadow-lg">
      <span className="text-sm font-medium">{selectedIds.length} avis sélectionné(s)</span>
      <div className="flex gap-2 ml-auto">
        <button
          onClick={() => handle("APPROVED")}
          disabled={isPending}
          className="rounded-md bg-green-100 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-200 disabled:opacity-50"
        >
          Approuver tout
        </button>
        <button
          onClick={() => handle("REJECTED")}
          disabled={isPending}
          className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200 disabled:opacity-50"
        >
          Rejeter tout
        </button>
        <button
          onClick={onClear}
          disabled={isPending}
          className="rounded-md bg-muted px-4 py-2 text-sm font-medium transition hover:bg-accent disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
