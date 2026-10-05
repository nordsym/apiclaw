"use client";
import { useEffect, useState } from "react";
import { workspaceRequest } from "@/lib/workspace-data";
import {
  Field,
  Panel,
  btnSolid,
  btnQuiet,
  inputClass,
  textareaClass,
} from "@/app/workspace/views/ui";
import type { ListingMetadata } from "../../../src/listing-metadata";
type Listing = {
  _id: string;
  draft: ListingMetadata;
  revision: number;
  reviewState: string;
  reviewNote?: string;
  isPublished: boolean;
};
export function MyApiListings({
  sessionToken,
}: {
  sessionToken?: string | null;
}) {
  const [rows, setRows] = useState<Listing[]>([]),
    [metadata, setMetadata] = useState<ListingMetadata | null>(null);
  const [editing, setEditing] = useState<Listing | null>(null),
    [url, setUrl] = useState(""),
    [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const refresh = async () => {
    if (sessionToken)
      setRows(
        await workspaceRequest<Listing[]>("query", "discoveryListings:mine", {
          token: sessionToken,
        }),
      );
  };
  useEffect(() => {
    let live = true;
    if (sessionToken)
      workspaceRequest<Listing[]>("query", "discoveryListings:mine", {
        token: sessionToken,
      })
        .then((x) => {
          if (live) setRows(x);
        })
        .catch((e) => {
          if (live) setError(String(e.message));
        });
    return () => {
      live = false;
    };
  }, [sessionToken]);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not complete request");
    } finally {
      setBusy(false);
    }
  };
  const importSpec = () =>
    run(async () => {
      if (!sessionToken) throw Error("Sign in to import an API");
      if (file && file.size > 1024 * 1024) throw Error("File exceeds 1 MB");
      const response = await fetch("/api/listings/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-APIClaw-Session": sessionToken,
        },
        body: JSON.stringify(file ? { text: await file.text() } : { url }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Import failed");
      setMetadata(
        editing
          ? { ...data.metadata, name: editing.draft.name }
          : data.metadata,
      );
      setNotice("Review the imported details. Nothing has been published.");
    });
  const save = () =>
    run(async () => {
      if (!metadata || !sessionToken) return;
      await workspaceRequest("mutation", "discoveryListings:saveDraft", {
        token: sessionToken,
        metadata,
        ...(editing ? { id: editing._id, revision: editing.revision } : {}),
      });
      await refresh();
      setMetadata(null);
      setEditing(null);
      setOpen(false);
      setNotice("Draft saved. Submit it for review from My APIs.");
    });
  const change = (key: keyof ListingMetadata, value: string) =>
    setMetadata((m) => (m ? { ...m, [key]: value } : m));
  return (
    <div className="space-y-5 mt-5">
      <p className="text-sm text-text-secondary">
        List your API for free. Approved listings appear in Catalog and
        discover_apis. Listing does not enable APIClaw execution or collect API
        keys.
      </p>
      <button
        className={btnSolid}
        disabled={busy}
        onClick={() => {
          setOpen(true);
          setEditing(null);
          setMetadata(null);
          setUrl("");
          setFile(null);
          setError("");
          setNotice("");
        }}
      >
        Add API
      </button>
      {error && (
        <p role="alert" className="text-red-400">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {open && (
        <Panel className="p-5 space-y-4">
          {!metadata ? (
            <>
              <Field label="OpenAPI URL">
                <input
                  className={inputClass}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setFile(null);
                  }}
                  placeholder="https://api.example.com/openapi.json"
                />
              </Field>
              <Field label="Or upload JSON / YAML">
                <input
                  aria-label="OpenAPI file"
                  type="file"
                  accept=".json,.yaml,.yml"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    setUrl("");
                  }}
                />
              </Field>
              <p className="text-sm">
                OpenAPI 3.0/3.1 or Swagger 2.0, up to 1 MB and 200 operations.
                Bundle external references before uploading.
              </p>
              <button
                className={btnSolid}
                disabled={busy || (!file && !url)}
                onClick={importSpec}
              >
                {busy ? "Importing…" : "Import specification"}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-medium">Preview listing</h2>
              {(
                [
                  "name",
                  "description",
                  "category",
                  "baseUrl",
                  "docsUrl",
                  "auth",
                  "pricing",
                  "pricingNotes",
                ] as const
              ).map((key) => (
                <Field
                  key={key}
                  label={
                    {
                      name: "Name",
                      description: "Description",
                      category: "Category",
                      baseUrl: "API base URL",
                      docsUrl: "Documentation URL",
                      auth: "Authentication required by provider",
                      pricing: "Provider pricing",
                      pricingNotes: "Pricing and account limits",
                    }[key]
                  }
                >
                  {key === "description" || key === "pricingNotes" ? (
                    <textarea
                      className={textareaClass}
                      value={metadata[key]}
                      onChange={(e) => change(key, e.target.value)}
                    />
                  ) : (
                    <input
                      className={inputClass}
                      readOnly={key === "name" && !!editing}
                      value={metadata[key]}
                      onChange={(e) => change(key, e.target.value)}
                    />
                  )}
                </Field>
              ))}
              <details>
                <summary>
                  {metadata.operations.length} operations imported
                </summary>
                <ul>
                  {metadata.operations.map((op, i) => (
                    <li key={i}>
                      <code>
                        {op.method} {op.path}
                      </code>{" "}
                      {op.summary}
                    </li>
                  ))}
                </ul>
              </details>
              <p className="text-sm">
                Discovery only. No test calls are made. Review checks the
                metadata and your right to represent this API.
              </p>
              <button className={btnSolid} disabled={busy} onClick={save}>
                {busy ? "Saving…" : "Save draft"}
              </button>
            </>
          )}
          <button
            className={btnQuiet}
            disabled={busy}
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </Panel>
      )}
      {!rows.length && !open && (
        <p>No APIs listed yet. Add an OpenAPI specification to get started.</p>
      )}
      {rows.map((row) => (
        <Panel key={row._id} className="p-5 space-y-3">
          <h2 className="font-medium">{row.draft.name}</h2>
          <p>
            {row.isPublished ? "Published · " : ""}
            {row.reviewState.replace("_", " ")} · revision {row.revision}
          </p>
          {row.reviewNote && <p>{row.reviewNote}</p>}
          {row.isPublished && row.reviewState !== "approved" && (
            <p>
              The previously approved version remains visible until these
              changes are approved.
            </p>
          )}
          <div className="flex gap-3 flex-wrap">
            <button
              className={btnQuiet}
              disabled={busy}
              onClick={() => {
                setEditing(row);
                setMetadata(row.draft);
                setOpen(true);
              }}
            >
              Edit draft
            </button>
            <button
              className={btnQuiet}
              disabled={busy}
              onClick={() => {
                setEditing(row);
                setMetadata(null);
                setUrl(row.draft.specUrl || "");
                setFile(null);
                setOpen(true);
              }}
            >
              Import new version
            </button>
            {row.reviewState !== "pending" &&
              row.reviewState !== "approved" && (
                <button
                  className={btnSolid}
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await workspaceRequest(
                        "mutation",
                        "discoveryListings:submit",
                        {
                          token: sessionToken,
                          id: row._id,
                          revision: row.revision,
                        },
                      );
                      await refresh();
                      setNotice(
                        "Submitted for review. Your status will appear here.",
                      );
                    })
                  }
                >
                  Submit for review
                </button>
              )}
            {row.isPublished && (
              <>
                <a
                  className={btnQuiet}
                  href={`/workspace?tab=api-catalog&q=${encodeURIComponent(row.draft.name)}`}
                >
                  Find in catalog
                </a>
                <button
                  className={btnQuiet}
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await workspaceRequest(
                        "mutation",
                        "discoveryListings:unpublish",
                        { token: sessionToken, id: row._id },
                      );
                      await refresh();
                    })
                  }
                >
                  Unpublish
                </button>
              </>
            )}
          </div>
        </Panel>
      ))}
    </div>
  );
}
