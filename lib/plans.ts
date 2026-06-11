export type Plan = "free" | "pro";

export const PLANS = {
  free: {
    name: "Free",
    price: "$0",
    taskLimit: 7,
    features: [
      "Track up to 7 maintenance tasks",
      "Home health score",
      "Due-date countdowns",
    ],
  },
  pro: {
    name: "Pro",
    price: "$7",
    taskLimit: Infinity,
    features: [
      "Unlimited tasks — a full home needs 20+",
      "Every one-click preset",
      "Priority support",
      "Cancel anytime",
    ],
  },
} as const;

export function taskLimit(plan: Plan): number {
  return PLANS[plan].taskLimit;
}
