"use client";

import { useState } from "react";
import { runBrowserNasaCall } from "@/lib/browser-first-call";
import { invalidateWorkspace } from "@/lib/workspace-data";

type Picture = Awaited<ReturnType<typeof runBrowserNasaCall>>;

export function FirstWebCall({ sessionToken, onSuccess }: { sessionToken: string; onSuccess?: (title: string) => void }) {
  const [running, setRunning] = useState(false);
  const [picture, setPicture] = useState<Picture | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function run() {
    if (running) return;
    setRunning(true);
    setError(null);
    try {
      const result = await runBrowserNasaCall(sessionToken);
      setPicture(result);
      onSuccess?.(result.title);
      invalidateWorkspace();
    } catch (cause) {
      setError(cause instanceof Error && /^(NASA |Your session )/.test(cause.message)
        ? cause.message : "Could not reach NASA. Check your connection and try again. This call is free.");
    } finally { setRunning(false); }
  }
  return <section aria-label="Try a free API call" className="mb-6 rounded-[14px] border border-[var(--border-subtle)] p-5">
    <h2 className="text-lg font-medium">Your first API call</h2>
    <p className="mt-2 text-sm text-[var(--text-secondary)]">Get NASA’s Astronomy Picture of the Day. Free, with no card or setup.</p>
    {!picture && <button type="button" onClick={() => void run()} disabled={running} className="claw-btn claw-btn-solid mt-4 disabled:opacity-50">{running ? "Calling NASA…" : error ? "Try NASA again" : "Try NASA free"}</button>}
    {running && <p role="status" className="mt-3 text-sm">Waiting for NASA’s response…</p>}
    {error && <p role="alert" className="mt-3 text-sm">{error}</p>}
    {picture && <div role="status" className="mt-4">
      <p className="text-sm text-[var(--text-secondary)]">NASA replied successfully{picture.date ? ` · ${picture.date}` : ""}</p>
      <h3 className="mt-2 font-medium">{picture.title}</h3>
      {picture.explanation && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">{picture.explanation}</p>}
    </div>}
  </section>;
}
