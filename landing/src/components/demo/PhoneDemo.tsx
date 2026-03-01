"use client";

import { useState, useEffect } from "react";

interface WithMessage {
  role: "user" | "assistant";
  text: string;
  meta?: string;
  typing?: boolean;
  image?: boolean;
  success?: boolean;
}

interface WithoutMessage {
  role: "step";
  text: string;
}

type Message = WithMessage | WithoutMessage;

const WithAPIClaw: WithMessage[] = [
  { role: "user", text: "Generate a product image of a coffee mug with our logo" },
  { role: "assistant", text: "Found: Replicate SDXL", meta: "Cost: $0.003/image" },
  { role: "assistant", text: "Generating...", typing: true },
  { role: "assistant", text: "Done", image: true },
  { role: "user", text: "Perfect, send it to the team on Slack" },
  { role: "assistant", text: "Sent to #design", success: true },
];

const WithoutAPIClaw: WithoutMessage[] = [
  { role: "step", text: "Google \"image generation API\"" },
  { role: "step", text: "Compare 12 different providers" },
  { role: "step", text: "Read Replicate documentation" },
  { role: "step", text: "Create account & verify email" },
  { role: "step", text: "Generate API key" },
  { role: "step", text: "Store key in .env file" },
  { role: "step", text: "Write integration code" },
  { role: "step", text: "Debug authentication errors" },
  { role: "step", text: "Finally generate image" },
  { role: "step", text: "Download and upload to Slack manually" },
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
    }, withClaw ? 800 : 500);
    
    return () => clearInterval(interval);
  }, [withClaw, messages.length]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Toggle */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setWithClaw(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            withClaw 
              ? "bg-cyan-500 text-black" 
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          With APIClaw
        </button>
        <button
          onClick={() => setWithClaw(false)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            !withClaw 
              ? "bg-orange-500 text-black" 
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          Without
        </button>
      </div>
      
      {/* Phone Frame */}
      <div className="bg-zinc-900 rounded-[2.5rem] p-3 shadow-2xl border border-zinc-700">
        {/* Notch */}
        <div className="flex justify-center mb-2">
          <div className="w-20 h-6 bg-black rounded-full" />
        </div>
        
        {/* Screen */}
        <div className="bg-zinc-950 rounded-[2rem] p-4 min-h-[400px] overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-medium text-sm">
                {withClaw ? "Claude + APIClaw" : "Manual Process"}
              </div>
              <div className="text-zinc-500 text-xs">
                {withClaw ? "AI Assistant" : "Developer workflow"}
              </div>
            </div>
          </div>
          
          {/* Messages */}
          <div className="space-y-3">
            {messages.slice(0, visibleMessages).map((msg, i) => (
              <div
                key={i}
                className={`animate-fade-in ${
                  msg.role === "user" 
                    ? "flex justify-end" 
                    : msg.role === "step"
                    ? "flex justify-start"
                    : "flex justify-start"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="bg-cyan-600 text-white px-4 py-2 rounded-2xl rounded-br-sm max-w-[85%] text-sm">
                    {msg.text}
                  </div>
                ) : msg.role === "step" ? (
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <div className="w-5 h-5 rounded-full border border-zinc-600 flex items-center justify-center text-xs">
                      {i + 1}
                    </div>
                    <span>{msg.text}</span>
                  </div>
                ) : (
                  <div className="bg-zinc-800 px-4 py-2 rounded-2xl rounded-bl-sm max-w-[85%]">
                    <div className="text-white text-sm flex items-center gap-2">
                      {msg.success && (
                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {msg.typing && (
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        </span>
                      )}
                      {msg.text}
                    </div>
                    {msg.meta && (
                      <div className="text-zinc-500 text-xs mt-1">{msg.meta}</div>
                    )}
                    {msg.image && (
                      <div className="mt-2 w-32 h-32 bg-gradient-to-br from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
                        <svg className="w-12 h-12 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
