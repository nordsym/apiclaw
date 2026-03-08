"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

// Type definitions
type MOUSection = {
  title: string;
  content?: string[];
  phases?: { name: string; desc: string }[];
};

type MOUPartner = {
  partnerName: string;
  partnerRepresentative: string;
  sections: MOUSection[];
};

// MOU content for partners
const mouContent: Record<string, MOUPartner> = {
  cqtinvest: {
    partnerName: "CQT Invest",
    partnerRepresentative: "Mohammed Alubeid",
    sections: [
      {
        title: "1. Parties",
        content: [
          "<strong>APIClaw</strong> (operated by NordSym AB, org.nr 559535-5768), represented by Gustav Hemmingsson, CEO",
          "<strong>CQT Invest</strong>, represented by Mohammed Alubeid (\"Molle\")"
        ]
      },
      {
        title: "2. Purpose",
        content: [
          "This Memorandum of Understanding establishes a framework for an advisory partnership between APIClaw/NordSym and CQT Invest, with the goal of:",
          "• Leveraging CQT Invest's network and strategic expertise to accelerate APIClaw's growth",
          "• Creating mutual value through introductions, advisory services, and business development",
          "• Building a long-term, trust-based collaboration with aligned incentives"
        ]
      },
      {
        title: "3. CQT Invest Provides",
        content: [
          "• <strong>Strategic Advisory:</strong> Business strategy, market positioning, and growth guidance",
          "• <strong>Network & Introductions:</strong> Access to relevant contacts, potential customers, partners, and investors",
          "• <strong>Business Development Support:</strong> Assistance with deal structuring, negotiations, and market expansion"
        ]
      },
      {
        title: "4. APIClaw / NordSym Provides",
        content: [
          "• <strong>Product Access:</strong> Full access to APIClaw platform and services",
          "• <strong>Revenue Share:</strong> Success fee on deals and customers referred by CQT Invest (terms to be agreed per deal)",
          "• <strong>Collaboration:</strong> Open communication and joint exploration of opportunities"
        ]
      },
      {
        title: "5. Terms & Conditions",
        content: [
          "• <strong>Non-Exclusive:</strong> This partnership does not restrict either party from engaging with other partners or advisors",
          "• <strong>Good Faith:</strong> Both parties commit to acting in good faith and maintaining open, honest communication",
          "• <strong>Confidentiality:</strong> Business information shared between parties shall be treated as confidential",
          "• <strong>Flexibility:</strong> Specific terms for individual deals or projects will be agreed upon as opportunities arise"
        ]
      },
      {
        title: "6. Duration",
        content: [
          "This MOU is effective from the date of signing and remains in effect until terminated by either party with 30 days written notice. Existing commitments and revenue share agreements shall survive termination."
        ]
      },
      {
        title: "7. Non-Binding Intent",
        content: ["This MOU represents a statement of intent and mutual commitment. While it establishes the framework for collaboration, specific commercial terms for individual deals will be documented separately as they arise."]
      }
    ]
  },
  apilayer: {
    partnerName: "APILayer",
    partnerRepresentative: "Pratham Kumar",
    sections: [
      {
        title: "1. Parties",
        content: [
          "<strong>APIClaw</strong> (operated by NordSym AB, org.nr 559535-5768), represented by Gustav Hemmingsson, CEO",
          "<strong>APILayer</strong> (apilayer Data Products GmbH), represented by Pratham Kumar"
        ]
      },
      {
        title: "2. Purpose",
        content: [
          "This MOU establishes a framework for exploring a mutually beneficial partnership between APIClaw and APILayer, with the goal of:",
          "• Putting APILayer's APIs in front of AI Agents",
          "• Providing APILayer with featured provider status and attribution within APIClaw",
          "• Exploring co-marketing opportunities that leverage both parties' strengths",
          "• Enabling AI agents to discover and use APILayer APIs"
        ]
      },
      {
        title: "3. Proposed Collaboration",
        phases: [
          { name: "Phase 1: Discovery Integration", desc: "APIClaw indexes APILayer's catalog with AI-optimized metadata. APILayer receives featured provider status and appropriate attribution as mutually agreed." },
          { name: "Phase 2: Direct Call Pilot", desc: "Pilot integration enabling AI agents to access select APILayer APIs directly through APIClaw. Both parties evaluate performance and user adoption." },
          { name: "Phase 3: Scale & Co-Marketing", desc: "Based on pilot learnings, parties discuss expanded integration, co-marketing initiatives, and commercial terms that reflect the value created." }
        ]
      },
      {
        title: "4. Non-Binding Intent",
        content: ["This MOU represents a statement of intent and is <strong>not legally binding</strong>. It serves as a foundation for further discussions and the potential development of a formal partnership agreement."]
      },
      {
        title: "5. Confidentiality",
        content: ["Both parties agree to treat any shared business information, technical details, and strategic discussions as confidential."]
      },
      {
        title: "6. Next Steps",
        content: [
          "• Set up Telegram group for technical coordination",
          "• Agree on pilot APIs and integration approach",
          "• Launch pilot, iterate based on learnings, and refine approach together"
        ]
      }
    ]
  }
};

