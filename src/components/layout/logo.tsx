import { Store } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "size-5",
    md: "size-12",
    lg: "size-20",
  };

  return (
    <span className="inline-flex items-center justify-center">
      <Store className={sizes[size]} />
    </span>
  );
}
