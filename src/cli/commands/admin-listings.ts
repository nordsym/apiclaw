import { Command } from "commander";

type Pending = {
  id: string;
  name: string;
  revision: number;
  docsUrl: string;
  baseUrl: string;
  submittedAt: number;
  submitter: { workspaceId: string; email: string };
};
export async function operatorRequest(path: string, body?: unknown) {
  const token = process.env.APICLAW_OPERATOR_TOKEN;
  if (!token)
    throw Error(
      "APICLAW_OPERATOR_TOKEN must be injected from the operator secret store.",
    );
  const origin = process.env.APICLAW_OPERATOR_URL || "https://apiclaw.cloud";
  const url = new URL(origin);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw Error("Operator API requires HTTPS.");
  const response = await fetch(new URL("/api/internal/listings/" + path, url), {
    method: body ? "POST" : "GET",
    redirect: "error",
    signal: AbortSignal.timeout(20000),
    headers: {
      Authorization: "Bearer " + token,
      "X-APIClaw-Agent": process.env.APICLAW_AGENT_NAME || "APIClaw CLI",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = (await response.json().catch(() => null)) as any;
  if (!response.ok)
    throw Error(
      `Operator API ${response.status}: ${result?.error || "Request failed"}`,
    );
  return result;
}
export async function listPending(id?: string): Promise<Pending[]> {
  const rows: Pending[] = [];
  let cursor: string | null = null;
  do {
    const query = id
      ? "?id=" + encodeURIComponent(id)
      : cursor
        ? "?cursor=" + encodeURIComponent(cursor)
        : "";
    const page = await operatorRequest("pending" + query);
    rows.push(...page.listings);
    cursor = page.nextCursor;
  } while (cursor && !id);
  return rows;
}
export async function decideListing(
  id: string,
  approve: boolean,
  note: string,
  revision?: number,
) {
  if (!note.trim()) throw Error("A non-empty review note is required.");
  const rows = await listPending(id),
    row = rows.find((r) => r.id === id);
  if (!row) throw Error("Listing is not pending. Refresh the queue.");
  if (revision !== undefined && row.revision !== revision)
    throw Error(
      "Revision changed. Review the current listing before deciding.",
    );
  return operatorRequest("review", {
    id,
    revision: revision ?? row.revision,
    approve,
    note,
  });
}
export function registerListingAdmin(program: Command) {
  const listings = program
    .command("admin")
    .description("Founder-authorized discovery operations")
    .command("listings");
  const run = (action: () => Promise<unknown>) =>
    action()
      .then((result) => console.log(JSON.stringify(result, null, 2)))
      .catch((error) => {
        console.error(
          error instanceof Error ? error.message : "Operator request failed",
        );
        process.exitCode = 1;
      });
  listings
    .command("pending")
    .description("List private pending discovery listings")
    .action(() => run(() => listPending()));
  for (const approve of [true, false])
    listings
      .command((approve ? "approve" : "reject") + " <id>")
      .requiredOption(
        "--note <note>",
        "Ownership evidence or reason for rejection",
      )
      .option(
        "--revision <number>",
        "Require the revision shown in the notification",
        (s: string) => {
          const n = Number(s);
          if (!Number.isSafeInteger(n) || n < 1)
            throw Error("Invalid revision");
          return n;
        },
      )
      .action((id, options) =>
        run(() => decideListing(id, approve, options.note, options.revision)),
      );
}
