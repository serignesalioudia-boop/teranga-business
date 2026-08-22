export type StoreThemeConfig = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
};

export const DEFAULT_STORE_THEME: StoreThemeConfig = {
  primaryColor: "#c8922d",
  secondaryColor: "#24160c",
  backgroundColor: "#fffaf0",
  cardColor: "#fffdf8",
  textColor: "#24160c",
  fontFamily: "Inter",
  borderRadius: "0.75rem",
};

export const FONT_OPTIONS = [
  { value: "Inter", label: "Inter", css: "'Inter', sans-serif" },
  { value: "Playfair Display", label: "Playfair Display", css: "'Playfair Display', serif" },
  { value: "Poppins", label: "Poppins", css: "'Poppins', sans-serif" },
  { value: "Dancing Script", label: "Dancing Script", css: "'Dancing Script', cursive" },
  { value: "Oswald", label: "Oswald", css: "'Oswald', sans-serif" },
] as const;

export const RADIUS_OPTIONS = [
  { value: "0.25rem", label: "Petit" },
  { value: "0.5rem", label: "Moyen" },
  { value: "0.75rem", label: "Normal" },
  { value: "1rem", label: "Arrondi" },
  { value: "9999px", label: "Rond" },
] as const;

export function getStoreThemeConfig(raw: unknown): StoreThemeConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_STORE_THEME };
  const r = raw as Record<string, unknown>;
  return {
    primaryColor: typeof r.primaryColor === "string" ? r.primaryColor : DEFAULT_STORE_THEME.primaryColor,
    secondaryColor: typeof r.secondaryColor === "string" ? r.secondaryColor : DEFAULT_STORE_THEME.secondaryColor,
    backgroundColor: typeof r.backgroundColor === "string" ? r.backgroundColor : DEFAULT_STORE_THEME.backgroundColor,
    cardColor: typeof r.cardColor === "string" ? r.cardColor : DEFAULT_STORE_THEME.cardColor,
    textColor: typeof r.textColor === "string" ? r.textColor : DEFAULT_STORE_THEME.textColor,
    fontFamily: typeof r.fontFamily === "string" ? r.fontFamily : DEFAULT_STORE_THEME.fontFamily,
    borderRadius: typeof r.borderRadius === "string" ? r.borderRadius : DEFAULT_STORE_THEME.borderRadius,
  };
}

export function storeThemeToCSS(config: StoreThemeConfig): React.CSSProperties {
  const font = FONT_OPTIONS.find((f) => f.value === config.fontFamily);
  return {
    "--store-primary": config.primaryColor,
    "--store-secondary": config.secondaryColor,
    "--store-bg": config.backgroundColor,
    "--store-card": config.cardColor,
    "--store-text": config.textColor,
    "--store-radius": config.borderRadius,
    "--store-font": font?.css ?? "'Inter', sans-serif",
    backgroundColor: config.backgroundColor,
    color: config.textColor,
    fontFamily: font?.css ?? "'Inter', sans-serif",
  } as React.CSSProperties;
}
