"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/server/actions/favorites";

export function FavoriteButton({
  productId,
  initialFavorited,
}: {
  productId: string;
  initialFavorited: boolean;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    setPending(true);
    try {
      const result = await toggleFavorite(productId);
      setFavorited(result.favorited);
    } catch {
      router.push("/login");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
      className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1.5 backdrop-blur-sm transition hover:bg-background"
    >
      <Heart
        className={`h-4 w-4 transition ${
          favorited ? "fill-red-500 text-red-500" : "text-muted-foreground"
        }`}
      />
    </button>
  );
}
