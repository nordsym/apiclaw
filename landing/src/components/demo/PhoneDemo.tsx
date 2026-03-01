"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface WithMessage {
  role: "user" | "assistant";
  text: string;
  meta?: string;
  typing?: boolean;
  image?: boolean;
  success?: boolean;
  search?: boolean;
  models?: { name: string; match: string }[];
  results?: { name: string; match: string; cost: string }[];
}

interface WithoutMessage {
  role: "step";
  text: string;
}

type Message = WithMessage | WithoutMessage;

const WithAPIClaw: WithMessage[] = [
  { role: "user", text: "Generate a product photo of a coffee mug" },
  { role: "assistant", text: "Direct Call → Replicate", search: true },
  { 
    role: "assistant", 
    text: "Selecting model...",
    models: [
      { name: "Flux Pro", match: "Best for products" },
      { name: "SDXL", match: "Fast generation" },
      { name: "Stable Diffusion 3", match: "Versatile" },
    ]
  },
  { role: "assistant", text: "Using Flux Pro", meta: "via Replicate Direct Call" },
  { role: "assistant", text: "Generating...", typing: true },
  { role: "assistant", text: "Done", image: true, success: true },
];

const WithoutAPIClaw: WithoutMessage[] = [
  { role: "step", text: "Search \"AI image generation API\"" },
  { role: "step", text: "Open 12 tabs, compare providers" },
  { role: "step", text: "Read Replicate documentation" },
  { role: "step", text: "Create account on Replicate" },
  { role: "step", text: "Verify email, set up billing" },
  { role: "step", text: "Generate API key" },
  { role: "step", text: "Store key securely in .env" },
  { role: "step", text: "Research which model to use" },
  { role: "step", text: "Write API integration code" },
  { role: "step", text: "Finally make first API call" },
];

// OpenAI-style logo
function OpenAILogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

export function PhoneDemo() {
  const [withClaw, setWithClaw] = useState(true);
  const [visibleMessages, setVisibleMessages] = useState(0);
  
  const messages: Message[] = withClaw ? WithAPIClaw : WithoutAPIClaw;
  
  useEffect(() => {
    setVisibleMessages(0);
    const interval = setInterval(() => {
      setVisibleMessages((v) => {
        if (v >= messages.length) {
          clearInterval(interval);
          return v;
        }
        return v + 1;
      });
    }, withClaw ? 1000 : 600);
    
    return () => clearInterval(interval);
  }, [withClaw, messages.length]);

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <button
          onClick={() => setWithClaw(true)}
          className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all ${
            withClaw 
              ? "bg-zinc-900 text-white shadow-lg" 
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          With APIClaw
        </button>
        <button
          onClick={() => setWithClaw(false)}
          className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all ${
            !withClaw 
              ? "bg-zinc-900 text-white shadow-lg" 
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Without
        </button>
      </div>
      
      {/* ChatGPT-style Phone Frame */}
      <div className="relative mx-auto" style={{ maxWidth: "340px" }}>
        {/* Phone body */}
        <div className="relative bg-zinc-900 rounded-[2.5rem] p-2 shadow-2xl">
          {/* Screen */}
          <div className="bg-white rounded-[2.2rem] overflow-hidden min-h-[480px] flex flex-col">
            {/* Status bar */}
            <div className="flex items-center justify-between px-6 py-2 text-xs text-zinc-900 font-medium">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/></svg>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17 4h-3V2h-4v2H7v18h10V4zm-2 16H9V6h6v14z"/></svg>
              </div>
            </div>
            
            {/* App Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                {withClaw ? (
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
                    <OpenAILogo className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                <div>
                  <div className="text-zinc-900 font-semibold text-sm">
                    {withClaw ? "Agent + APIClaw" : "Manual Workflow"}
                  </div>
                </div>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100">
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
            
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white">
              {messages.slice(0, visibleMessages).map((msg, i) => (
                <div
                  key={i}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-zinc-100 text-zinc-900 px-4 py-2.5 rounded-2xl rounded-br-md max-w-[85%] text-sm">
                        {msg.text}
                      </div>
                    </div>
                  ) : msg.role === "step" ? (
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                        i < visibleMessages - 1 
                          ? "bg-orange-100 text-orange-600" 
                          : "bg-zinc-100 text-zinc-500"
                      }`}>
                        {i < visibleMessages - 1 ? "✓" : i + 1}
                      </div>
                      <span className={`text-sm pt-0.5 ${i < visibleMessages - 1 ? "text-zinc-400" : "text-zinc-700"}`}>
                        {msg.text}
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
                        <OpenAILogo className="w-4 h-4 text-white" />
                      </div>
                      
                      {/* Message content */}
                      <div className="flex-1 min-w-0">
                        {msg.search && (
                          <div className="flex items-center gap-2 text-zinc-700 text-sm py-1 font-medium">
                            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {msg.text}
                          </div>
                        )}
                        {msg.models && (
                          <div className="space-y-2">
                            <div className="text-zinc-900 text-sm font-medium">{msg.text}</div>
                            <div className="space-y-1.5">
                              {msg.models.map((m, j) => (
                                <div key={j} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                                  j === 0 ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-600"
                                }`}>
                                  <span className={j === 0 ? "font-medium" : ""}>{m.name}</span>
                                  <span className={j === 0 ? "text-zinc-300" : "text-zinc-400"}>{m.match}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {msg.results && (
                          <div className="space-y-2">
                            <div className="text-zinc-900 text-sm font-medium">{msg.text}</div>
                            <div className="space-y-1.5">
                              {msg.results.map((r, j) => (
                                <div key={j} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                                  j === 0 ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-600"
                                }`}>
                                  <span className={j === 0 ? "font-medium" : ""}>{r.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={j === 0 ? "text-zinc-300" : "text-zinc-400"}>{r.match}</span>
                                    <span className={j === 0 ? "text-zinc-500" : "text-zinc-300"}>·</span>
                                    <span className={j === 0 ? "text-zinc-300" : "text-zinc-400"}>{r.cost}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {!msg.search && !msg.results && !msg.models && (
                          <div className="text-zinc-800 text-sm flex items-center gap-2 py-1">
                            {msg.success && (
                              <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {msg.typing && (
                              <span className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                              </span>
                            )}
                            {msg.text}
                          </div>
                        )}
                        {msg.meta && (
                          <div className="text-zinc-400 text-xs mt-0.5">{msg.meta}</div>
                        )}
                        {msg.image && (
                          <div className="mt-2 w-44 aspect-square rounded-xl overflow-hidden shadow-md">
                            <Image 
                              src="/demo-product.jpg" 
                              alt="Generated product image" 
                              width={176}
                              height={176}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Input area */}
            <div className="p-3 border-t border-zinc-100">
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3">
                <input 
                  type="text" 
                  placeholder="Message..." 
                  className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none"
                  readOnly
                />
                <button className="w-7 h-7 bg-zinc-900 rounded-full flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Home indicator */}
            <div className="flex justify-center pb-2">
              <div className="w-32 h-1 bg-zinc-900 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