export default function MOUPage() {
  const params = useParams();
  const partnerId = params.partnerId as string;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  // Default values per partner
  const partnerDefaults: Record<string, { name: string; title: string }> = {
    cqtinvest: { name: "Mohammed Alubeid", title: "Partner" },
    apilayer: { name: "", title: "" },
  };
  const defaults = partnerDefaults[partnerId] || { name: "", title: "" };
  
  const [signerName, setSignerName] = useState(defaults.name);
  const [signerTitle, setSignerTitle] = useState(defaults.title);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const mou = mouContent[partnerId as keyof typeof mouContent];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

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
    if (!hasSignature || !signerName || !signerTitle) {
      setError("Please provide your signature, name, and title.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");
      
      const signatureDataUrl = canvas.toDataURL("image/png");
      
      // Save to Convex via API route
      const response = await fetch("/api/mou/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId,
          signatureDataUrl,
          signerName,
          signerTitle,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit signature");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mou) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900">MOU Not Found</h1>
          <p className="text-neutral-600 mt-2">Invalid partner ID</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">MOU Signed!</h1>
          <p className="text-neutral-600 mb-4">Thank you, {signerName}. Your signature has been recorded.</p>
          <p className="text-sm text-neutral-500">Gustav will be in touch shortly to schedule the next steps.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl">🦞</span>
            <div className="text-left">
              <span className="text-2xl font-bold text-neutral-900">APIClaw × {mou.partnerName}</span>
              <p className="text-sm text-neutral-500">The API Layer for AI Agents</p>
            </div>
          </div>
          <div className="h-1 w-24 bg-gradient-to-r from-red-500 to-red-600 mx-auto mb-4 rounded-full"></div>
          <h1 className="text-2xl font-bold text-neutral-800">Memorandum of Understanding</h1>
          <p className="text-neutral-500 mt-1">Partnership Framework Agreement</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8 space-y-8">
            {mou.sections.map((section, idx) => (
              <div key={idx}>
                <h2 className="text-lg font-semibold text-red-600 border-b-2 border-red-100 pb-2 mb-4">
                  {section.title}
                </h2>
                {section.content && (
                  <div className="space-y-3 text-neutral-600">
                    {section.content.map((text, i) => (
                      <p key={i} dangerouslySetInnerHTML={{ __html: text }} />
                    ))}
                  </div>
                )}
                {section.phases && (
                  <div className="space-y-4">
                    {section.phases.map((phase, i) => (
                      <div key={i} className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg">
                        <h3 className="font-semibold text-red-800">{phase.name}</h3>
                        <p className="text-neutral-600 mt-1">{phase.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Signatures */}
            <div className="border-t-2 border-neutral-200 pt-8 mt-8">
              <h2 className="text-lg font-semibold text-red-600 mb-6">Signatures</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* APIClaw signature (pre-signed) */}
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-neutral-500 mb-4">APIClaw / NordSym AB</h3>
                  <div className="border-b border-neutral-300 pb-2 mb-2 h-16 flex items-end">
                    <span className="font-['Brush_Script_MT',cursive] text-2xl text-neutral-800">Gustav Hemmingsson</span>
                  </div>
                  <div className="text-sm text-neutral-600">
                    <strong className="text-neutral-900 block">Gustav Hemmingsson</strong>
                    CEO, NordSym AB<br />
                    Date: March 5, 2026
                  </div>
                </div>

                {/* Partner signature (to be signed) */}
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-neutral-500 mb-4">{mou.partnerName}</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Draw your signature:</label>
                      <canvas
                        ref={canvasRef}
                        width={300}
                        height={100}
                        className="border border-neutral-300 rounded-lg cursor-crosshair touch-none bg-white"
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
                        className="text-sm text-red-600 hover:text-red-700 mt-1"
                      >
                        Clear signature
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        placeholder={mou.partnerRepresentative}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">Title</label>
                      <input
                        type="text"
                        value={signerTitle}
                        onChange={(e) => setSignerTitle(e.target.value)}
                        placeholder="e.g., Head of Developer Relations"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                      />
                    </div>

                    <p className="text-xs text-neutral-500">
                      Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
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
                  disabled={isSubmitting || !hasSignature || !signerName || !signerTitle}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-lg font-semibold 
                           hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? "Submitting..." : "Sign MOU"}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-neutral-50 border-t border-neutral-200 px-8 py-4 text-center text-sm text-neutral-500">
            <p>🦞 APIClaw × {mou.partnerName} Partnership MOU • March 2026</p>
            <p>Questions? Contact <a href="mailto:gustav@nordsym.com" className="text-red-600 hover:underline">gustav@nordsym.com</a></p>
          </div>
        </div>
      </main>
    </div>
  );
}
