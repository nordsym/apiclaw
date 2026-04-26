/**
 * Single source of truth for APIClaw pricing plans.
 * Used by both BillingTab (workspace) and the landing page pricing section.
 */

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
    calls: "25",
    callsSub: "API calls per month",
    features: [
      "Email signup required, no card",
      "All callable APIs count equally",
      "Search and discover always free, unmetered",
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
    calls: "Unlimited",
    callsSub: "API calls",
    features: [
      "Everything in Free",
      "Unlimited calls past the 25 free",
      "API cost + 15%, transparent margin",
      "No commitment, cancel anytime",
    ],
    cta: "Add Payment Method",
    ctaLoggedIn: "Add Payment Method",
    link: null,
    highlight: true,
    isContact: false,
  },
];
