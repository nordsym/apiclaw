import type { Theme } from "@/lib/theme";

/** Shared Clerk appearance so auth screens match the quiet-console system, in both themes. */
export function getClerkAppearance(theme: Theme = "dark") {
  const isLight = theme === "light";
  const variables = isLight
    ? {
        colorBackground: "#ffffff",
        colorText: "#0a0a0a",
        colorTextSecondary: "#52525b",
        colorInputBackground: "#fafafa",
        colorInputText: "#0a0a0a",
        colorPrimary: "#0a0a0a",
        colorNeutral: "#0a0a0a",
        colorDanger: "#ef4444",
        borderRadius: "10px",
        fontFamily: "Inter, system-ui, sans-serif",
      }
    : {
        colorBackground: "#111113",
        colorText: "#f5f5f6",
        colorTextSecondary: "#a4a4ad",
        colorInputBackground: "#0b0b0c",
        colorInputText: "#f5f5f6",
        colorPrimary: "#f5f5f6",
        colorNeutral: "#f5f5f6",
        colorDanger: "#ef4444",
        borderRadius: "10px",
        fontFamily: "Inter, system-ui, sans-serif",
      };

  return {
    variables,
    elements: {
      cardBox: "shadow-none border border-[var(--border-subtle)] rounded-[14px]",
      card: "bg-[var(--surface)] shadow-none",
      formButtonPrimary: "bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-fg)] normal-case shadow-none border-0",
      headerTitle: "text-[var(--text-primary)]",
      headerSubtitle: "text-[var(--text-secondary)]",
      socialButtonsBlockButton: "border border-[var(--border)] text-[var(--text-primary)] bg-transparent hover:bg-[var(--surface-elevated)]",
      formFieldLabel: "text-[var(--text-secondary)]",
      formFieldInput: "border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]",
      footerActionLink: "text-[var(--text-primary)] hover:text-[var(--btn-primary-hover)]",
      dividerLine: "bg-[var(--border)]",
      dividerText: "text-[var(--text-muted)]",
    },
  } as const;
}

/** Static dark appearance, kept for any caller that has not adopted the theme-aware version. */
export const clerkAppearance = getClerkAppearance("dark");
