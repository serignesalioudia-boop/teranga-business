import { getAllOrders } from "@/server/actions/orders";
import { OrderTable } from "./_components/order-table";
import { serialize } from "@/lib/serialize";

type Props = { searchParams: Promise<{ status?: string; search?: string; page?: string }> };


export const metadata = { title: "Commandes — Admin — Teranga Business" };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const raw = await getAllOrders({ status: params.status, search: params.search, page });
  const result = {
    ...raw,
    orders: raw.orders.map((o) => ({
      ...o,
      grandTotal: Number(o.grandTotal),
      createdAt: o.createdAt.toISOString(),
    })),
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Commandes</h1>
      <OrderTable data={result} currentStatus={params.status} currentSearch={params.search} />
    </div>
  );
}
