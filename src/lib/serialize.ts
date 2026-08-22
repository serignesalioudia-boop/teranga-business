/** Serialize Prisma objects (BigInt → string, Decimal → number) for client components. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serialize<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (typeof value === "bigint") return value.toString();
      if (
        value &&
        typeof value === "object" &&
        (value.constructor?.name === "Decimal" || ("d" in value && "s" in value))
      )
        return Number(value);
      return value;
    }),
  ) as T;
}
