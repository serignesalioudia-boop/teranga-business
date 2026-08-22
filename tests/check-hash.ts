import bcrypt from "bcryptjs";

async function main() {
  const hash = "$2a$12$LJ3m4ys3Lz0XfnE.VhOAqO9y1OkhRl3w4K5x3k5y5z5w5v5n5m5o";
  const match = bcrypt.compareSync("admin", hash);
  console.log("Password match:", match);

  const newHash = bcrypt.hashSync("admin", 12);
  console.log("New hash:", newHash);
  console.log("Verify:", bcrypt.compareSync("admin", newHash));
}

main();
