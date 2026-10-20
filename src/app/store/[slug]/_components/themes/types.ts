import type { StoreThemeConfig } from "@/lib/store-theme";

export type ThemeProduct = {
  id: string;
  name: string;
  slug: string;
  price: number | string | bigint;
  discountPrice: number | string | bigint | null;
  ratingCount?: number;
  ratingAvg?: number | string | { toString(): string } | null;
  media: { url: string; alt: string | null }[];
  store?: { id?: string; name: string; slug?: string };
  category?: { name: string; slug: string };
};

export type ThemeCategory = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

export type ThemeSocialLink = {
  platform: string;
  url: string;
};

export type ThemeDeliveryRule = {
  zone: string | null;
  method: string;
  fee: number | string | bigint;
  freeAbove: number | string | bigint | null;
};

export type ThemeStore = {
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  whatsapp: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  qrWaveUrl?: string | null;
  qrOrangeMoneyUrl?: string | null;
  shippingPolicy?: string | null;
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
};

export type ThemeProps = {
  store: ThemeStore;
  products: ThemeProduct[];
  featuredProducts: ThemeProduct[];
  categories: ThemeCategory[];
  favoriteIds: Set<string>;
  sellerName: string;
  storeSlug: string;
  currentCategory?: string;
  currentSearch?: string;
  currentSort?: string;
  storeTheme?: StoreThemeConfig | null;
  socialLinks?: ThemeSocialLink[];
  deliveryRules?: ThemeDeliveryRule[];
};
