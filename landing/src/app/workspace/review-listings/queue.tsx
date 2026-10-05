"use client";
import { useEffect, useState } from "react";
import type { ListingMetadata } from "../../../../../src/listing-metadata";
type Row = {
  _id: string;
  revision: number;
  draft: ListingMetadata;
  submitter: string;
  notificationState?: string;
};
export function ListingReviewQueue({ listingId }: { listingId?: string }) {
  const [rows, setRows] = useState<Row[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notes, setNotes] = useState<Record<string, string>>({}),
    [notice, setNotice] = useState("");
  async function load(next: string | null = null) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(
        "/api/listings/review" +
          (listingId
            ? "?listing=" + encodeURIComponent(listingId)
            : next
              ? "?cursor=" + encodeURIComponent(next)
              : ""),
        { cache: "no-store" },
      );
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setRows((x) => (next ? [...x, ...d.page] : d.page));
      setCursor(d.isDone ? null : d.continueCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load queue");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, [listingId]);
  async function review(row: Row, approve: boolean) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/listings/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row._id,
          revision: row.revision,
          approve,
          note: notes[row._id],
        }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await load();
      setNotice(
        approve
          ? "Listing approved and published for discovery."
          : "Changes requested. The workspace can see your note.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <a href="/workspace">Back to workspace</a>
      {listingId && (
        <a className="block" href="/workspace/review-listings">
          View all pending listings
        </a>
      )}
      <h1 className="text-2xl font-semibold">Review API listings</h1>
      <p>
        Verify ownership, documentation and metadata. Approval publishes
        discovery only. It does not enable gateway calls, collect provider keys
        or activate payments.
      </p>
      <button disabled={busy} onClick={() => void load()}>
        Refresh queue
      </button>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {!busy && !error && !rows.length && <p>No listings awaiting review.</p>}
      {rows.map((row) => (
        <section
          id={row._id}
          key={row._id}
          className="border rounded-xl p-5 space-y-3"
        >
          <h2 className="text-xl">{row.draft.name}</h2>
          <p>
            Submitted by {row.submitter}. Revision {row.revision}. Notification:{" "}
            {row.notificationState ?? "not recorded"}.
          </p>
          <p>{row.draft.description}</p>
          <p>Category: {row.draft.category}</p>
          <p>
            Base URL:{" "}
            <a
              href={row.draft.baseUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {row.draft.baseUrl}
            </a>
          </p>
          <p>
            Documentation:{" "}
            <a
              href={row.draft.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {row.draft.docsUrl}
            </a>
          </p>
          <p>Authentication: {row.draft.auth}</p>
          <p>
            Pricing: {row.draft.pricing}. {row.draft.pricingNotes}
          </p>
          <details>
            <summary>{row.draft.operations.length} operations</summary>
            <ul>
              {row.draft.operations.map((op, i) => (
                <li key={i}>
                  {op.method} {op.path}: {op.summary}
                </li>
              ))}
            </ul>
          </details>
          <label className="block">
            Review note (visible to submitter)
            <textarea
              className="block w-full border rounded p-2 bg-transparent"
              maxLength={2000}
              value={notes[row._id] ?? ""}
              onChange={(e) =>
                setNotes({ ...notes, [row._id]: e.target.value })
              }
            />
          </label>
          <p>
            For approval, record evidence that the submitter has the right to
            represent this API. No actual provider listing without their
            approval.
          </p>
          <button
            className="border rounded px-3 py-2 mr-3"
            disabled={busy || !notes[row._id]?.trim()}
            onClick={() => void review(row, true)}
          >
            Approve discovery listing
          </button>
          <button
            className="border rounded px-3 py-2"
            disabled={busy || !notes[row._id]?.trim()}
            onClick={() => void review(row, false)}
          >
            Request changes
          </button>
        </section>
      ))}
      {cursor && (
        <button disabled={busy} onClick={() => void load(cursor)}>
          Load more
        </button>
      )}
    </main>
  );
}
