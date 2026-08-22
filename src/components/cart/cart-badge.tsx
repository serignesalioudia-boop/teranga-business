"use client";

import { useEffect, useState, useCallback } from "react";
import { getCartCount } from "@/server/actions/cart";

export function CartBadge() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    getCartCount().then(setCount).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    function onRefresh() { refresh(); }
    window.addEventListener("cart-updated", onRefresh);
    return () => window.removeEventListener("cart-updated", onRefresh);
  }, [refresh]);

  if (count === 0) return null;

  return (
    <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-[#c8922d] text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
