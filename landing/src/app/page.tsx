import HomeClient from "./HomeClient";
import { getCallableSnapshot } from "@/lib/callable-snapshot";

export const dynamic = "force-dynamic";
export default async function Home() {
  const snapshot = await getCallableSnapshot();
  return <HomeClient callableCount={snapshot.callableCount} />;
}
