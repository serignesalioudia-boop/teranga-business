"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function StoreBackButton({
  storeSlug,
  label,
  className = "",
}: {
  storeSlug: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={`/store/${storeSlug}`}
      className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-[#cbd5e1] bg-white px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#24160c] transition hover:border-[#c8922d] hover:bg-[#fff7e6] hover:text-[#c8922d] ${className}`}
    >
      <ArrowLeft className="size-3.5 sm:size-4" />
      {label ?? "Retour"}
    </Link>
  );
}
