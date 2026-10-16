import CatalogClient from "./CatalogClient";
import { getCallableSnapshot } from "@/lib/callable-snapshot";

export const dynamic = "force-dynamic";
export default async function CatalogPage() {
  const snapshot = await getCallableSnapshot();
  return <CatalogClient initialCallableCount={snapshot.callableCount} />;
}
