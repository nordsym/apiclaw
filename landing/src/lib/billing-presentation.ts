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
