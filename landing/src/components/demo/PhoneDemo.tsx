"use client";

import { useState, useEffect } from "react";

interface WithMessage {
  role: "user" | "assistant";
  text: string;
  meta?: string;
  typing?: boolean;
  image?: boolean;
  success?: boolean;
  search?: boolean;
  results?: { name: string; match: string; cost: string }[];
}

interface WithoutMessage {
  role: "step";
  text: string;
}

type Message = WithMessage | WithoutMessage;

const WithAPIClaw: WithMessage[] = [
  { role: "user", text: "I need to generate product images with AI" },
  { role: "assistant", text: "Searching APIs...", search: true },
  { 
    role: "assistant", 
    text: "Found 3 matches",
    results: [
      { name: "Replicate", match: "98%", cost: "$0.003" },
      { name: "Stability AI", match: "94%", cost: "$0.006" },
      { name: "OpenAI DALL-E", match: "91%", cost: "$0.020" },
    ]
  },
  { role: "assistant", text: "Using Replicate SDXL", meta: "Best match · Direct Call ready" },
  { role: "assistant", text: "Generating...", typing: true },
  { role: "assistant", text: "Image ready", image: true, success: true },
];

const WithoutAPIClaw: WithoutMessage[] = [
  { role: "step", text: "Search \"AI image generation API\"" },
  { role: "step", text: "Open 12 tabs, compare providers" },
  { role: "step", text: "Read documentation for each" },
  { role: "step", text: "Create account on Replicate" },
  { role: "step", text: "Verify email, set up billing" },
  { role: "step", text: "Generate API key" },
  { role: "step", text: "Store key securely in .env" },
  { role: "step", text: "Write API integration code" },
  { role: "step", text: "Debug authentication errors" },
  { role: "step", text: "Finally make first API call" },
];

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
              ? "bg-[#10a37f] text-white shadow-lg shadow-[#10a37f]/25" 
              : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
          }`}
        >
          With APIClaw
        </button>
        <button
          onClick={() => setWithClaw(false)}
          className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all ${
            !withClaw 
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25" 
              : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
          }`}
        >
          Without
        </button>
      </div>
      
      {/* ChatGPT-style Phone Frame - Light Mode */}
      <div className="relative mx-auto" style={{ maxWidth: "340px" }}>
        {/* Phone body - minimal frame */}
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
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  withClaw ? "bg-[#10a37f]" : "bg-orange-500"
                }`}>
                  {withClaw ? (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="text-zinc-900 font-semibold text-sm">
                    {withClaw ? "Agent + APIClaw" : "Manual Workflow"}
                  </div>
                  <div className="text-zinc-400 text-xs">
                    {withClaw ? "API-powered assistant" : "Traditional process"}
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
                      <div className="bg-[#10a37f] text-white px-4 py-2.5 rounded-2xl rounded-br-md max-w-[85%] text-sm">
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
                      <div className="w-7 h-7 rounded-full bg-[#10a37f] flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      
                      {/* Message content */}
                      <div className="flex-1 min-w-0">
                        {msg.search && (
                          <div className="flex items-center gap-2 text-zinc-500 text-sm py-1">
                            <svg className="w-4 h-4 animate-spin text-[#10a37f]" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            {msg.text}
                          </div>
                        )}
                        {msg.results && (
                          <div className="space-y-2">
                            <div className="text-zinc-900 text-sm font-medium">{msg.text}</div>
                            <div className="space-y-1.5">
                              {msg.results.map((r, j) => (
                                <div key={j} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                                  j === 0 ? "bg-[#10a37f]/10 border border-[#10a37f]/20" : "bg-zinc-50"
                                }`}>
                                  <span className={j === 0 ? "text-[#10a37f] font-medium" : "text-zinc-600"}>{r.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={j === 0 ? "text-[#10a37f]" : "text-zinc-400"}>{r.match}</span>
                                    <span className="text-zinc-300">·</span>
                                    <span className="text-zinc-400">{r.cost}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {!msg.search && !msg.results && (
                          <div className="text-zinc-800 text-sm flex items-center gap-2 py-1">
                            {msg.success && (
                              <svg className="w-4 h-4 text-[#10a37f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                          <div className="mt-2 w-40 aspect-square bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md overflow-hidden">
                            <div className="text-center">
                              <svg className="w-8 h-8 text-white/60 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                              </svg>
                              <span className="text-white/80 text-xs font-medium">Generated</span>
                            </div>
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
              <div className="flex items-center gap-2 bg-zinc-100 rounded-2xl px-4 py-3">
                <input 
                  type="text" 
                  placeholder="Message..." 
                  className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none"
                  readOnly
                />
                <button className="w-8 h-8 bg-zinc-300 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
