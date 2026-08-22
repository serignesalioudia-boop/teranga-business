import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function main() {
  const tables = ["Category","User","SellerProfile","Store","Product","Order","SubOrder","OrderItem","Notification","Cart","CartItem"];
  for (const t of tables) {
    const r = await pool.query(`SELECT count(*) as c FROM "${t}"`);
    console.log(`  ${t}: ${r.rows[0].c}`);
  }
  await pool.end();
}
main().catch(console.error);
