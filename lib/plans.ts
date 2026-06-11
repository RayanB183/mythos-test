export type Plan = "free" | "pro";

export const PLANS = {
  free: {
    name: "Free",
    price: "$0",
    subscriptionLimit: 5,
    features: [
      "Track up to 5 subscriptions",
      "Monthly & yearly spend overview",
      "Renewal countdowns",
    ],
  },
  pro: {
    name: "Pro",
    price: "$5",
    subscriptionLimit: Infinity,
    features: [
      "Unlimited subscriptions",
      "Spend projections & insights",
      "Priority support",
      "Cancel anytime",
    ],
  },
} as const;

export function subscriptionLimit(plan: Plan): number {
  return PLANS[plan].subscriptionLimit;
}
