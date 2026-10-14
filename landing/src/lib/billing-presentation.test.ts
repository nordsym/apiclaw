import assert from "node:assert/strict";
import { formatMicroUsd, paymentMethodLabel } from "./billing-presentation";

assert.equal(paymentMethodLabel({ type: "link", brand: null, last4: null }), "Link");
assert.equal(paymentMethodLabel({ type: "card", brand: "mastercard", last4: "0806" }), "Mastercard •••• 0806");
assert.equal(paymentMethodLabel({ type: "card", brand: null, last4: null }), "Card");
assert.equal(paymentMethodLabel({ type: null, brand: null, last4: null }), "Payment method");
assert.equal(formatMicroUsd(0), "$0.00");
assert.equal(formatMicroUsd(1), "$0.000001");
assert.equal(formatMicroUsd(115_000), "$0.115");
assert.equal(formatMicroUsd(1_230_000), "$1.23");
console.log("Payment labels show only known details, including Link without card digits");
