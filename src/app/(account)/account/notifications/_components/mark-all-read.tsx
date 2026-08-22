"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllAsRead } from "@/server/actions/notifications";

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => { await markAllAsRead(); router.refresh(); })}
      className="text-sm text-primary hover:underline disabled:opacity-50"
    >
      {isPending ? "..." : "Tout marquer lu"}
    </button>
  );
}
