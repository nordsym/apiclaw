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
    period: "",
    calls: "50 Direct Call",
    callsSub: "calls per month",
    features: [
      "Search Index always available",
      "Open API always available",
      "1 connected agent",
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
    callsSub: "pay per call",
    features: [
      "Everything in Free",
      "Unlimited Direct Call",
      "Pay only for what you use",
      "No commitment",
    ],
    cta: "Start Using",
    ctaLoggedIn: "Add Payment Method",
    link: null,
    highlight: false,
    isContact: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$79",
    period: "/month",
    calls: "5,000 Direct Call",
    callsSub: "calls per month",
    features: [
      "Everything in Free",
      "All Direct Call providers",
      "Search + Open API always available",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    ctaLoggedIn: "Upgrade to Pro",
    link: "https://buy.stripe.com/7sY7sN78gfX43yAchqcMM0z",
    highlight: true,
    isContact: false,
  },
  {
    id: "scale",
    name: "Scale",
    price: "$249",
    period: "/month",
    calls: "25,000 Direct Call",
    callsSub: "calls per month",
    features: [
      "Everything in Pro",
      "Volume pricing on calls",
      "Dedicated onboarding",
      "SLA available",
    ],
    cta: "Upgrade to Scale",
    ctaLoggedIn: "Upgrade to Scale",
    link: "https://buy.stripe.com/14A3cx78geT00modlucMM0A",
    highlight: false,
    isContact: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    calls: "Unlimited",
    callsSub: "calls",
    features: [
      "Everything in Scale",
      "Custom call limits",
      "Private deployment options",
      "SLA & onboarding support",
    ],
    cta: "Book a call",
    ctaLoggedIn: "Book a call",
    link: "/book",
    highlight: false,
    isContact: true,
  },
];
