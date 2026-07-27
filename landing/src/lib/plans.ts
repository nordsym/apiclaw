/**
 * Single source of truth for APIClaw pricing plans.
 * Used by both BillingTab (workspace) and the landing page pricing section.
 */

import {
  FREE_MANAGED_CALLS_LIFETIME,
  FREE_MANAGED_PROVIDER_COST_CAP_USD,
  PAYG_MARGIN_RATE,
} from "@apiclaw/product-truth";

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
    name: "Free",
    price: "$0",
    period: "forever",
    calls: String(FREE_MANAGED_CALLS_LIFETIME),
    callsSub: "managed calls for the lifetime of the workspace",
    features: [
      "Email signup required, no card",
      `Up to $${FREE_MANAGED_PROVIDER_COST_CAP_USD} total underlying provider cost`,
      "Discovery is free",
      "1 workspace",
    ],
    cta: "Get Started",
    ctaLoggedIn: "Current plan",
    link: null,
    highlight: false,
    isContact: false,
  },
  {
    id: "usage_based",
    name: "Pay as you go",
    price: "Usage",
    period: "based",
    calls: "Continue",
    callsSub: "for billing-ready actions after the free tier",
    features: [
      "Everything in Free",
      "Billing-ready managed actions continue after the free tier",
      `Provider cost + ${PAYG_MARGIN_PERCENT}%, transparent margin`,
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
