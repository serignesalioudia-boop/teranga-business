export const dynamic = "force-dynamic";

import { getUserAddresses } from "@/server/actions/addresses";
import { AddressesClient } from "./addresses-client";


export const metadata = {
  title: "Mes adresses — Teranga Business",
};

export default async function AddressesPage() {
  const addresses = await getUserAddresses();

  return <AddressesClient addresses={addresses} />;
}
