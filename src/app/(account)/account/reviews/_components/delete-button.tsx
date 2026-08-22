"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteReview } from "@/server/actions/reviews";

export function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteReview(reviewId);
          router.refresh();
        })
      }
      className="text-xs text-destructive hover:underline disabled:opacity-50"
    >
      {isPending ? "Suppression..." : "Supprimer"}
    </button>
  );
}
