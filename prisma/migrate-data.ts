import { Pool } from "pg";

const localPool = new Pool({
  host: "localhost", port: 5432,
  database: "teranga_business", user: "teranga_business",
  password: "Zall@6452000",
});
const supaPool = new Pool({ connectionString: process.env.DATABASE_URL });

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function copyTable<T extends Record<string, any>>(
  label: string,
  localQuery: string,
  supaCols: string[],
  transform: (row: T) => any[],
  onConflict: string = "DO NOTHING"
) {
  const rows = (await localPool.query(localQuery)).rows as T[];
  let count = 0;
  for (const row of rows) {
    const values = transform(row);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(",");
    const colNames = supaCols.map(c => `"${c}"`).join(",");
    try {
      await supaPool.query(
        `INSERT INTO "${label}" (${colNames}) VALUES (${placeholders}) ON CONFLICT ${onConflict}`,
        values
      );
      count++;
    } catch (e: any) {
      console.error(`  ⚠️  Erreur ${label}: ${e.message.split("\n")[0]}`);
    }
  }
  console.log(`✅ ${count}/${rows.length} ${label}`);
}

async function main() {
  console.log("Test connexion...");
  const test = await localPool.query("SELECT count(*) FROM \"Category\"");
  console.log(`Catégories locales: ${test.rows[0].count}`);
  console.log("Migration Docker → Supabase...\n");

  // 1. Categories
  await copyTable("Category",
    `SELECT * FROM "Category" ORDER BY "createdAt"`,
    ["id", "name", "slug", "isActive", "createdAt", "updatedAt"],
    (c) => [c.id, c.name, c.slug, c.isActive, c.createdAt, c.updatedAt],
    "(slug) DO NOTHING"
  );

  // 2. Users
  await copyTable("User",
    `SELECT * FROM "User" ORDER BY "createdAt"`,
    ["id", "name", "email", "passwordHash", "role", "isActive", "image", "createdAt", "updatedAt"],
    (u) => [u.id, u.name, u.email, u.passwordHash, u.role, u.isActive, u.image, u.createdAt, u.updatedAt],
    "(email) DO NOTHING"
  );

  // 3. SellerProfiles
  await copyTable("SellerProfile",
    `SELECT * FROM "SellerProfile" ORDER BY "createdAt"`,
    ["id", "userId", "status", "isVerified", "plan", "planExpiresAt", "createdAt", "updatedAt"],
    (s) => [s.id, s.userId, s.status, s.isVerified, s.plan, s.planExpiresAt, s.createdAt, s.updatedAt],
    '("userId") DO NOTHING'
  );

  // 4. Stores
  await copyTable("Store",
    `SELECT * FROM "Store" ORDER BY "createdAt"`,
    ["id", "name", "slug", "description", "sellerProfileId", "isActive", "logoUrl", "bannerUrl", "whatsapp", "storeTheme", "returnPolicy", "shippingPolicy", "createdAt", "updatedAt"],
    (s) => [s.id, s.name, s.slug, s.description, s.sellerProfileId, s.isActive, s.logoUrl, s.bannerUrl, s.whatsapp, s.storeTheme ? JSON.stringify(s.storeTheme) : null, s.returnPolicy, s.shippingPolicy, s.createdAt, s.updatedAt],
    "(slug) DO NOTHING"
  );

  // 5. Products (with slug generation)
  const supaCats = (await supaPool.query(`SELECT id, slug FROM "Category"`)).rows;
  const supaStores = (await supaPool.query(`SELECT id, slug FROM "Store"`)).rows;
  const catMap = new Map(supaCats.map((c: any) => [c.slug, c.id]));
  const storeMap = new Map(supaStores.map((s: any) => [s.slug, s.id]));

  const products = (await localPool.query(
    `SELECT p.*, c.slug as cat_slug, s.slug as store_slug FROM "Product" p JOIN "Category" c ON p."categoryId" = c.id JOIN "Store" s ON p."storeId" = s.id ORDER BY p."createdAt"`
  )).rows;
  let prodCount = 0;
  const slugCounter = new Map<string, number>();
  for (const p of products) {
    const newCatId = catMap.get(p.cat_slug);
    const newStoreId = storeMap.get(p.store_slug);
    if (newCatId && newStoreId) {
      let slug = toSlug(p.name);
      const count = slugCounter.get(slug) || 0;
      slugCounter.set(slug, count + 1);
      if (count > 0) slug = `${slug}-${count}`;
      try {
        await supaPool.query(
          `INSERT INTO "Product" (id, name, slug, description, price, "discountPrice", stock, status, "storeId", "categoryId", "isFeatured", "isDigital", sku, "ratingAvg", "ratingCount", "soldCount", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) ON CONFLICT DO NOTHING`,
          [p.id, p.name, slug, p.description, p.price.toString(), p.discountPrice?.toString(), p.stock, p.status, newStoreId, newCatId, p.isFeatured, p.isDigital, p.sku, p.ratingAvg ? p.ratingAvg.toString() : "0", p.ratingCount, p.soldCount, p.createdAt, p.updatedAt]
        );
        prodCount++;
      } catch (e: any) {
        console.error(`  ⚠️  Product error: ${e.message.split("\n")[0]}`);
      }
    }
  }
  console.log(`✅ ${prodCount}/${products.length} Product`);

  // 6. Address
  await copyTable("Address",
    `SELECT * FROM "Address" ORDER BY "createdAt"`,
    ["id", "userId", "label", "fullName", "phone", "country", "region", "city", "addressLine", "isDefault", "createdAt", "updatedAt"],
    (a) => [a.id, a.userId, a.label, a.fullName, a.phone, a.country, a.region, a.city, a.addressLine, a.isDefault, a.createdAt, a.updatedAt]
  );

  // 7. Order
  await copyTable("Order",
    `SELECT * FROM "Order" ORDER BY "createdAt"`,
    ["id", "number", "userId", "sessionId", "guestEmail", "guestPhone", "status", "paymentStatus", "currency", "subtotal", "deliveryTotal", "discountTotal", "commissionTotal", "grandTotal", "shippingAddress", "billingAddress", "metadata", "placedAt", "createdAt", "updatedAt"],
    (o) => [o.id, o.number, o.userId, o.sessionId, o.guestEmail, o.guestPhone, o.status, o.paymentStatus, o.currency, o.subtotal?.toString(), o.deliveryTotal?.toString(), o.discountTotal?.toString(), o.commissionTotal?.toString(), o.grandTotal?.toString(), o.shippingAddress ? JSON.stringify(o.shippingAddress) : null, o.billingAddress ? JSON.stringify(o.billingAddress) : null, o.metadata ? JSON.stringify(o.metadata) : null, o.placedAt, o.createdAt, o.updatedAt]
  );

  // 8. SubOrder
  await copyTable("SubOrder",
    `SELECT * FROM "SubOrder" ORDER BY "createdAt"`,
    ["id", "orderId", "storeId", "sellerProfileId", "status", "currency", "subtotal", "deliveryFee", "discount", "commissionRateBp", "commissionAmount", "payableAmount", "shippingAddress", "createdAt", "updatedAt"],
    (so) => [so.id, so.orderId, so.storeId, so.sellerProfileId, so.status, so.currency, so.subtotal?.toString(), so.deliveryFee?.toString(), so.discount?.toString(), so.commissionRateBp, so.commissionAmount?.toString(), so.payableAmount?.toString(), so.shippingAddress ? JSON.stringify(so.shippingAddress) : null, so.createdAt, so.updatedAt]
  );

  // 9. OrderItem
  await copyTable("OrderItem",
    `SELECT * FROM "OrderItem" ORDER BY "createdAt"`,
    ["id", "subOrderId", "productId", "productName", "productImage", "unitPrice", "quantity", "lineTotal", "createdAt"],
    (oi) => [oi.id, oi.subOrderId, oi.productId, oi.productName, oi.productImage, oi.unitPrice?.toString(), oi.quantity, oi.lineTotal?.toString(), oi.createdAt]
  );

  // 10. Notification
  await copyTable("Notification",
    `SELECT * FROM "Notification" ORDER BY "createdAt"`,
    ["id", "userId", "type", "title", "content", "link", "isRead", "createdAt"],
    (n) => [n.id, n.userId, n.type, n.title, n.content, n.link, n.isRead, n.createdAt]
  );

  // 11. AuditLog
  await copyTable("AuditLog",
    `SELECT * FROM "AuditLog" ORDER BY "createdAt"`,
    ["id", "userId", "action", "entityType", "entityId", "before", "after", "ip", "createdAt"],
    (l) => [l.id, l.userId, l.action, l.entityType, l.entityId, l.before ? JSON.stringify(l.before) : null, l.after ? JSON.stringify(l.after) : null, l.ip, l.createdAt]
  );

  // 12. Favorite
  await copyTable("Favorite",
    `SELECT * FROM "Favorite" ORDER BY "createdAt"`,
    ["id", "userId", "productId", "createdAt"],
    (f) => [f.id, f.userId, f.productId, f.createdAt]
  );

  // 13. Review
  await copyTable("Review",
    `SELECT * FROM "Review" ORDER BY "createdAt"`,
    ["id", "productId", "userId", "orderItemId", "rating", "title", "content", "status", "createdAt", "updatedAt"],
    (r) => [r.id, r.productId, r.userId, r.orderItemId, r.rating, r.title, r.content, r.status, r.createdAt, r.updatedAt]
  );

  // 14. Cart
  await copyTable("Cart",
    `SELECT * FROM "Cart" ORDER BY "createdAt"`,
    ["id", "userId", "sessionId", "createdAt", "updatedAt"],
    (c) => [c.id, c.userId, c.sessionId, c.createdAt, c.updatedAt]
  );

  // 15. CartItem
  await copyTable("CartItem",
    `SELECT * FROM "CartItem"`,
    ["id", "cartId", "productId", "quantity", "createdAt", "updatedAt"],
    (ci) => [ci.id, ci.cartId, ci.productId, ci.quantity, ci.createdAt, ci.updatedAt]
  );

  await localPool.end();
  await supaPool.end();
  console.log("\n🎉 Migration complète !");
}

main().catch((e) => { console.error(e); process.exit(1); });
