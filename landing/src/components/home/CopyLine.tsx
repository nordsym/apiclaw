"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  /** Visible label when not copied. Defaults to "Copy". */
  label?: string;
  /** Leading glyph. "$" for shell, "›" for agent prompts. */
  prompt?: string;
  className?: string;
};

/** One command line with a copy affordance. The only snippet primitive on the homepage. */
export function CopyLine({ text, label = "Copy", prompt = "$", className = "" }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  }, [text]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  return (
    <button type="button" onClick={copy} className={`claw-cmd ${className}`} aria-label={`Copy: ${text}`}>
      <span className="prompt" aria-hidden="true">{prompt}</span>
      <span className="text">{text}</span>
      <span className="state" data-copied={copied} aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
