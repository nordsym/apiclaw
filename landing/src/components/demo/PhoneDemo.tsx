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
  done?: boolean;
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
  { role: "assistant", text: "Using Replicate SDXL", meta: "Best match • Direct Call ready" },
  { role: "assistant", text: "Generating...", typing: true },
  { role: "assistant", text: "Done", image: true, success: true },
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
              ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25" 
              : "bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700/80"
          }`}
        >
          With APIClaw
        </button>
        <button
          onClick={() => setWithClaw(false)}
          className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all ${
            !withClaw 
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25" 
              : "bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700/80"
          }`}
        >
          Without
        </button>
      </div>
      
      {/* Premium Phone Frame */}
      <div className="relative mx-auto" style={{ maxWidth: "320px" }}>
        {/* Outer glow */}
        <div className="absolute -inset-4 bg-gradient-to-b from-zinc-500/10 to-transparent rounded-[3.5rem] blur-xl" />
        
        {/* Phone body */}
        <div className="relative bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[3rem] p-[3px] shadow-2xl shadow-black/50">
          {/* Inner bezel */}
          <div className="bg-black rounded-[2.8rem] p-3">
            {/* Dynamic Island */}
            <div className="flex justify-center mb-3">
              <div className="w-28 h-8 bg-black rounded-full flex items-center justify-center gap-2 border border-zinc-800/50">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 ring-1 ring-zinc-700" />
                <div className="w-3 h-3 rounded-full bg-zinc-900 ring-1 ring-zinc-700" />
              </div>
            </div>
            
            {/* Screen */}
            <div className="bg-zinc-950 rounded-[2rem] overflow-hidden min-h-[420px]">
              {/* App Header */}
              <div className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    withClaw 
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600" 
                      : "bg-gradient-to-br from-orange-500 to-red-600"
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
                    <div className="text-white font-semibold text-sm">
                      {withClaw ? "Claude + APIClaw" : "Manual Workflow"}
                    </div>
                    <div className="text-zinc-500 text-xs">
                      {withClaw ? "AI-powered API access" : "Traditional development"}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="p-4 space-y-3">
                {messages.slice(0, visibleMessages).map((msg, i) => (
                  <div
                    key={i}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {msg.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-br-md max-w-[85%] text-sm shadow-lg">
                          {msg.text}
                        </div>
                      </div>
                    ) : msg.role === "step" ? (
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                          i < visibleMessages - 1 
                            ? "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30" 
                            : "bg-zinc-800 text-zinc-500 ring-1 ring-zinc-700"
                        }`}>
                          {i < visibleMessages - 1 ? "✓" : i + 1}
                        </div>
                        <span className={`text-sm pt-0.5 ${i < visibleMessages - 1 ? "text-zinc-500" : "text-zinc-300"}`}>
                          {msg.text}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div className="bg-zinc-800/80 backdrop-blur px-4 py-2.5 rounded-2xl rounded-bl-md max-w-[90%] border border-zinc-700/50">
                          {msg.search && (
                            <div className="flex items-center gap-2 text-cyan-400 text-sm">
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              {msg.text}
                            </div>
                          )}
                          {msg.results && (
                            <div className="space-y-2">
                              <div className="text-white text-sm font-medium">{msg.text}</div>
                              <div className="space-y-1.5">
                                {msg.results.map((r, j) => (
                                  <div key={j} className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg ${
                                    j === 0 ? "bg-cyan-500/10 border border-cyan-500/20" : "bg-zinc-900/50"
                                  }`}>
                                    <span className={j === 0 ? "text-cyan-400 font-medium" : "text-zinc-400"}>{r.name}</span>
                                    <div className="flex items-center gap-2">
                                      <span className={j === 0 ? "text-cyan-400" : "text-zinc-500"}>{r.match}</span>
                                      <span className="text-zinc-600">•</span>
                                      <span className="text-zinc-500">{r.cost}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {!msg.search && !msg.results && (
                            <div className="text-white text-sm flex items-center gap-2">
                              {msg.success && (
                                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {msg.typing && (
                                <span className="flex gap-1">
                                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                                </span>
                              )}
                              {msg.text}
                            </div>
                          )}
                          {msg.meta && (
                            <div className="text-cyan-500/70 text-xs mt-1">{msg.meta}</div>
                          )}
                          {msg.image && (
                            <div className="mt-3 w-full aspect-square bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                              <div className="text-center">
                                <svg className="w-10 h-10 text-white/40 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                                <span className="text-white/60 text-xs">Generated</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Home indicator */}
            <div className="flex justify-center mt-3">
              <div className="w-32 h-1 bg-zinc-700 rounded-full" />
            </div>
          </div>
        </div>
        
        {/* Side buttons */}
        <div className="absolute left-0 top-24 w-[3px] h-8 bg-zinc-700 rounded-l-sm" />
        <div className="absolute left-0 top-36 w-[3px] h-12 bg-zinc-700 rounded-l-sm" />
        <div className="absolute left-0 top-52 w-[3px] h-12 bg-zinc-700 rounded-l-sm" />
        <div className="absolute right-0 top-32 w-[3px] h-16 bg-zinc-700 rounded-r-sm" />
      </div>
    </div>
  );
}
