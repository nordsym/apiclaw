"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const customerId = searchParams?.get("customerId") || "";
  const signerName = searchParams?.get("signerName") || "Partner";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="bg-white border-b border-neutral-200 py-6 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <span className="text-3xl">{"\uD83E\uDD9E"}</span>
          <div>
            <span className="text-lg font-bold text-neutral-900">
              APIClaw.
            </span>
            <p className="text-xs text-neutral-500">Partnership Signed</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Agreement signed.
            </h1>
            <p className="text-neutral-600 text-sm mb-6">
              Thank you, {signerName.split(" ")[0]}. The signed partnership
              agreement has been sent to both parties via email.
            </p>

            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 text-left space-y-3 mb-8">
              <h2 className="text-sm font-semibold text-neutral-800">
                What happens next
              </h2>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">1.</span>
                  Check your email for the signed agreement PDF
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">2.</span>
                  Gustav will reach out within 24h to schedule the Week 1
                  kickoff
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">3.</span>
                  Partner Dashboard access will be provisioned
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/book/"
                className="inline-flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Book Kickoff Meeting
              </a>
              <a
                href="mailto:gustav@nordsym.com"
                className="inline-flex items-center justify-center border border-neutral-200 px-6 py-2.5 rounded-lg text-sm text-neutral-600 hover:border-neutral-300 transition-colors"
              >
                Contact Gustav
              </a>
            </div>
          </div>

          <div className="bg-neutral-50 border-t border-neutral-200 px-8 py-4 text-center text-xs text-neutral-400">
            {"\uD83E\uDD9E"} APIClaw Partnership{" "}
            {customerId ? `\u00b7 ${customerId}` : ""} \u00b7{" "}
            <a
              href="mailto:gustav@nordsym.com"
              className="text-red-600 hover:underline"
            >
              gustav@nordsym.com
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
      <SuccessContent />
    </Suspense>
  );
}
