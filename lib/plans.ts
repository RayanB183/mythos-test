export type Plan = "free" | "pro";

export const PLANS = {
  free: {
    name: "Free",
    price: "$0",
    taskLimit: 10,
    features: ["Up to 10 tasks", "Basic task management", "Community support"],
  },
  pro: {
    name: "Pro",
    price: "$9",
    taskLimit: Infinity,
    features: [
      "Unlimited tasks",
      "Priority support",
      "Everything in Free",
      "Cancel anytime",
    ],
  },
} as const;

export function taskLimit(plan: Plan): number {
  return PLANS[plan].taskLimit;
}
