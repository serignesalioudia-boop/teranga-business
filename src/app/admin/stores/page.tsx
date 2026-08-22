export const dynamic = "force-dynamic";

import { getAdminStores } from "@/server/actions/stores";
import { StoreTable } from "./_components/store-table";


export const metadata = { title: "Boutiques — Admin" };

type Props = { searchParams: Promise<{ search?: string }> };

export default async function AdminStoresPage({ searchParams }: Props) {
  const params = await searchParams;
  const stores = await getAdminStores();

  const serialized = stores.map((s) => ({
    ...s,
    ratingAvg: Number(s.ratingAvg),
    sellerProfile: {
      isVerified: s.sellerProfile.isVerified,
      user: s.sellerProfile.user,
    },
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Boutiques{" "}
        <span className="text-sm font-normal text-muted-foreground">({stores.length})</span>
      </h1>
      <StoreTable stores={serialized} search={params.search} />
    </div>
  );
}
