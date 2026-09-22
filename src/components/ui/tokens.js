 export const PALETTE = {
  bg: "#F6F7F9",
  surface: "#FFFFFF",
  surfaceMuted: "#F8F9FB",

  text: "#0F172A",
  textMuted: "#64748B",
  textSoft: "#94A3B8",

  border: "#E2E8F0",
  borderStrong: "#CBD5E1",

  red: "#ED1C2E",
  redDark: "#B91C1C",
  redSoft: "#FEF2F2",

  green: "#16A34A",
  greenSoft: "#F0FDF4",

  amber: "#D97706",
  amberSoft: "#FFFBEB",

  blue: "#2563EB",
  blueSoft: "#EFF6FF",

  purple: "#7C3AED",
  purpleSoft: "#F5F3FF",

  cyan: "#0891B2",
  cyanSoft: "#ECFEFF",

  black: "#0B0F14",
};

export const FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C2E]/30";

export const SURFACE = {
  page: "bg-[#F6F7F9]",
  card: "bg-white border border-slate-200",
  muted: "bg-slate-50 border border-slate-200",
};

export const SEVERITY = {
  critical: {
    label: "Critical",
    color: PALETTE.red,
    bg: PALETTE.redSoft,
  },

  high: {
    label: "High",
    color: "#DC2626",
    bg: "#FEF2F2",
  },

  medium: {
    label: "Medium",
    color: PALETTE.amber,
    bg: PALETTE.amberSoft,
  },

  low: {
    label: "Low",
    color: PALETTE.blue,
    bg: PALETTE.blueSoft,
  },

  info: {
    label: "Info",
    color: PALETTE.textMuted,
    bg: "#F8FAFC",
  },
};

export function severityTone(severity) {
  const key = String(severity || "info").toLowerCase();

  return SEVERITY[key] || SEVERITY.info;
}

export const STATUS = {
  active: {
    label: "Active",
    color: PALETTE.red,
    bg: PALETTE.redSoft,
  },

  open: {
    label: "Open",
    color: PALETTE.red,
    bg: PALETTE.redSoft,
  },

  investigating: {
    label: "Investigating",
    color: PALETTE.amber,
    bg: PALETTE.amberSoft,
  },

  contained: {
    label: "Contained",
    color: PALETTE.green,
    bg: PALETTE.greenSoft,
  },

  resolved: {
    label: "Resolved",
    color: PALETTE.green,
    bg: PALETTE.greenSoft,
  },

  healthy: {
    label: "Healthy",
    color: PALETTE.green,
    bg: PALETTE.greenSoft,
  },

  pending: {
    label: "Pending",
    color: PALETTE.amber,
    bg: PALETTE.amberSoft,
  },

  approved: {
    label: "Approved",
    color: PALETTE.green,
    bg: PALETTE.greenSoft,
  },

  blocked: {
    label: "Blocked",
    color: PALETTE.red,
    bg: PALETTE.redSoft,
  },

  running: {
    label: "Running",
    color: PALETTE.blue,
    bg: PALETTE.blueSoft,
  },

  completed: {
    label: "Completed",
    color: PALETTE.green,
    bg: PALETTE.greenSoft,
  },

  failed: {
    label: "Failed",
    color: PALETTE.red,
    bg: PALETTE.redSoft,
  },

  idle: {
    label: "Idle",
    color: PALETTE.textMuted,
    bg: "#F8FAFC",
  },
};

export function statusTone(status) {
  const key = String(status || "idle")
    .toLowerCase()
    .replace(/\s+/g, "-");

  return STATUS[key] || STATUS.idle;
}