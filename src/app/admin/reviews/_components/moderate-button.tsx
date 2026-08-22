"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateReview } from "@/server/actions/reviews";

type Props = {
  reviewId: string;
  currentStatus: string;
};

export function ModerateButton({ reviewId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handle(status: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      await moderateReview(reviewId, status);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-1 justify-end">
      {currentStatus !== "APPROVED" && (
        <button
          onClick={() => handle("APPROVED")}
          disabled={isPending}
          className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 transition hover:bg-green-200 disabled:opacity-50"
        >
          Approuver
        </button>
      )}
      {currentStatus !== "REJECTED" && (
        <button
          onClick={() => handle("REJECTED")}
          disabled={isPending}
          className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-200 disabled:opacity-50"
        >
          Rejeter
        </button>
      )}
    </div>
  );
}
