export const STATUSES = {
  pitched: {
    label: "Pitched",
    chip: "bg-slate-100 text-slate-600",
    next: "negotiating",
    advanceLabel: "Negotiating",
  },
  negotiating: {
    label: "Negotiating",
    chip: "bg-violet-100 text-violet-700",
    next: "signed",
    advanceLabel: "Mark signed",
  },
  signed: {
    label: "Signed",
    chip: "bg-blue-100 text-blue-700",
    next: "delivered",
    advanceLabel: "Mark delivered",
  },
  delivered: {
    label: "Delivered",
    chip: "bg-cyan-100 text-cyan-700",
    next: "invoiced",
    advanceLabel: "Mark invoiced",
  },
  invoiced: {
    label: "Invoiced",
    chip: "bg-amber-100 text-amber-700",
    next: "paid",
    advanceLabel: "Mark paid",
  },
  paid: {
    label: "Paid",
    chip: "bg-emerald-100 text-emerald-700",
    next: null,
    advanceLabel: null,
  },
} as const;

export type Status = keyof typeof STATUSES;

/** Common brand payment terms (days after invoice). */
export const PAYMENT_TERMS = [15, 30, 45, 60, 90] as const;

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round(
    (new Date(isoDate).getTime() - today.getTime()) / 86_400_000
  );
}
