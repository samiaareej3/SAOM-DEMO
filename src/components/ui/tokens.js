/* ============================================================================
   SAOM-AI — DESIGN TOKENS

   Single source of truth for the light SOC design system.

   Tailwind cannot resolve class names that are built at runtime, so every
   entry below is a complete, literal class string. Import the maps instead of
   concatenating colour fragments in a component.
============================================================================ */

/* Raw palette — use these only for SVG fills, canvas strokes and inline
   styles where a Tailwind class cannot be applied. */
export const PALETTE = {
  canvas: "#F6F7F9",
  surface: "#FFFFFF",
  hairline: "#E4E8EE",

  ink: "#0E1726",
  inkMuted: "#5A6B84",
  inkFaint: "#8A97A8",

  indigo: "#4F46E5",
  indigoSoft: "#EEF0FE",
  blue: "#2563EB",
  violet: "#7C3AED",

  critical: "#DC2626",
  high: "#EA580C",
  medium: "#CA8A04",
  low: "#059669",
  info: "#0891B2",
  neutral: "#64748B",
};

/* Severity is the most repeated signal in the product, so it gets a full
   treatment: text, surface, hairline, spine (the 3px rule on the left edge of
   a row or card) and a raw hex for charts. */
export const SEVERITY = {
  Critical: {
    label: "Critical",
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-600",
    spine: "bg-red-600",
    fill: PALETTE.critical,
    rank: 4,
  },
  High: {
    label: "High",
    text: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-500",
    spine: "bg-orange-500",
    fill: PALETTE.high,
    rank: 3,
  },
  Medium: {
    label: "Medium",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    spine: "bg-amber-500",
    fill: PALETTE.medium,
    rank: 2,
  },
  Low: {
    label: "Low",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-600",
    spine: "bg-emerald-600",
    fill: PALETTE.low,
    rank: 1,
  },
  Unknown: {
    label: "Unknown",
    text: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    dot: "bg-slate-400",
    spine: "bg-slate-300",
    fill: PALETTE.neutral,
    rank: 0,
  },
};

export function severityTone(value) {
  const key = String(value || "").toLowerCase();

  if (key.includes("critical")) return SEVERITY.Critical;
  if (key.includes("high")) return SEVERITY.High;
  if (key.includes("medium") || key.includes("moderate")) return SEVERITY.Medium;
  if (key.includes("low") || key.includes("info")) return SEVERITY.Low;

  return SEVERITY.Unknown;
}

/* Lifecycle status — incidents, assets, SOAR actions and audits all resolve
   into this vocabulary so a colour means the same thing on every page. */
export const STATUS = {
  open: {
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-600",
  },
  progress: {
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-600",
  },
  waiting: {
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  done: {
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-600",
  },
  stopped: {
    text: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  ai: {
    text: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    dot: "bg-violet-600",
  },
};

export function statusTone(value) {
  const key = String(value || "").toLowerCase();

  if (
    key.includes("reject") ||
    key.includes("fail") ||
    key.includes("offline") ||
    key.includes("breach") ||
    key.includes("active") ||
    key.includes("open")
  ) {
    return STATUS.open;
  }

  if (
    key.includes("pending") ||
    key.includes("await") ||
    key.includes("approval") ||
    key.includes("queued")
  ) {
    return STATUS.waiting;
  }

  if (
    key.includes("investigat") ||
    key.includes("running") ||
    key.includes("execut") ||
    key.includes("progress") ||
    key.includes("approved")
  ) {
    return STATUS.progress;
  }

  if (
    key.includes("resolved") ||
    key.includes("complete") ||
    key.includes("success") ||
    key.includes("online") ||
    key.includes("healthy") ||
    key.includes("passed") ||
    key.includes("secure")
  ) {
    return STATUS.done;
  }

  return STATUS.stopped;
}

/* Shared surface recipes. Cards are flat white on a cool canvas with a single
   hairline; elevation is reserved for things that float (rail, panels, menus)
   so shadow always means "above the page". */
export const SURFACE = {
  card: "rounded-xl border border-slate-200 bg-white",
  cardHover:
    "rounded-xl border border-slate-200 bg-white transition-colors duration-150 hover:border-slate-300",
  inset: "rounded-lg border border-slate-200 bg-slate-50",
  float: "rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5",
};

export const FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white";