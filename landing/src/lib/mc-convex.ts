// Mission Control Convex HTTP client
// All NordSym signed documents centralized in agile-crane-840

const MC_CONVEX_URL =
  process.env.MC_CONVEX_URL || "https://agile-crane-840.convex.cloud";

export async function mcQuery<T>(
  path: string,
  args: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${MC_CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });

  if (!response.ok) {
    throw new Error(`MC query failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.status === "error") {
    throw new Error(result.errorMessage || "Query failed");
  }

  return result.value !== undefined ? result.value : result;
}

export async function mcMutation<T>(
  path: string,
  args: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${MC_CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });

  if (!response.ok) {
    throw new Error(`MC mutation failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.status === "error") {
    throw new Error(result.errorMessage || "Mutation failed");
  }

  return result.value !== undefined ? result.value : result;
}
