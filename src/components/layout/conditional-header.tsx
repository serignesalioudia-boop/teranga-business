"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function HeaderGate({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const fromStore = searchParams.get("from") === "store";
  if (fromStore) return null;
  return <>{children}</>;
}

export function ConditionalHeader({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <HeaderGate>{children}</HeaderGate>
    </Suspense>
  );
}
