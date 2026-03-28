"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { SOW_CUSTOMERS, type SowSection } from "@/lib/sow-data";
import DealRoom from "@/components/DealRoom";

export default function SowPage() {
  const router = useRouter();
  const params = useParams() as { customerId: string };
  const customerId = params.customerId;
  const customer = SOW_CUSTOMERS[customerId];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [alreadySigned, setAlreadySigned] = useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Check signing status on mount
  useEffect(() => {
    if (!customer) return;
    fetch(`/api/sow/status?customerId=${encodeURIComponent(customerId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.status === "signed") setAlreadySigned(true);
      })
      .catch(() => {});
  }, [customerId, customer]);

  // Pre-fill signer name from customer config
  useEffect(() => {
    if (customer?.customerRep) setSignerName(customer.customerRep);
  }, [customer]);

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-neutral-500">SoW not found.</div>
      </div>
    );
  }

  // Canvas drawing handlers
  const getPos = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const t = "touches" in e ? e.touches[0] : e;
    return {
      x: (t.clientX - rect.left) * (canvas.width / rect.width),
      y: (t.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!hasSignature) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    setIsDrawing(true);
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature || !signerName || !signerTitle) {
      setError("Please provide your signature, name, and title.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const signatureDataUrl = canvas.toDataURL("image/png");
      const res = await fetch("/api/sow/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          signatureDataUrl,
          signerName,
          signerTitle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signing failed");

      // Redirect: Stripe if paymentLink, otherwise success page
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        router.push(
          `/sow/success?customerId=${encodeURIComponent(customerId)}&signerName=${encodeURIComponent(signerName)}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    hasSignature &&
    signerName.trim() &&
    signerTitle.trim() &&
    !isSubmitting &&
    !alreadySigned;

  // Section renderer — handles content, items, phases, groups
  const renderSection = (section: SowSection, idx: number) => (
    <div key={idx}>
      <h2 className="text-base font-semibold text-red-600 border-b-2 border-red-100 pb-2 mb-4 uppercase tracking-wide text-xs">
        {section.title}
      </h2>

      {section.content && (
        <div className="space-y-3 text-neutral-600 text-sm leading-relaxed">
          {section.content.map((text, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: text }} />
          ))}
        </div>
      )}

      {section.items && (
        <div className="space-y-2">
          {section.items.map((item, i) => (
            <div
              key={i}
              className="bg-neutral-50 border border-neutral-100 rounded-lg p-3"
            >
              <span className="font-semibold text-neutral-800 text-sm">
                {item.label}:
              </span>{" "}
              <span className="text-neutral-600 text-sm">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {section.phases && (
        <div className="space-y-3">
          {section.phases.map((phase, i) => (
            <div
              key={i}
              className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg"
            >
              <h3 className="font-semibold text-red-800 text-sm">
                {phase.name}
              </h3>
              <p className="text-neutral-600 mt-1 text-sm">{phase.desc}</p>
            </div>
          ))}
        </div>
      )}

      {section.groups && (
        <div className="space-y-6">
          {section.groups.map((group, gi) => (
            <div key={gi}>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                {group.label}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {group.apis.map((api, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium
                      ${api.status === "live" ? "bg-neutral-50 border-neutral-100 text-neutral-700" : ""}
                      ${api.status === "blocked" ? "bg-red-50 border-red-100 text-red-700" : ""}
                      ${api.status === "unavailable" ? "bg-neutral-50 border-neutral-100 text-neutral-400" : ""}
                    `}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                      ${api.status === "live" ? "bg-green-500" : ""}
                      ${api.status === "blocked" ? "bg-red-400" : ""}
                      ${api.status === "unavailable" ? "bg-neutral-300" : ""}
                    `}
                    />
                    <span className="truncate">{api.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-3 pt-3 border-t border-neutral-100">
            {[
              { color: "bg-green-500", label: "Live" },
              { color: "bg-red-400", label: "Blocked \u2014 subscription tier" },
              { color: "bg-neutral-300", label: "Unavailable at integration" },
            ].map((leg) => (
              <div
                key={leg.label}
                className="flex items-center gap-1.5 text-xs text-neutral-500"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${leg.color}`} />
                {leg.label}
              </div>
            ))}
          </div>
          {section.note && (
            <p className="text-xs text-neutral-400 italic">{section.note}</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl">{"\uD83E\uDD9E"}</span>
            <div className="text-left">
              <span className="text-2xl font-bold text-neutral-900">
                APIClaw \u00d7 {customer.customerName.split("/")[0].trim()}
              </span>
              <p className="text-sm text-neutral-500">
                The API Layer for AI Agents
              </p>
            </div>
          </div>
          <div className="h-1 w-24 bg-gradient-to-r from-red-500 to-red-600 mx-auto mb-4 rounded-full" />
          <h1 className="text-2xl font-bold text-neutral-800">
            Partnership Agreement
          </h1>
          <p className="text-neutral-500 mt-1">{customer.vertical}</p>
        </div>
      </header>

      {customer.showDealRoom && (
        <DealRoom partnerId={customerId} current="sow" />
      )}

      {/* Content */}
      <main className="max-w-3xl mx-auto py-2 px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8 space-y-8">
            {customer.sections.map(renderSection)}

            {/* Signatures */}
            <div className="border-t-2 border-neutral-200 pt-8 mt-8">
              <h2 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-6">
                Signatures
              </h2>

              {alreadySigned && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  This agreement has already been signed.
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                {/* Gustav - pre-signed */}
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-neutral-500 mb-4">
                    APIClaw / NordSym AB
                  </h3>
                  <div className="border-b border-neutral-300 pb-2 mb-2 h-16 flex items-end">
                    <span className="font-['Brush_Script_MT',cursive] text-2xl text-neutral-800">
                      Gustav Hemmingsson
                    </span>
                  </div>
                  <div className="text-sm text-neutral-600">
                    <strong className="text-neutral-900 block">
                      Gustav Hemmingsson
                    </strong>
                    CEO, NordSym AB
                    <br />
                    Date: {today}
                  </div>
                </div>

                {/* Partner signs here */}
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-neutral-500 mb-4">
                    {customer.customerName}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">
                        Draw your signature
                      </label>
                      <canvas
                        ref={canvasRef}
                        width={320}
                        height={110}
                        className="border border-neutral-300 rounded-lg cursor-crosshair touch-none bg-white w-full"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <button
                        onClick={clearSignature}
                        className="text-xs text-red-600 hover:text-red-700 mt-1"
                      >
                        Clear signature
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={signerTitle}
                        onChange={(e) => setSignerTitle(e.target.value)}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                      />
                    </div>
                    <p className="text-xs text-neutral-400">Date: {today}</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-lg font-semibold
                           hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all shadow-lg hover:shadow-xl text-sm"
                >
                  {isSubmitting
                    ? "Signing..."
                    : customer.paymentLink
                      ? "Sign & Continue to Payment"
                      : "Sign Partnership Agreement"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-neutral-50 border-t border-neutral-200 px-8 py-4 text-center text-xs text-neutral-400">
            <p>
              {"\uD83E\uDD9E"} APIClaw \u00d7{" "}
              {customer.customerName.split("/")[0].trim()} Partnership Agreement
              \u00b7 {today}
            </p>
            <p className="mt-1">
              Questions?{" "}
              <a
                href="mailto:gustav@nordsym.com"
                className="text-red-600 hover:underline"
              >
                gustav@nordsym.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
