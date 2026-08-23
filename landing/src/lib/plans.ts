/**
 * Single source of truth for APIClaw pricing plans.
 * Used by both BillingTab (workspace) and the landing page pricing section.
 */

import { PAYG_MARGIN_RATE } from "@apiclaw/product-truth";

const PAYG_MARGIN_PERCENT = PAYG_MARGIN_RATE * 100;

export interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  calls: string;
  callsSub: string;
  features: string[];
  cta: string;
  ctaLoggedIn: string;
  link: string | null;
  highlight: boolean;
  isContact: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free APIs",
    price: "$0",
    period: "forever",
    calls: "Free",
    callsSub: "forever, every zero-cost API, no card",
    features: [
      "Discovery and every zero-cost API",
      "Free forever",
      "No card, no counter",
    ],
    cta: "Get Started",
    ctaLoggedIn: "Current plan",
    link: null,
    highlight: false,
    isContact: false,
  },
  {
    id: "usage_based",
    name: "Paid APIs",
    price: "Usage",
    period: "based",
    calls: "Pay per call",
    callsSub: `provider cost plus ${PAYG_MARGIN_PERCENT}%, after you add a card`,
    features: [
      "Everything in Free",
      `Provider cost plus ${PAYG_MARGIN_PERCENT}%`,
      "Add a card once, pay per call",
      "Unsupported variable-cost actions stay blocked until exactly billable",
      "No commitment, cancel anytime",
    ],
    cta: "Add Payment Method",
    ctaLoggedIn: "Add Payment Method",
    link: null,
    highlight: true,
    isContact: false,
  },
];
