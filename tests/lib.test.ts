import { formatPrice } from "@/lib/format";
import { serialize } from "@/lib/serialize";
import { cn } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";

describe("formatPrice", () => {
  it("formatte un bigint", () => {
    const result = formatPrice(BigInt(5000));
    expect(result).toContain("5");
    expect(result).toContain("000");
  });

  it("formatte un number", () => {
    const result = formatPrice(2500);
    expect(result).toContain("2");
    expect(result).toContain("500");
  });

  it("formatte une string", () => {
    const result = formatPrice("10000");
    expect(result).toContain("10");
    expect(result).toContain("000");
  });

  it("formatte zéro", () => {
    const result = formatPrice(0);
    expect(result).toContain("0");
  });
});

describe("serialize", () => {
  it("convertit BigInt en string", () => {
    const input = { price: BigInt(5000), name: "test" };
    const result = serialize(input);
    expect(result.price).toBe("5000");
    expect(result.name).toBe("test");
  });

  it("gère les objets imbriqués", () => {
    const input = { nested: { amount: BigInt(1000) } };
    const result = serialize(input);
    expect(result.nested.amount).toBe("1000");
  });

  it("gère les tableaux", () => {
    const input = [{ price: BigInt(500) }, { price: BigInt(1000) }];
    const result = serialize(input);
    expect(result[0].price).toBe("500");
    expect(result[1].price).toBe("1000");
  });
});

describe("cn", () => {
  it("fusionne les classes", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("gère les classes conditionnelles", () => {
    const result = cn("base", false && "hidden", "extra");
    expect(result).toContain("base");
    expect(result).toContain("extra");
    expect(result).not.toContain("hidden");
  });
});

describe("checkRateLimit", () => {
  it("autorise les premières requêtes", () => {
    const result = checkRateLimit("test-rl-1", 5, 60_000);
    expect(result.allowed).toBe(true);
  });

  it("bloque après le max", () => {
    const key = "test-rl-block";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60_000);
    }
    const result = checkRateLimit(key, 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

describe("share URL building", () => {
  const BASE_URL = "http://localhost:3000";

  it("construit une URL produit", () => {
    const url = `${BASE_URL}/product/smartphone-teranga-pro`;
    expect(url).toContain("/product/");
    expect(url).toContain("smartphone-teranga-pro");
  });

  it("construit une URL boutique", () => {
    const url = `${BASE_URL}/store/teranga-tech`;
    expect(url).toContain("/store/");
    expect(url).toContain("teranga-tech");
  });

  it("construit une URL catégorie", () => {
    const url = `${BASE_URL}/category/electronique`;
    expect(url).toContain("/category/");
    expect(url).toContain("electronique");
  });

  it("construit une URL de partage dédiée", () => {
    const url = `${BASE_URL}/share/product/mon-produit`;
    expect(url).toContain("/share/product/");
  });

  it("génère les liens WhatsApp correctement", () => {
    const title = "Mon Produit";
    const shareUrl = `${BASE_URL}/product/mon-produit`;
    const text = encodeURIComponent(`${title}\n${shareUrl}`);
    const whatsappUrl = `https://wa.me/?text=${text}`;
    expect(whatsappUrl).toContain("wa.me");
    expect(whatsappUrl).toContain(encodeURIComponent(title));
  });

  it("génère les liens Facebook correctement", () => {
    const shareUrl = `${BASE_URL}/product/mon-produit`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    expect(fbUrl).toContain("facebook.com/sharer");
  });

  it("génère les liens Messenger correctement", () => {
    const shareUrl = `${BASE_URL}/product/mon-produit`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const messengerUrl = `https://www.messenger.com/share/link?link=${encodedUrl}`;
    expect(messengerUrl).toContain("messenger.com/share");
  });

  it("génère les liens SMS correctement", () => {
    const title = "Mon Produit";
    const shareUrl = `${BASE_URL}/product/mon-produit`;
    const text = encodeURIComponent(`${title}\n${shareUrl}`);
    const smsUrl = `sms:?body=${text}`;
    expect(smsUrl).toContain("sms:");
  });
});
