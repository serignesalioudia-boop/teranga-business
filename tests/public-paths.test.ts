import { isPublicPath, PUBLIC_PATHS } from "@/lib/public-paths";

describe("isPublicPath", () => {
  it("laisse passer la page d'accueil", () => {
    expect(isPublicPath("/")).toBe(true);
  });

  it("ne laisse pas passer une page inconnue qui ressemble a l'accueil", () => {
    expect(isPublicPath("")).toBe(false);
    expect(isPublicPath("/home")).toBe(false);
    expect(isPublicPath("//")).toBe(false);
  });

  it("laisse passer les pages de catalogue", () => {
    for (const path of ["/products", "/categories", "/shop"]) {
      expect(isPublicPath(path)).toBe(true);
    }
  });

  it("laisse passer les pages detaillees par prefixe", () => {
    for (const path of [
      "/product/smartphone-teranga-pro",
      "/category/electronique",
      "/store/teranga-tech",
      "/store/teranga-tech/products",
      "/store/teranga-tech/category/telephones",
      "/share/product/smartphone-teranga-pro",
    ]) {
      expect(isPublicPath(path)).toBe(true);
    }
  });

  it("laisse passer les fichiers pour les robots", () => {
    expect(isPublicPath("/robots.txt")).toBe(true);
    expect(isPublicPath("/sitemap.xml")).toBe(true);
  });

  it("reserve les espaces authentifies", () => {
    for (const path of [
      "/account",
      "/account/orders",
      "/account/addresses",
      "/checkout",
      "/cart",
      "/seller",
      "/seller/products",
      "/admin",
      "/admin/users",
      "/create-store/etape-2",
    ]) {
      expect(isPublicPath(path)).toBe(false);
    }
  });

  it("conserve create-store public a la racine uniquement", () => {
    expect(isPublicPath("/create-store")).toBe(true);
  });
});

describe("PUBLIC_PATHS", () => {
  it("contient la racine", () => {
    expect(PUBLIC_PATHS).toContain("/");
  });

  it("ne contient aucune route d'espace authentifie", () => {
    const forbidden = ["/account", "/checkout", "/cart", "/seller", "/admin"];
    for (const path of forbidden) {
      expect(PUBLIC_PATHS).not.toContain(path);
    }
  });

  it("n'a pas de doublon", () => {
    expect(new Set(PUBLIC_PATHS).size).toBe(PUBLIC_PATHS.length);
  });
});
