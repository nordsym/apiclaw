"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getCurrentTheme, toggleTheme, type Theme } from "@/lib/theme";

/** Quiet icon-button theme switch. Hydration-safe: renders inert until mounted. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(getCurrentTheme());
  }, []);

  const base = `claw-btn claw-btn-quiet !h-9 !w-9 !px-0 ${className}`;

  if (theme === null) {
    return <button type="button" className={base} aria-hidden="true" tabIndex={-1} />;
  }

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(toggleTheme())}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      className={base}
    >
      {isLight ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
    </button>
  );
}
