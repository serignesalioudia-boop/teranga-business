const formatter = new Intl.NumberFormat("fr-SN", {
  style: "currency",
  currency: "XOF",
});

export function formatPrice(amount: bigint | number | string): string {
  const num = typeof amount === "string" ? Number(amount) : typeof amount === "bigint" ? Number(amount) : amount;
  return formatter.format(num);
}
