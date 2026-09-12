/** Read current Stripe state, never trust an older webhook's payment snapshot. */
export async function readCustomerPaymentMethod(stripe: any, customerId: string) {
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return null;
  const preferred = customer.invoice_settings?.default_payment_method;
  if (preferred) {
    const method = typeof preferred === "string" ? await stripe.paymentMethods.retrieve(preferred) : preferred;
    const owner = typeof method.customer === "string" ? method.customer : method.customer?.id;
    if (owner !== customerId) throw new Error("Payment method customer mismatch");
    return method;
  }
  const methods = await stripe.paymentMethods.list({ customer: customerId, limit: 100 });
  // Card and Link are both legitimate saved methods. Do not invent card digits.
  return methods.data[0] ?? null;
}
