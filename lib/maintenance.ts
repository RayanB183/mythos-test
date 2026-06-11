export const CATEGORIES = {
  hvac: { label: "HVAC", emoji: "🌬️" },
  plumbing: { label: "Plumbing", emoji: "🚿" },
  exterior: { label: "Exterior", emoji: "🏠" },
  appliances: { label: "Appliances", emoji: "🔌" },
  safety: { label: "Safety", emoji: "🧯" },
} as const;

export type Category = keyof typeof CATEGORIES;

export const FREQUENCIES = {
  monthly: { label: "Monthly", days: 30 },
  quarterly: { label: "Every 3 months", days: 91 },
  biannual: { label: "Every 6 months", days: 182 },
  yearly: { label: "Yearly", days: 365 },
} as const;

export type Frequency = keyof typeof FREQUENCIES;

export interface Preset {
  name: string;
  category: Category;
  frequency: Frequency;
}

/** Common tasks homeowners forget — addable with one click. */
export const PRESETS: Preset[] = [
  { name: "Replace HVAC filter", category: "hvac", frequency: "quarterly" },
  { name: "Test smoke & CO detectors", category: "safety", frequency: "monthly" },
  { name: "Clean gutters", category: "exterior", frequency: "biannual" },
  { name: "Flush water heater", category: "plumbing", frequency: "yearly" },
  { name: "Clean dryer vent", category: "appliances", frequency: "yearly" },
  { name: "Test sump pump", category: "plumbing", frequency: "quarterly" },
  { name: "Vacuum refrigerator coils", category: "appliances", frequency: "biannual" },
  { name: "Service HVAC system", category: "hvac", frequency: "yearly" },
  { name: "Inspect roof & flashing", category: "exterior", frequency: "yearly" },
  { name: "Check caulk & grout", category: "exterior", frequency: "yearly" },
  { name: "Lubricate garage door", category: "appliances", frequency: "yearly" },
  { name: "Replace smoke detector batteries", category: "safety", frequency: "yearly" },
];

/** ISO date (yyyy-mm-dd) one frequency interval after `from`. */
export function nextDueFrom(from: Date, frequency: Frequency): string {
  const due = new Date(from);
  due.setDate(due.getDate() + FREQUENCIES[frequency].days);
  return due.toISOString().slice(0, 10);
}
