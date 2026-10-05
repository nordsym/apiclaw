export async function loadPublishedListings(fetcher: typeof fetch = fetch) {
  const url =
    process.env.NEXT_PUBLIC_CONVEX_URL ||
    "https://adventurous-avocet-799.convex.cloud";
  const listings: any[] = [];
  let cursor: string | null = null;
  // Small pages also bound reads of rows that retain draft and published metadata.
  for (let page = 0; page < 400; page++) {
    const response: Response = await fetcher(`${url}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "discoveryListings:published",
        args: { paginationOpts: { numItems: 25, cursor } },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const data: any = await response.json();
    if (
      !response.ok ||
      data.status !== "success" ||
      !Array.isArray(data.value?.page)
    )
      throw Error("Published listings unavailable");
    listings.push(
      ...data.value.page.map((row: any) => ({
        ...row,
        callable: false,
        managedAdapter: false,
        verified: false,
        executionAvailable: false,
        actions: [],
      })),
    );
    if (data.value.isDone) return listings;
    cursor = data.value.continueCursor;
    if (!cursor) throw Error("Invalid listing pagination");
  }
  throw Error("Listing catalog capacity exceeded");
}
export function mergePublishedListings<
  T extends { name: string; callable?: boolean },
>(inventory: T[], listings: T[]): T[] {
  const names = new Set(inventory.map((row) => row.name.toLowerCase().trim()));
  const callableNames = new Set(
    inventory
      .filter((row) => row.callable)
      .map((row) => row.name.toLowerCase().trim()),
  );
  const replacements = new Map(
    listings
      .filter((row) => !callableNames.has(row.name.toLowerCase().trim()))
      .map((row) => [row.name.toLowerCase().trim(), row]),
  );
  return [
    ...inventory.map(
      (row) => replacements.get(row.name.toLowerCase().trim()) || row,
    ),
    ...listings.filter((row) => !names.has(row.name.toLowerCase().trim())),
  ];
}
