/** Shared Clerk appearance so auth screens match the quiet-console system. */
export const clerkAppearance = {
  variables: {
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
  },
  elements: {
    cardBox: "shadow-none border border-[var(--border-subtle)] rounded-[14px]",
    card: "bg-[var(--surface)] shadow-none",
    formButtonPrimary: "bg-[var(--text-primary)] hover:bg-white text-[var(--background)] normal-case shadow-none border-0",
    headerTitle: "text-[var(--text-primary)]",
    headerSubtitle: "text-[var(--text-secondary)]",
    socialButtonsBlockButton: "border border-[var(--border)] text-[var(--text-primary)] bg-transparent hover:bg-[var(--surface-elevated)]",
    formFieldLabel: "text-[var(--text-secondary)]",
    formFieldInput: "border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)]",
    footerActionLink: "text-[var(--text-primary)] hover:text-white",
    dividerLine: "bg-[var(--border)]",
    dividerText: "text-[var(--text-muted)]",
  },
} as const;
