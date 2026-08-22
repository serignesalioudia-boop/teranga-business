"use client";

import { useState } from "react";

type StarRatingProps = {
  value?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  count?: number;
  size?: "sm" | "md" | "lg";
};

export function StarRating({
  value = 0,
  onChange,
  readonly = false,
  count,
  size = "md",
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  const sizeClass =
    size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";

  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`${sizeClass} cursor-${readonly ? "default" : "pointer"} transition-colors ${
            star <= display ? "text-yellow-500" : "text-gray-300"
          } ${!readonly ? "hover:text-yellow-400" : ""}`}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
      {count !== undefined && (
        <span className="ml-1 text-xs text-muted-foreground">
          ({count} avis{count > 1 ? "" : ""})
        </span>
      )}
    </span>
  );
}
