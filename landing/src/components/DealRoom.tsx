"use client";

import Link from "next/link";

type Document = {
  label: string;
  href: string;
  status: "viewing" | "sign" | "signed" | "reference";
};

type Props = {
  partnerId: string;
  current: "mou" | "sow";
};

const partnerDocs: Record<string, Document[]> = {
  apilayer: [
    {
      label: "Memorandum of Understanding",
      href: "/mou/apilayer",
      status: "reference",
    },
    {
      label: "Partnership Agreement",
      href: "/sow/apilayer",
      status: "sign",
    },
  ],
  cqtinvest: [
    {
      label: "Memorandum of Understanding",
      href: "/mou/cqtinvest",
      status: "reference",
    },
  ],
};

function Badge({ status }: { status: Document["status"] }) {
  if (status === "viewing") {
    return (
      <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded flex-shrink-0">
        Viewing
      </span>
    );
  }
  if (status === "sign") {
    return (
      <span className="text-xs font-semibold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded flex-shrink-0">
        Sign →
      </span>
    );
  }
  if (status === "signed") {
    return (
      <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded flex-shrink-0">
        Signed ✓
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded flex-shrink-0">
      View
    </span>
  );
}

export default function DealRoom({ partnerId, current }: Props) {
  const docs = partnerDocs[partnerId];
  if (!docs) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <div className="bg-white border border-neutral-200 rounded-xl px-5 py-4 mb-4">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
          Deal Room
        </p>
        <div className="space-y-2">
          {docs.map((doc) => {
            const isCurrentMou = current === "mou" && doc.href.includes("/mou/");
            const isCurrentSow = current === "sow" && doc.href.includes("/sow/");
            const isCurrent = isCurrentMou || isCurrentSow;

            const effectiveStatus: Document["status"] = isCurrent
              ? "viewing"
              : doc.status;

            const isClickable = !isCurrent;
            const isPrimary = doc.status === "sign" && !isCurrent;

            const inner = (
              <>
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isCurrent
                      ? "bg-green-500"
                      : isPrimary
                      ? "bg-red-500 animate-pulse"
                      : "bg-neutral-300"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-neutral-800">
                    {doc.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs text-neutral-400 ml-2">
                      Current document
                    </span>
                  )}
                </div>
                <Badge status={effectiveStatus} />
              </>
            );

            if (!isClickable) {
              return (
                <div
                  key={doc.href}
                  className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-200"
                >
                  {inner}
                </div>
              );
            }

            return (
              <Link
                key={doc.href}
                href={doc.href}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors group ${
                  isPrimary
                    ? "border-red-200 bg-red-50 hover:bg-red-100"
                    : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
                }`}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
