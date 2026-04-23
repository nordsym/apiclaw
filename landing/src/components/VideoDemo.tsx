"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";

interface VideoDemoProps {
  videoUrl?: string;
  thumbnailUrl?: string;
}

export function VideoDemo({
  videoUrl = "/demo.mp4",
  thumbnailUrl
}: VideoDemoProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Video Button - Bottom Right */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-40 group"
        aria-label="Watch demo video"
      >
        <div className="relative">
          {/* Pulse animation */}
          <div className="absolute inset-0 bg-[#ef4444] rounded-full opacity-75 animate-ping" />
          
          {/* Main button */}
          <div className="relative bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-full p-4 shadow-lg transition-all duration-200 flex items-center gap-3 pr-6">
            <Play className="w-6 h-6 fill-white" />
            <span className="font-medium text-sm whitespace-nowrap">
              Watch Demo
            </span>
          </div>
        </div>
      </button>

      {/* Video Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="relative w-full max-w-4xl bg-[var(--background)] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              aria-label="Close video"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video container - 16:9 aspect ratio */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <video
                src={videoUrl}
                className="absolute inset-0 w-full h-full"
                controls
                autoPlay
                preload="auto"
              />
            </div>

            {/* Video info */}
            <div className="p-6 border-t border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
                🦞 APIClaw Quick Start
              </h3>
              <p className="text-sm text-[var(--text-muted)]">
                Install and use APIClaw in under 2 minutes
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
