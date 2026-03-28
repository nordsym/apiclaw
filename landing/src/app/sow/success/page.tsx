"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SOW_CUSTOMERS } from "@/lib/sow-data";

// ─── Types ──────────────────────────────────────────────────────────────────
interface State {
  step: number;
  name: string;
  email: string;
  title: string;
  company: string;
  primaryGoal: string;
  priorityApis: string;
  channels: string;
  agenda: string;
  selectedDate: Date | null;
  calMonth: number;
  calYear: number;
  selectedTime: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const STEPS = ["Contact", "Goals", "Agenda", "Book"];
const ALL_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

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

function autoAgenda(state: State): string {
  const lines = [
    "1. Partnership overview — confirm 27-API integration status and scope",
    "2. Distribution plan — timeline and ownership for announcement, blog post, and docs update",
    "3. Volume incentive model — agree on discount tiers or revenue share structure",
    "4. Partner dashboard walkthrough — real-time usage stats for all 27 APIs",
    "5. Next actions, owners, and 30-day milestones",
  ];
  if (state.primaryGoal) lines.unshift("Context: " + state.primaryGoal);
  if (state.priorityApis) lines.push("Priority APIs: " + state.priorityApis);
  return lines.join("\n");
}

function formatDate(d: Date): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Stepper({ step }: { step: number }) {
  return (
    <div className="grid grid-cols-4 gap-2 mb-6">
      {STEPS.map((name, i) => {
        const n = i + 1;
        const isActive = step === n;
        const isDone = step > n;
        return (
          <div
            key={n}
            className={`border rounded-full py-2 px-3 text-center text-xs font-medium transition-colors
              ${isActive ? "border-red-500 text-red-600 font-bold" : ""}
              ${isDone ? "border-green-500 text-green-600" : ""}
              ${!isActive && !isDone ? "border-neutral-200 text-neutral-400" : ""}
            `}
          >
            {n}. {name}
          </div>
        );
      })}
    </div>
  );
}

function CalendarPicker({
  state,
  onDateSelect,
  onMonthChange,
}: {
  state: State;
  onDateSelect: (d: Date) => void;
  onMonthChange: (delta: number) => void;
}) {
  const monthName = new Date(state.calYear, state.calMonth, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );
  const firstDow = (new Date(state.calYear, state.calMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(state.calYear, state.calMonth + 1, 0).getDate();
  const prevDays = new Date(state.calYear, state.calMonth, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const DOWS = ["M", "T", "W", "T", "F", "S", "S"];

  const cells: React.ReactNode[] = DOWS.map((d, i) => (
    <div key={`dow-${i}`} className="text-center text-xs text-neutral-400 font-semibold py-1">
      {d}
    </div>
  ));

  for (let i = 0; i < firstDow; i++) {
    cells.push(
      <div key={`prev-${i}`} className="text-center text-xs text-neutral-300 py-1">
        {prevDays - firstDow + i + 1}
      </div>
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(state.calYear, state.calMonth, day);
    const isPast = d < today;
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const isSel = state.selectedDate?.toDateString() === d.toDateString();
    const disabled = isPast || isWeekend;
    cells.push(
      <button
        key={`day-${day}`}
        disabled={disabled}
        onClick={() => onDateSelect(d)}
        className={`w-full text-center text-xs py-1.5 rounded-lg transition-colors
          ${isSel ? "bg-red-500 text-white font-bold" : ""}
          ${disabled ? "text-neutral-300 cursor-not-allowed" : !isSel ? "hover:border hover:border-red-300 text-neutral-700" : ""}
        `}
      >
        {day}
      </button>
    );
  }

  const trailing = (7 - ((firstDow + daysInMonth) % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    cells.push(
      <div key={`next-${i}`} className="text-center text-xs text-neutral-300 py-1">
        {i}
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 bg-neutral-50">
        <button
          onClick={() => onMonthChange(-1)}
          className="w-7 h-7 border border-neutral-200 rounded-lg text-sm hover:border-red-300 transition-colors"
        >
          ‹
        </button>
        <span className="text-xs font-bold text-neutral-700">{monthName}</span>
        <button
          onClick={() => onMonthChange(1)}
          className="w-7 h-7 border border-neutral-200 rounded-lg text-sm hover:border-red-300 transition-colors"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 p-2 gap-0.5">{cells}</div>
    </div>
  );
}

function TimeSlots({
  state,
  onSelect,
}: {
  state: State;
  onSelect: (time: string) => void;
}) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Stockholm";
  const tzShort = tz.split("/").pop()?.replace("_", " ") ?? "Stockholm";

  if (!state.selectedDate) {
    return (
      <div className="border border-neutral-200 rounded-xl p-4 flex items-center justify-center h-full">
        <p className="text-xs text-neutral-400 text-center">
          Select a date to see available times
        </p>
      </div>
    );
  }

  const dateStr = formatDate(state.selectedDate);
  const taken = getTakenSlots(dateStr);

  return (
    <div className="border border-neutral-200 rounded-xl p-4">
      <div className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">
        Available Times{" "}
        <span className="font-normal opacity-60 ml-1">({tzShort})</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {ALL_SLOTS.map((slot) => {
          const isTaken = taken.includes(slot);
          const isSel = state.selectedTime === slot;
          return (
            <button
              key={slot}
              disabled={isTaken}
              onClick={() => onSelect(slot)}
              className={`py-2 text-xs rounded-lg border transition-colors
                ${isSel ? "bg-red-500 text-white border-red-500 font-bold" : ""}
                ${isTaken ? "opacity-30 cursor-not-allowed border-neutral-200 text-neutral-400" : !isSel ? "border-neutral-200 text-neutral-600 hover:border-red-300" : ""}
              `}
            >
              {slot}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-neutral-400 mt-3">{tzShort} time</p>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

function OnboardingWizard() {
  const searchParams = useSearchParams();
  const customerId = searchParams?.get("customerId") || "";
  const customer = SOW_CUSTOMERS[customerId];

  const [state, setState] = useState<State>(() => {
    const now = new Date();
    const defaultDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
    return {
      step: 1,
      name: searchParams?.get("signerName") || customer?.customerRep || "",
      email: customer?.partnerEmail || "",
      title: "",
      company: customer?.customerName.split("(")[0].trim().split("/")[0].trim() || "",
      primaryGoal: "",
      priorityApis: "",
      channels: "",
      agenda: "",
      selectedDate: defaultDate,
      calMonth: defaultDate.getMonth(),
      calYear: defaultDate.getFullYear(),
      selectedTime: null,
    };
  });

  const [bookingStatus, setBookingStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [bookingError, setBookingError] = useState("");

  const update = (patch: Partial<State>) => setState((s) => ({ ...s, ...patch }));
  const next = () => update({ step: Math.min(4, state.step + 1) });
  const prev = () => update({ step: Math.max(1, state.step - 1) });

  const handleBook = async () => {
    if (!state.selectedDate || !state.selectedTime) return;
    setBookingStatus("loading");
    try {
      const res = await fetch("/api/sow/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          customerName: customer?.customerName.split("(")[0].trim().split("/")[0].trim() || customerId,
          signerName: state.name,
          signerEmail: state.email,
          signerTitle: state.title,
          company: state.company,
          requestedDate: formatDate(state.selectedDate),
          requestedTime: state.selectedTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Stockholm",
          agenda: state.agenda,
          primaryGoal: state.primaryGoal,
          priorityApis: state.priorityApis,
          channels: state.channels,
        }),
      });
      if (!res.ok) throw new Error("Booking failed");
      setBookingStatus("done");
    } catch {
      setBookingStatus("error");
      setBookingError("Something went wrong. Please email support@nordsym.com directly.");
    }
  };

  // ─── Step renders ─────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div>
      <h2 className="text-base font-bold text-neutral-900 mb-4">Contact Details</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { label: "Full name", key: "name" as const, value: state.name },
          { label: "Work email", key: "email" as const, value: state.email },
          { label: "Title", key: "title" as const, value: state.title },
          { label: "Company", key: "company" as const, value: state.company },
        ].map(({ label, key, value }) => (
          <div key={key}>
            <label className="block text-xs text-neutral-500 mb-1">{label}</label>
            <input
              type={key === "email" ? "email" : "text"}
              value={value}
              onChange={(e) => update({ [key]: e.target.value })}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-neutral-50"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={() => {
            if (!state.name || !state.email) return;
            next();
          }}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h2 className="text-base font-bold text-neutral-900 mb-4">Partnership Goals</h2>
      <div className="space-y-3">
        {[
          {
            label: "Primary goal for this partnership",
            key: "primaryGoal" as const,
            value: state.primaryGoal,
            placeholder: "e.g. Increase API adoption among AI developers, expand into agent tooling market...",
            rows: 3,
          },
          {
            label: "Which APILayer APIs are highest priority?",
            key: "priorityApis" as const,
            value: state.priorityApis,
            placeholder: "e.g. Fixer, Mediastack, IPstack...",
            rows: 2,
          },
          {
            label: "Distribution channels available",
            key: "channels" as const,
            value: state.channels,
            placeholder: "e.g. 50k developer email list, apilayer.com blog, social...",
            rows: 2,
          },
        ].map(({ label, key, value, placeholder, rows }) => (
          <div key={key}>
            <label className="block text-xs text-neutral-500 mb-1">{label}</label>
            <textarea
              value={value}
              onChange={(e) => update({ [key]: e.target.value })}
              placeholder={placeholder}
              rows={rows}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-neutral-50 resize-none"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4">
        <button onClick={prev} className="border border-neutral-200 px-4 py-2 rounded-lg text-sm text-neutral-600 hover:border-neutral-300 transition-colors">
          Back
        </button>
        <button
          onClick={() => {
            update({ agenda: autoAgenda(state) });
            next();
          }}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const agenda = state.agenda || autoAgenda(state);
    return (
      <div>
        <h2 className="text-base font-bold text-neutral-900 mb-2">Kickoff Meeting Agenda</h2>
        <p className="text-xs text-neutral-500 mb-3">
          Pre-filled based on your input. Edit as needed — this will be shared with both parties.
        </p>
        <textarea
          value={agenda}
          onChange={(e) => update({ agenda: e.target.value })}
          rows={10}
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-neutral-50 resize-none font-mono"
        />
        <div className="flex justify-between mt-4">
          <button onClick={prev} className="border border-neutral-200 px-4 py-2 rounded-lg text-sm text-neutral-600 hover:border-neutral-300 transition-colors">
            Back
          </button>
          <button
            onClick={() => {
              if (!agenda.trim()) return;
              update({ agenda });
              next();
            }}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Book Meeting
          </button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    if (bookingStatus === "done") {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Kickoff booked.</h2>
          <p className="text-neutral-600 text-sm mb-1">
            Check <strong>{state.email}</strong> for your Google Meet invite.
          </p>
          <p className="text-neutral-400 text-xs mt-4">
            Gustav and Molle will reach out before the meeting with any prep material.
          </p>
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-base font-bold text-neutral-900 mb-1">Book Kickoff Meeting</h2>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-neutral-500">Meeting with</span>
          {[
            { initials: "G", name: "Gustav" },
            { initials: "M", name: "Molle" },
            { initials: state.name.charAt(0).toUpperCase(), name: state.name.split(" ")[0] },
          ].map((p) => (
            <span key={p.initials} className="inline-flex items-center gap-1.5 bg-neutral-100 border border-neutral-200 rounded-full px-2.5 py-1 text-xs font-medium text-neutral-700">
              <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {p.initials}
              </span>
              {p.name}
            </span>
          ))}
          <span className="text-xs text-neutral-400">· Invite to {state.email}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <CalendarPicker
            state={state}
            onDateSelect={(d) => update({ selectedDate: d, selectedTime: null })}
            onMonthChange={(delta) => {
              let m = state.calMonth + delta;
              let y = state.calYear;
              if (m < 0) { m = 11; y--; }
              if (m > 11) { m = 0; y++; }
              update({ calMonth: m, calYear: y });
            }}
          />
          <TimeSlots
            state={state}
            onSelect={(time) => update({ selectedTime: time })}
          />
        </div>
        {bookingStatus === "error" && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            {bookingError}
          </p>
        )}
        <div className="flex justify-between">
          <button onClick={prev} className="border border-neutral-200 px-4 py-2 rounded-lg text-sm text-neutral-600 hover:border-neutral-300 transition-colors">
            Back
          </button>
          <button
            onClick={handleBook}
            disabled={!state.selectedDate || !state.selectedTime || bookingStatus === "loading"}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg text-sm font-semibold
                     hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {bookingStatus === "loading" ? "Booking..." : "Book Kickoff"}
          </button>
        </div>
      </div>
    );
  };

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="bg-white border-b border-neutral-200 py-6 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{"\uD83E\uDD9E"}</span>
            <div>
              <span className="text-lg font-bold text-neutral-900">APIClaw.</span>
              <p className="text-xs text-neutral-500">Partnership Onboarding</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 mr-1">Your team</span>
            {[
              { initials: "G", name: "Gustav Hemmingsson", title: "CEO, NordSym" },
              { initials: "M", name: "Molle Al", title: "Partner, NordSym" },
            ].map((p) => (
              <div key={p.initials} className="relative group">
                <div className="w-8 h-8 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center cursor-default ring-2 ring-white">
                  {p.initials}
                </div>
                <div className="absolute right-0 top-10 bg-neutral-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-neutral-400">{p.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">
                  Agreement signed, {state.name.split(" ")[0]}.
                </h1>
                <p className="text-neutral-500 text-xs">
                  A signed copy has been emailed to both parties. Let&apos;s set up your kickoff.
                </p>
              </div>
            </div>

            <div className="h-1 w-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full my-6" />

            <Stepper step={state.step} />

            <div className="border border-neutral-100 rounded-xl p-5 bg-neutral-50">
              {stepContent[state.step - 1]()}
            </div>
          </div>

          <div className="bg-neutral-50 border-t border-neutral-200 px-8 py-4 text-center text-xs text-neutral-400">
            {"\uD83E\uDD9E"} APIClaw × {customer?.customerName.split("(")[0].trim().split("/")[0].trim() || customerId} Partnership ·{" "}
            <a href="mailto:support@nordsym.com" className="text-red-600 hover:underline">
              support@nordsym.com
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
          <div className="text-neutral-400 text-sm">Loading...</div>
        </div>
      }
    >
      <OnboardingWizard />
    </Suspense>
  );
}
