import assert from "node:assert/strict";
import { paymentMethodLabel } from "./billing-presentation";

assert.equal(paymentMethodLabel({ type: "link", brand: null, last4: null }), "Link");
assert.equal(paymentMethodLabel({ type: "card", brand: "mastercard", last4: "0806" }), "Mastercard •••• 0806");
assert.equal(paymentMethodLabel({ type: "card", brand: null, last4: null }), "Card");
assert.equal(paymentMethodLabel({ type: null, brand: null, last4: null }), "Payment method");
console.log("Payment labels show only known details, including Link without card digits");
