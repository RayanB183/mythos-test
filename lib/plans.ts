export type Plan = "free" | "pro";

export const PLANS = {
  free: {
    name: "Free",
    price: "$0",
    dealLimit: 3,
    features: [
      "Up to 3 active deals",
      "Payment countdowns & late alerts",
      "Pipeline from pitch to paid",
    ],
  },
  pro: {
    name: "Pro",
    price: "$9",
    dealLimit: Infinity,
    features: [
      "Unlimited deals",
      "Full earnings history",
      "Priority support",
      "Cancel anytime",
    ],
  },
} as const;

export function dealLimit(plan: Plan): number {
  return PLANS[plan].dealLimit;
}
