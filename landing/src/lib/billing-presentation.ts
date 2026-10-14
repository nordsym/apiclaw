export function paymentMethodLabel(method: {
  brand: string | null;
  last4: string | null;
  type: string | null;
}): string {
  if (method.type === "link") return "Link";
  const name = method.brand || method.type || "Payment method";
  const label = name.charAt(0).toUpperCase() + name.slice(1);
  return method.last4 ? `${label} •••• ${method.last4}` : label;
}

/** Preserve sub-cent PAYG visibility without showing noisy trailing zeroes. */
export function formatMicroUsd(micros: number): string {
  const safeMicros = Number.isFinite(micros) ? Math.max(0, Math.round(micros)) : 0;
  const fixed = (safeMicros / 1_000_000).toFixed(6);
  const [whole, fraction] = fixed.split(".");
  const trimmedFraction = fraction.replace(/0+$/, "").padEnd(2, "0");
  return `$${whole}.${trimmedFraction}`;
}
