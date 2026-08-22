export type Filter = { key: string; label: string };

const SORT_LABELS: Record<string, string> = {
  newest: "Plus récents",
  price_asc: "Prix croissant",
  price_desc: "Prix décroissant",
  popular: "Populaires",
  rating: "Mieux notés",
};

export function buildActiveFilters(sp: URLSearchParams): Filter[] {
  const filters: Filter[] = [];
  const search = sp.get("search");
  const categoryId = sp.get("categoryId");
  const minPrice = sp.get("minPrice");
  const maxPrice = sp.get("maxPrice");
  const sort = sp.get("sort");
  const inStock = sp.get("inStock");
  const minRating = sp.get("minRating");
  const storeId = sp.get("storeId");

  if (search) filters.push({ key: "search", label: `Recherche: ${search}` });
  if (categoryId) filters.push({ key: "categoryId", label: "Catégorie" });
  if (minPrice && maxPrice) filters.push({ key: "minPrice", label: `${minPrice} - ${maxPrice} XOF` });
  else if (minPrice) filters.push({ key: "minPrice", label: `≥ ${minPrice} XOF` });
  else if (maxPrice) filters.push({ key: "maxPrice", label: `≤ ${maxPrice} XOF` });
  if (sort && sort !== "newest") filters.push({ key: "sort", label: SORT_LABELS[sort] ?? sort });
  if (inStock === "1") filters.push({ key: "inStock", label: "En stock" });
  if (minRating) filters.push({ key: "minRating", label: `Note ≥ ${minRating}★` });
  if (storeId) filters.push({ key: "storeId", label: "Boutique" });

  return filters;
}
