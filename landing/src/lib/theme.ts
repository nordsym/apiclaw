/** Theme storage + application. Two themes: dark (default) and light. */
export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "apiclaw-theme";

const THEME_COLOR: Record<Theme, string> = {
  dark: "#0b0b0c",
  light: "#fafafa",
};

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

/** Reads the theme currently applied to <html>. Client-only; call after mount. */
export function getCurrentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

/** Applies a theme to <html>, persists it, and updates the theme-color meta tag. */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove(theme === "light" ? "dark" : "light");
  root.classList.add(theme);
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // storage unavailable (private mode, etc.) - theme still applies for this load
  }
}

export function toggleTheme(): Theme {
  const next: Theme = getCurrentTheme() === "light" ? "dark" : "light";
  applyTheme(next);
  return next;
}

/**
 * Inline, pre-hydration script: reads the stored theme and swaps the <html>
 * class before first paint so there is no dark-to-light flash. The SSR
 * default class is "dark"; this only needs to act when the stored theme is
 * "light".
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(t==="light"){var r=document.documentElement;r.classList.remove("dark");r.classList.add("light");r.style.colorScheme="light";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",${JSON.stringify(
  THEME_COLOR.light
)});}}catch(e){}})();`;
