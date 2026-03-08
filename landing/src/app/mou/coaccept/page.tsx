"use client";

import { useEffect, useRef, useState } from "react";

export default function CoAcceptMOU() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

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
      const response = await fetch("/api/mou/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: "coaccept",
          signatureDataUrl,
          signerName,
          signerTitle,
        }),
      });
      if (!response.ok) throw new Error("Failed to submit signature");
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#fafafa]">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center border border-gray-200">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">MOU Signed!</h1>
          <p className="text-gray-600 mb-4">Thank you {signerName}. Your signature has been recorded.</p>
          <p className="text-sm text-gray-500">Gustav will be in touch regarding next steps and technical coordination.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-5xl mb-4">🦞</div>
          <h1 className="text-2xl font-bold text-gray-900">APIClaw × CoAccept</h1>
          <p className="text-gray-600 mt-1">Integration Partnership</p>
          <div className="h-1 w-20 bg-red-600 mx-auto mt-4 rounded-full"></div>
          <p className="mt-4 text-sm text-gray-500">Memorandum of Understanding • Draft</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <div className="p-8 space-y-8">
            
            {/* Section 1: Parties */}
            <div>
              <h2 className="text-lg font-semibold text-red-600 border-b-2 border-gray-100 pb-2 mb-4">
                1. Parties
              </h2>
              <div className="space-y-3 text-gray-600">
                <p><strong className="text-gray-900">APIClaw / NordSym AB</strong> (org.nr 559535-5768), represented by Gustav Hemmingsson, CEO</p>
                <p><strong className="text-gray-900">CoAccept</strong>, represented by Gustav Frändfors and Alexander Nystedt</p>
              </div>
            </div>

            {/* Section 2: Purpose */}
            <div>
              <h2 className="text-lg font-semibold text-red-600 border-b-2 border-gray-100 pb-2 mb-4">
                2. Purpose
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>This MOU establishes a framework for integrating CoAccept's invoice services with APIClaw, enabling:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-gray-900">Agent Access:</strong> CoAccept customers can use AI agents to send invoices via APIClaw</li>
                  <li><strong className="text-gray-900">Seamless Onboarding:</strong> CoAccept users get streamlined access to APIClaw via invite links</li>
                  <li><strong className="text-gray-900">User-Level Authentication:</strong> Each user's actions are attributed to their CoAccept identity</li>
                  <li><strong className="text-gray-900">Audit Trail Integrity:</strong> CoAccept maintains full visibility of which user performed each action</li>
                </ul>
              </div>
            </div>

            {/* Section 3: Proposed Technical Integration */}
            <div>
              <h2 className="text-lg font-semibold text-red-600 border-b-2 border-gray-100 pb-2 mb-4">
                3. Proposed Technical Integration
              </h2>
              <div className="space-y-4 text-gray-600">
                <p><strong className="text-gray-900">Recommended Approach: User-ID Header</strong></p>
                <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
                  <p className="text-gray-500"># APIClaw calls CoAccept API with:</p>
                  <p>Authorization: Bearer {"<master_key>"}</p>
                  <p>X-CoAccept-User-Id: {"<user_id>"}</p>
                </div>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-gray-900">CoAccept provides:</strong> Master service key to APIClaw</li>
                  <li><strong className="text-gray-900">APIClaw provides:</strong> User-ID header on each request, mapped from workspace</li>
                  <li><strong className="text-gray-900">CoAccept validates:</strong> User-ID against their customer database</li>
                </ul>
                <p className="text-sm italic">Note: Alternative approaches (sub-keys, OAuth) can be explored based on CoAccept's technical preferences.</p>
              </div>
            </div>

            {/* Section 4: User Onboarding Flow */}
            <div>
              <h2 className="text-lg font-semibold text-red-600 border-b-2 border-gray-100 pb-2 mb-4">
                4. User Onboarding Flow
              </h2>
              <div className="space-y-3 text-gray-600">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>CoAccept user receives invite link from CoAccept (e.g., <code className="bg-gray-100 px-1 rounded">apiclaw.com/invite/coaccept?user=123</code>)</li>
                  <li>User creates APIClaw workspace (email verification)</li>
                  <li>Workspace is automatically linked to CoAccept user ID</li>
                  <li>User connects any MCP-compatible AI agent to APIClaw</li>
                  <li>Agent can now send invoices via natural language commands</li>
                </ol>
              </div>
            </div>

            {/* Section 5: CoAccept Provides */}
            <div>
              <h2 className="text-lg font-semibold text-red-600 border-b-2 border-gray-100 pb-2 mb-4">
                5. CoAccept Provides
              </h2>
              <div className="space-y-3 text-gray-600">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-gray-900">API Documentation:</strong> OpenAPI spec or equivalent</li>
                  <li><strong className="text-gray-900">Master Service Key:</strong> For APIClaw to make authenticated requests</li>
                  <li><strong className="text-gray-900">User-ID Validation:</strong> Endpoint or header support for user attribution</li>
                  <li><strong className="text-gray-900">Technical Contact:</strong> For integration coordination</li>
                </ul>
              </div>
            </div>

            {/* Section 6: APIClaw Provides */}
            <div>
              <h2 className="text-lg font-semibold text-red-600 border-b-2 border-gray-100 pb-2 mb-4">
                6. APIClaw / NordSym Provides
              </h2>
              <div className="space-y-3 text-gray-600">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-gray-900">Integration Development:</strong> Build and maintain the CoAccept integration</li>
                  <li><strong className="text-gray-900">Invite System:</strong> Custom onboarding flow for CoAccept users</li>
                  <li><strong className="text-gray-900">MCP Compatibility:</strong> Works with Claude, GPT, and other MCP-enabled agents</li>
                  <li><strong className="text-gray-900">Usage Dashboard:</strong> Per-user analytics and audit logs</li>
                  <li><strong className="text-gray-900">Support:</strong> Technical support for integration issues</li>
                </ul>
              </div>
            </div>

            {/* Section 7: Commercial Terms */}
            <div>
              <h2 className="text-lg font-semibold text-red-600 border-b-2 border-gray-100 pb-2 mb-4">
                7. Commercial Terms
              </h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-gray-700">
                <p className="font-medium text-amber-800 mb-2">To Be Determined</p>
                <p className="text-sm">Specific pricing and revenue sharing will be agreed upon separately based on:</p>
                <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                  <li>Volume expectations and growth projections</li>
                  <li>Support and maintenance responsibilities</li>
                  <li>Co-marketing opportunities</li>
                </ul>
                <p className="text-sm mt-2 italic">Previous discussions have indicated flat-fee pricing per invoice. Final terms to be documented in a separate agreement.</p>
              </div>
            </div>

            {/* Section 8: Pilot Scope */}
            <div>
              <h2 className="text-lg font-semibold text-red-600 border-b-2 border-gray-100 pb-2 mb-4">
                8. Pilot Scope
              </h2>
              <div className="space-y-3 text-gray-600">
                <p><strong className="text-gray-900">Phase 1: Technical Integration</strong></p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>API documentation review</li>
                  <li>Integration architecture finalization</li>
                  <li>Development and testing</li>
                </ul>
                <p className="mt-3"><strong className="text-gray-900">Phase 2: Pilot Launch</strong></p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Limited rollout to select CoAccept customers</li>
                  <li>Feedback collection and iteration</li>
                  <li>Performance and reliability validation</li>
                </ul>
                <p className="mt-3"><strong className="text-gray-900">Phase 3: General Availability</strong></p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Full rollout to all CoAccept customers</li>
                  <li>Co-marketing and announcement</li>
                </ul>
              </div>
            </div>

            {/* Section 9: Data & Security */}
            <div>
              <h2 className="text-lg font-semibold text-red-600 border-b-2 border-gray-100 pb-2 mb-4">
                9. Data & Security
              </h2>
              <div className="space-y-3 text-gray-600">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-gray-900">No Data Storage:</strong> APIClaw does not store invoice content or recipient data</li>
                  <li><strong className="text-gray-900">Pass-Through Only:</strong> Requests are proxied to CoAccept's API in real-time</li>
                  <li><strong className="text-gray-900">Encryption:</strong> All API keys encrypted at rest, TLS in transit</li>
                  <li><strong className="text-gray-900">Audit Logging:</strong> All requests logged with user attribution (no PII)</li>
                </ul>
              </div>
            </div>

            {/* Section 10: Non-Binding */}
            <div>
              <h2 className="text-lg font-semibold text-red-600 border-b-2 border-gray-100 pb-2 mb-4">
                10. Non-Binding Intent
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>This MOU represents a statement of intent and mutual interest. It is not legally binding. Specific terms, pricing, and obligations will be documented in subsequent agreements as the partnership develops.</p>
                <p className="mt-2">Either party may discontinue discussions at any time without liability.</p>
              </div>
            </div>

            {/* Section 11: Next Steps */}
            <div>
              <h2 className="text-lg font-semibold text-red-600 border-b-2 border-gray-100 pb-2 mb-4">
                11. Next Steps
              </h2>
              <div className="space-y-3 text-gray-600">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>CoAccept shares API documentation</li>
                  <li>Technical call to finalize integration approach</li>
                  <li>APIClaw builds integration (target: 1-2 weeks)</li>
                  <li>Joint testing with pilot users</li>
                  <li>Commercial terms finalization</li>
                </ol>
              </div>
            </div>

            {/* Section 12: Good Faith */}
            <div>
              <h2 className="text-lg font-semibold text-red-600 border-b-2 border-gray-100 pb-2 mb-4">
                12. Good Faith
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>Both parties commit to act professionally and in good faith throughout this partnership.</p>
                <p>Any concerns shall be raised directly and resolved through dialogue.</p>
              </div>
            </div>

            {/* Signatures */}
            <div className="border-t-2 border-gray-100 pt-8 mt-8">
              <h2 className="text-lg font-semibold text-red-600 mb-6">Signatures</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* APIClaw signature (pre-signed) */}
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-4">APIClaw / NordSym AB</h3>
                  <div className="border-b border-gray-300 pb-2 mb-2 h-16 flex items-end">
                    <span style={{ fontFamily: "'Brush Script MT', cursive", fontSize: '24px' }} className="text-gray-900">Gustav Hemmingsson</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong className="text-gray-900">Gustav Hemmingsson</strong><br />
                    CEO, NordSym AB<br />
                    Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                {/* Partner signature */}
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-4">CoAccept</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Draw your signature:</label>
                      <canvas
                        ref={canvasRef}
                        width={300}
                        height={100}
                        className="border border-gray-300 rounded-lg cursor-crosshair bg-white w-full max-w-[300px]"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <button onClick={clearSignature} className="text-sm text-red-600 mt-1">Clear signature</button>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        placeholder="Gustav Frändfors / Alexander Nystedt"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Title</label>
                      <input
                        type="text"
                        value={signerTitle}
                        onChange={(e) => setSignerTitle(e.target.value)}
                        placeholder="CEO / CTO, CoAccept"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-red-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
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
                  className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:bg-red-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Sign MOU"}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 text-center text-sm text-gray-500">
            <p>APIClaw × CoAccept Integration Partnership • March 2026</p>
            <p>Questions? Contact <a href="mailto:gustav@nordsym.com" className="text-red-600">gustav@nordsym.com</a></p>
          </div>
        </div>
      </main>
    </div>
  );
}
