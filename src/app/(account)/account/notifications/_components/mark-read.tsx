"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAsRead } from "@/server/actions/notifications";

export function MarkReadButton({ notificationId }: { notificationId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => { await markAsRead(notificationId); router.refresh(); })}
      className="text-xs text-primary hover:underline disabled:opacity-50 shrink-0"
    >
      {isPending ? "..." : "Marquer lu"}
    </button>
  );
}
