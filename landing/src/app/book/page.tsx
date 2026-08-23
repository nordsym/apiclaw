"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ArrowRight, ChevronLeft } from "lucide-react";
import { getWorkspaceSessionToken } from "@/lib/workspace-session";
import { SiteHeader } from "@/components/home/SiteHeader";
import { SiteFooter } from "@/components/home/SiteFooter";

const INPUT = "h-11 w-full rounded-[10px] border border-border bg-surface px-3.5 text-[14.5px] text-text-primary placeholder:text-text-muted focus:border-text-muted focus:outline-none";
const LABEL = "mb-1.5 block text-[13px] text-text-muted";

const ALL_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function pastSlotsForDate(d: Date): Set<string> {
  const now = new Date();
  if (!isSameLocalDay(d, now)) return new Set();
  const cutoff = now.getHours() * 60 + now.getMinutes() + 30;
  return new Set(
    ALL_SLOTS.filter(s => {
      const [h, m] = s.split(":").map(Number);
      return h * 60 + m < cutoff;
    })
  );
}

function BookForm() {
  const searchParams = useSearchParams();
  const now = new Date();
  const defaultDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Pre-fill from URL params or the same-origin workspace session cookie.
  useEffect(() => {
    const urlEmail = searchParams?.get("email");
    if (urlEmail) { setEmail(urlEmail); return; }
    void (async () => {
      try {
        const token = await getWorkspaceSessionToken();
      if (token) {
        fetch(`https://adventurous-avocet-799.convex.cloud/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: "workspaces:getWorkspaceByToken", args: { token } }),
        }).then(r => r.json()).then(d => {
          if (d?.value?.email) setEmail(d.value.email);
        }).catch(() => {});
      }
      } catch { /* ignore */ }
    })();
  }, [searchParams]);
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(defaultDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(defaultDate.getMonth());
  const [calYear, setCalYear] = useState(defaultDate.getFullYear());
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthName = new Date(calYear, calMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDow = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevDays = new Date(calYear, calMonth, 0).getDate();
  const DOWS = ["M", "T", "W", "T", "F", "S", "S"];

  const changeMonth = (delta: number) => {
    let m = calMonth + delta;
    let y = calYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCalMonth(m);
    setCalYear(y);
  };

  // Past-time slots for today; the n8n backend is the source of truth for real conflicts and returns 409 if a slot is actually booked.
  const taken = selectedDate ? pastSlotsForDate(selectedDate) : new Set<string>();

  const handleSubmit = async () => {
    if (!name || !email || !selectedDate || !selectedTime) return;
    setStatus("loading");
    try {
      const res = await fetch("https://nordsym.app.n8n.cloud/webhook/aeo-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, company,
          notes: message, message,
          date: formatDate(selectedDate),
          time: selectedTime,
          requestedDate: formatDate(selectedDate),
          requestedTime: selectedTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Stockholm",
          source: "apiclaw-enterprise",
          bookedVia: "APIClaw Enterprise",
          meetingTitle: `APIClaw Enterprise${company ? ` \u2014 ${company}` : ""}`,
          // host omitted: Prepare Data default routes to Gustav
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const calCells: React.ReactNode[] = DOWS.map((d, i) => (
    <div key={`dow-${i}`} className="py-1 text-center text-[12px] text-text-muted">{d}</div>
  ));
  for (let i = 0; i < firstDow; i++) {
    calCells.push(<div key={`prev-${i}`} className="py-1.5 text-center text-[13px] text-text-muted opacity-30">{prevDays - firstDow + i + 1}</div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(calYear, calMonth, day);
    const isPast = d < today;
    const isSel = selectedDate?.toDateString() === d.toDateString();
    calCells.push(
      <button key={`day-${day}`} disabled={isPast} onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
        className={`w-full rounded-[8px] py-1.5 text-center text-[13px] transition-colors
          ${isSel ? "bg-text-primary text-background font-medium" : isPast ? "text-text-muted opacity-30 cursor-not-allowed" : "text-text-primary hover:bg-surface-elevated"}`}>
        {day}
      </button>
    );
  }
  const trailing = (7 - ((firstDow + daysInMonth) % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    calCells.push(<div key={`next-${i}`} className="py-1.5 text-center text-[13px] text-text-muted opacity-30">{i}</div>);
  }

  if (status === "done") {
    return (
      <main className="claw min-h-screen overflow-x-hidden">
        <SiteHeader />
        <div className="claw-container">
          <div className="mx-auto max-w-[32rem] py-16 sm:py-20">
            <Check className="h-6 w-6 text-text-primary" aria-hidden="true" />
            <h1 className="claw-display mt-6 text-[2.2rem] sm:text-[2.75rem]">Meeting booked</h1>
            <p className="claw-lede mt-5">Check <strong className="font-semibold text-text-primary">{email}</strong> for confirmation.</p>
            <p className="mt-3 text-[15px] leading-[1.65] text-text-secondary">The team will be in touch to confirm details.</p>
            <a href="https://apiclaw.cloud" className="claw-link mt-8 inline-flex items-center gap-2 text-[14.5px]">
              Back to APIClaw <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="claw min-h-screen overflow-x-hidden">
      <SiteHeader />

      <div className="claw-container">
        <div className="mx-auto max-w-[32rem] py-16 sm:py-20">
          {/* Back link: goes to workspace if came from there, else homepage */}
          <a
            href={searchParams?.get("email") ? "/workspace" : "/"}
            className="claw-link inline-flex items-center gap-1 text-[13.5px]"
          >
            <ChevronLeft className="w-4 h-4" />
            {searchParams?.get("email") ? "Workspace" : "Home"}
          </a>

          <p className="claw-eyebrow mt-8">Enterprise</p>
          <h1 className="claw-display mt-4 text-[2.2rem] sm:text-[2.75rem]">Book a call</h1>
          <p className="claw-lede mt-5">Tell us about your setup and pick a time. The team will reach out to confirm.</p>

          <div className="mt-12 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" type="email" className={INPUT} />
              </div>
            </div>
            <div>
              <label className={LABEL}>Company</label>
              <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>What do you want to discuss?</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                placeholder="Custom call limits, private deployment, API partnerships..."
                className="w-full resize-none rounded-[10px] border border-border bg-surface px-3.5 py-3 text-[14.5px] leading-[1.55] text-text-primary placeholder:text-text-muted focus:border-text-muted focus:outline-none" />
            </div>

            <div className="claw-rule" />

            {/* Calendar */}
            <div>
              <p className={LABEL}>Date</p>
              <div className="rounded-[14px] border border-border-subtle bg-surface">
                <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
                  <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="claw-link flex h-8 w-8 items-center justify-center rounded-[8px] text-[15px]">‹</button>
                  <span className="text-[14px] font-medium text-text-primary">{monthName}</span>
                  <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="claw-link flex h-8 w-8 items-center justify-center rounded-[8px] text-[15px]">›</button>
                </div>
                <div className="grid grid-cols-7 gap-0.5 p-3">{calCells}</div>
              </div>
            </div>

            {/* Time slots */}
            <div>
              <p className={LABEL}>
                {selectedDate
                  ? <>Available times, {Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()?.replace("_", " ")}</>
                  : "Time"}
              </p>
              {selectedDate ? (
                <div className="grid grid-cols-4 gap-2">
                  {ALL_SLOTS.map(slot => {
                    const isTaken = taken.has(slot);
                    const isSel = selectedTime === slot;
                    return (
                      <button key={slot} type="button" disabled={isTaken} onClick={() => setSelectedTime(slot)}
                        className={`h-10 rounded-[10px] border text-[13.5px] transition-colors ${isSel ? "border-text-primary bg-text-primary text-background font-medium" : isTaken ? "cursor-not-allowed border-border-subtle text-text-muted opacity-30" : "border-border text-text-primary hover:border-text-muted"}`}>
                        {slot}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="border-y border-border-subtle py-4 text-[14px] text-text-muted">
                  Select a date to see available times
                </p>
              )}
            </div>

            {status === "error" && (
              <p className="border-t border-border-subtle pt-4 text-[14px] leading-[1.6] text-text-secondary">
                Something went wrong. Email <a href="mailto:gustav@nordsym.com" className="claw-link underline">gustav@nordsym.com</a> directly.
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!name || !email || !selectedDate || !selectedTime || status === "loading"}
              className="claw-btn claw-btn-solid w-full disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "loading" ? "Booking..." : "Book call"}
              {status !== "loading" && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}

export default function BookPage() {
  return (
    <Suspense>
      <BookForm />
    </Suspense>
  );
}
