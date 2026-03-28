"use client";

import { useState, useEffect } from "react";
import { Zap, Check, ArrowRight, Sun, Moon } from "lucide-react";

const ALL_SLOTS = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

function getTakenSlots(dateStr: string): string[] {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) seed += dateStr.charCodeAt(i);
  const shuffled = [...ALL_SLOTS];
  let rng = seed;
  for (let j = shuffled.length - 1; j > 0; j--) {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    const k = Math.abs(rng) % (j + 1);
    [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
  }
  return shuffled.slice(0, 3);
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BookPage() {
  const now = new Date();
  const defaultDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const dark = saved === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

  const taken = selectedDate ? getTakenSlots(formatDate(selectedDate)) : [];

  const handleSubmit = async () => {
    if (!name || !email || !selectedDate || !selectedTime) return;
    setStatus("loading");
    try {
      const res = await fetch("https://nordsym.app.n8n.cloud/webhook/apiclaw-enterprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, company, message,
          requestedDate: formatDate(selectedDate),
          requestedTime: selectedTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Stockholm",
          source: "apiclaw-enterprise-booking",
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const calCells: React.ReactNode[] = DOWS.map((d, i) => (
    <div key={`dow-${i}`} className="text-center text-xs text-[var(--text-muted)] font-medium py-1">{d}</div>
  ));
  for (let i = 0; i < firstDow; i++) {
    calCells.push(<div key={`prev-${i}`} className="text-center text-xs text-[var(--border)] py-1">{prevDays - firstDow + i + 1}</div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(calYear, calMonth, day);
    const isPast = d < today;
    const isSel = selectedDate?.toDateString() === d.toDateString();
    calCells.push(
      <button key={`day-${day}`} disabled={isPast} onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
        className={`w-full text-center text-xs py-1.5 rounded-lg transition-colors ${isSel ? "bg-[#ef4444] text-white font-bold" : isPast ? "text-[var(--border)] cursor-not-allowed" : "text-[var(--text-primary)] hover:bg-[#ef4444]/20"}`}>
        {day}
      </button>
    );
  }
  const trailing = (7 - ((firstDow + daysInMonth) % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    calCells.push(<div key={`next-${i}`} className="text-center text-xs text-[var(--border)] py-1">{i}</div>);
  }

  if (status === "done") {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Meeting booked</h1>
          <p className="text-[var(--text-muted)] mb-2">Check <strong>{email}</strong> for confirmation.</p>
          <p className="text-sm text-[var(--text-muted)]">Gustav will be in touch before the meeting.</p>
          <a href="https://apiclaw.nordsym.com" className="inline-flex items-center gap-2 mt-8 text-[#ef4444] text-sm hover:underline">
            Back to APIClaw <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#ef4444] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">APIClaw</span>
            <span className="text-[var(--text-muted)] ml-2 text-sm">Enterprise</span>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[var(--surface)] transition" aria-label="Toggle theme">
            {isDark ? <Sun className="w-4 h-4 text-[var(--text-muted)]" /> : <Moon className="w-4 h-4 text-[var(--text-muted)]" />}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-3">Book a call</h1>
          <p className="text-[var(--text-muted)]">Tell us about your setup and pick a time. Gustav will reach out to confirm.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left — form */}
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wide">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#ef4444]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wide">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" type="email"
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#ef4444]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wide">Company</label>
              <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#ef4444]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wide">What do you want to discuss?</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                placeholder="Custom call limits, private deployment, API partnerships..."
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#ef4444] resize-none" />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                Something went wrong. Email <a href="mailto:gustav@nordsym.com" className="underline">gustav@nordsym.com</a> directly.
              </p>
            )}
          </div>

          {/* Right — calendar + time */}
          <div className="space-y-4">
            {/* Calendar */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <button onClick={() => changeMonth(-1)} className="w-7 h-7 rounded-lg border border-[var(--border)] text-sm hover:border-[#ef4444]/50 transition flex items-center justify-center text-[var(--text-muted)]">‹</button>
                <span className="text-sm font-semibold">{monthName}</span>
                <button onClick={() => changeMonth(1)} className="w-7 h-7 rounded-lg border border-[var(--border)] text-sm hover:border-[#ef4444]/50 transition flex items-center justify-center text-[var(--text-muted)]">›</button>
              </div>
              <div className="grid grid-cols-7 p-3 gap-0.5">{calCells}</div>
            </div>

            {/* Time slots */}
            {selectedDate ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
                  Available times — {Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()?.replace("_", " ")}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {ALL_SLOTS.map(slot => {
                    const isTaken = taken.includes(slot);
                    const isSel = selectedTime === slot;
                    return (
                      <button key={slot} disabled={isTaken} onClick={() => setSelectedTime(slot)}
                        className={`py-2 text-xs rounded-xl border transition ${isSel ? "bg-[#ef4444] text-white border-[#ef4444] font-semibold" : isTaken ? "opacity-30 cursor-not-allowed border-[var(--border)] text-[var(--text-muted)]" : "border-[var(--border)] text-[var(--text-primary)] hover:border-[#ef4444]/50"}`}>
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-8 text-center text-sm text-[var(--text-muted)]">
                Select a date to see available times
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!name || !email || !selectedDate || !selectedTime || status === "loading"}
              className="w-full py-3 rounded-2xl bg-[#ef4444] text-white font-semibold hover:bg-[#dc2626] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === "loading" ? "Booking..." : "Book call"}
              {status !== "loading" && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
