import {
  Apple,
  Baby,
  BookOpen,
  Car,
  Dumbbell,
  Laptop,
  Palette,
  Shirt,
  ShoppingBasket,
  Sofa,
  Sparkles,
  Stethoscope,
  Shapes,
  Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Icone representative par categorie. Sert uniquement de repli quand la
 * categorie n'a ni photo (imageUrl) ni photo produit : le placeholder 📦
 * ne veut rien dire pour l'utilisateur.
 */
const ICONS_BY_SLUG: Record<string, LucideIcon> = {
  alimentation: ShoppingBasket,
  "art-artisanat": Palette,
  automobile: Car,
  "beaute-sante": Sparkles,
  "bebe-enfant": Baby,
  electronique: Laptop,
  informatique: Laptop,
  multimedia: Laptop,
  "maison-decoration": Sofa,
  "mode-vetements": Shirt,
  "sacs-accessoires": Shirt,
  "livres-fournitures": BookOpen,
  "sport-loisirs": Dumbbell,
  sante: Stethoscope,
  beaute: Sparkles,
};

export function categoryIcon(slug: string): LucideIcon {
  return ICONS_BY_SLUG[slug] ?? Shapes;
}

/**
 * Un champ "icon" libre peut contenir n'importe quoi : la catégorie
 * Électronique contenait la chaîne "Cpu" qui s'affichait telle quelle à la
 * place d'une icône. On ne rend donc l'emoji que s'il ressemble vraiment à un
 * emoji, sinon on passe au repli par slug.
 */
export function resolveCategoryIcon(
  slug: string,
  icon: string | null,
): { Emoji: string | null; Icon: LucideIcon } {
  const trimmed = (icon ?? "").trim();
  if (trimmed && [...trimmed].length <= 2 && /\p{Extended_Pictographic}/u.test(trimmed)) {
    return { Emoji: trimmed, Icon: categoryIcon(slug) };
  }
  return { Emoji: null, Icon: categoryIcon(slug) };
}

export function CategoryGlyph({
  slug,
  icon,
  className,
}: {
  slug: string;
  icon: string | null;
  className?: string;
}) {
  const { Emoji, Icon } = resolveCategoryIcon(slug, icon);
  if (Emoji) return <span className={className}>{Emoji}</span>;
  return <Icon className={className} aria-hidden />;
}
