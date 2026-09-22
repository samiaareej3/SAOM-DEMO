 import {
  Search,
  ChevronDown,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
} from "lucide-react";

import {
  FOCUS,
  PALETTE,
  severityTone,
  statusTone,
} from "./tokens";

// ============================================================
// PAGE HEADER
// ============================================================

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}) {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-6 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ED1C2E]">
              {eyebrow}
            </p>
          )}

          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 lg:text-3xl">
            {title}
          </h1>

          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}

          {children}
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

// ============================================================
// SECTION HEADING
// ============================================================

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {eyebrow}
          </p>
        )}

        <h2 className="text-sm font-semibold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

// ============================================================
// CARD / PANEL
// ============================================================

export function Card({
  children,
  className = "",
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={[
        "border border-slate-200 bg-white",
        onClick
          ? "cursor-pointer transition-colors hover:border-slate-300"
          : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function Panel({
  children,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <section
      className={[
        "border border-slate-200 bg-white",
        className,
      ].join(" ")}
    >
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-slate-900">
                {title}
              </h3>
            )}

            {description && (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {description}
              </p>
            )}
          </div>

          {action}
        </div>
      )}

      {children}
    </section>
  );
}

// ============================================================
// STAT CARD
// ============================================================

export function StatCard({
  label,
  value,
  change,
  description,
  icon: Icon,
  tone = "default",
  className = "",
}) {
  const toneMap = {
    default: "text-slate-900",
    red: "text-[#ED1C2E]",
    green: "text-emerald-600",
    amber: "text-amber-600",
    blue: "text-blue-600",
  };

  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p
            className={[
              "mt-3 text-2xl font-semibold tracking-tight",
              toneMap[tone] || toneMap.default,
            ].join(" ")}
          >
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-500">
              {description}
            </p>
          )}

          {change && (
            <p className="mt-2 text-xs font-medium text-slate-500">
              {change}
            </p>
          )}
        </div>

        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center border border-slate-200 text-slate-400">
            <Icon size={15} />
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================
// INFO ROW
// ============================================================

export function InfoRow({
  label,
  value,
  children,
  className = "",
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-4 py-3",
        className,
      ].join(" ")}
    >
      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="text-right text-xs font-medium text-slate-900">
        {value ?? children}
      </span>
    </div>
  );
}

// ============================================================
// TABLE CELL
// ============================================================

export function Cell({
  children,
  muted = false,
  mono = false,
  className = "",
}) {
  return (
    <div
      className={[
        "text-xs",
        muted ? "text-slate-400" : "text-slate-700",
        mono ? "font-mono" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

// ============================================================
// BADGES
// ============================================================

export function Badge({
  children,
  tone = "neutral",
  className = "",
}) {
  const tones = {
    neutral: "border-slate-200 bg-slate-50 text-slate-600",
    red: "border-red-200 bg-red-50 text-red-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={[
        "inline-flex items-center border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
        tones[tone] || tones.neutral,
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({
  severity,
}) {
  const tone = severityTone(severity);

  return (
    <span
      className="inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
      style={{
        color: tone.color,
        backgroundColor: tone.bg,
        borderColor: `${tone.color}33`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: tone.color }}
      />

      {tone.label}
    </span>
  );
}

export function StatusBadge({
  status,
}) {
  const tone = statusTone(status);

  return (
    <span
      className="inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
      style={{
        color: tone.color,
        backgroundColor: tone.bg,
        borderColor: `${tone.color}33`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: tone.color }}
      />

      {tone.label}
    </span>
  );
}

// ============================================================
// BUTTON
// ============================================================

export function Button({
  children,
  variant = "secondary",
  size = "md",
  className = "",
  icon: Icon,
  ...props
}) {
  const variants = {
    primary:
      "border-[#ED1C2E] bg-[#ED1C2E] text-white hover:bg-[#C91527]",

    secondary:
      "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",

    ghost:
      "border-transparent bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900",

    danger:
      "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",

    dark:
      "border-slate-900 bg-slate-900 text-white hover:bg-slate-800",
  };

  const sizes = {
    sm: "h-8 px-3 text-[11px]",
    md: "h-9 px-3.5 text-xs",
    lg: "h-10 px-4 text-sm",
  };

  return (
    <button
      type="button"
      className={[
        "inline-flex items-center justify-center gap-2 border font-medium transition-colors",
        FOCUS,
        variants[variant] || variants.secondary,
        sizes[size] || sizes.md,
        className,
      ].join(" ")}
      {...props}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

// ============================================================
// NOTICE
// ============================================================

export function Notice({
  title,
  message,
  tone = "info",
  className = "",
}) {
  const config = {
    info: {
      icon: Clock3,
      classes: "border-blue-200 bg-blue-50 text-blue-800",
    },

    success: {
      icon: CheckCircle2,
      classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
    },

    warning: {
      icon: AlertTriangle,
      classes: "border-amber-200 bg-amber-50 text-amber-800",
    },

    danger: {
      icon: AlertTriangle,
      classes: "border-red-200 bg-red-50 text-red-800",
    },
  };

  const current = config[tone] || config.info;
  const Icon = current.icon;

  return (
    <div
      className={[
        "flex gap-3 border p-4",
        current.classes,
        className,
      ].join(" ")}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />

      <div>
        {title && (
          <p className="text-xs font-semibold">
            {title}
          </p>
        )}

        {message && (
          <p className="mt-1 text-xs leading-5 opacity-80">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// EMPTY / LOADING
// ============================================================

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 h-1 w-8 bg-slate-200" />

      <h3 className="text-sm font-semibold text-slate-800">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}

export function LoadingState({
  label = "Loading...",
}) {
  return (
    <div className="flex min-h-[180px] items-center justify-center gap-2 text-xs text-slate-400">
      <Loader2 size={15} className="animate-spin" />
      {label}
    </div>
  );
}

// ============================================================
// SEARCH
// ============================================================

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) {
  return (
    <div
      className={[
        "flex h-9 items-center gap-2 border border-slate-200 bg-white px-3",
        className,
      ].join(" ")}
    >
      <Search size={14} className="shrink-0 text-slate-400" />

      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={[
          "min-w-0 flex-1 bg-transparent text-xs text-slate-900 outline-none",
          "placeholder:text-slate-400",
          FOCUS,
        ].join(" ")}
      />

      {value && (
        <button
          type="button"
          onClick={() =>
            onChange?.({
              target: {
                value: "",
              },
            })
          }
          className="text-slate-400 hover:text-slate-700"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

// ============================================================
// SELECT
// ============================================================

export function Select({
  value,
  onChange,
  options = [],
  className = "",
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={[
          "h-9 appearance-none border border-slate-200 bg-white px-3 pr-8 text-xs text-slate-700",
          FOCUS,
          className,
        ].join(" ")}
      >
        {options.map((option) => {
          const item =
            typeof option === "string"
              ? {
                  label: option,
                  value: option,
                }
              : option;

          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>

      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

// ============================================================
// SEGMENTED CONTROL
// ============================================================

export function SegmentedControl({
  value,
  onChange,
  options = [],
}) {
  return (
    <div className="inline-flex border border-slate-200 bg-white p-0.5">
      {options.map((option) => {
        const item =
          typeof option === "string"
            ? {
                label: option,
                value: option,
              }
            : option;

        const active = value === item.value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange?.(item.value)}
            className={[
              "h-8 px-3 text-[11px] font-medium transition-colors",
              active
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// SEVERITY BAR
// ============================================================

export function SeverityBar({
  severity,
  value = 100,
}) {
  const tone = severityTone(severity);

  return (
    <div className="h-1.5 w-full bg-slate-100">
      <div
        className="h-full transition-all"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          backgroundColor: tone.color,
        }}
      />
    </div>
  );
}

// ============================================================
// SIDE PANEL
// ============================================================

export function SidePanel({
  open,
  onClose,
  title,
  description,
  children,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/10"
      />

      <aside className="absolute inset-y-0 right-0 w-full max-w-lg border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {title}
              </h2>

              {description && (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-900"
            >
              <X size={17} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {children}
          </div>
        </div>
      </aside>
    </div>
  );
}

// ============================================================
// SPINE ROW
// ============================================================

export function SpineRow({
  number,
  title,
  description,
  meta,
  active = false,
  children,
}) {
  return (
    <div className="relative flex gap-4">
      <div className="flex w-7 shrink-0 flex-col items-center">
        <div
          className={[
            "flex h-7 w-7 items-center justify-center border text-[10px] font-bold",
            active
              ? "border-[#ED1C2E] bg-red-50 text-[#ED1C2E]"
              : "border-slate-200 bg-white text-slate-400",
          ].join(" ")}
        >
          {number}
        </div>

        <div className="mt-2 h-full w-px bg-slate-200" />
      </div>

      <div className="min-w-0 flex-1 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-slate-900">
            {title}
          </h4>

          {meta && (
            <span className="text-[10px] text-slate-400">
              {meta}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        )}

        {children}
      </div>
    </div>
  );
}
// ============================================================
// TABLE
// ============================================================

export function Table({
  columns = [],
  data = [],
  rows,
  emptyMessage = "No records found.",
  className = "",
}) {
  const items = rows ?? data;

  return (
    <div
      className={[
        "w-full overflow-x-auto border border-slate-200 bg-white",
        className,
      ].join(" ")}
    >
      {items.length === 0 ? (
        <div className="px-5 py-10 text-center text-xs text-slate-400">
          {emptyMessage}
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((column) => (
                <th
                  key={column.key || column.accessor || column.label}
                  className={[
                    "px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400",
                    column.className || "",
                  ].join(" ")}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {items.map((row, rowIndex) => (
              <tr
                key={row.id || row._id || rowIndex}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
              >
                {columns.map((column) => {
                  const key = column.key || column.accessor;
                  const value = row?.[key];

                  return (
                    <td
                      key={key || column.label}
                      className={[
                        "px-4 py-3 align-middle",
                        column.className || "",
                      ].join(" ")}
                    >
                      {typeof column.render === "function"
                        ? column.render(value, row, rowIndex)
                        : value ?? "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}


// ============================================================
// SCORE RING
// ============================================================

export function ScoreRing({
  value = 0,
  max = 100,
  size = 96,
  label,
  caption,
}) {
  const safeMax = Number(max) || 100;
  const numericValue = Number(value) || 0;

  const percentage = Math.max(
    0,
    Math.min(100, (numericValue / safeMax) * 100)
  );

  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative shrink-0"
        style={{
          width: size,
          height: size,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
          />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#ED1C2E"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-semibold tracking-tight text-slate-900">
            {Math.round(numericValue)}
          </span>
        </div>
      </div>

      {(label || caption) && (
        <div className="min-w-0">
          {label && (
            <p className="text-sm font-semibold text-slate-900">
              {label}
            </p>
          )}

          {caption && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}


// ============================================================
// LIVE DOT
// ============================================================

export function LiveDot({
  online = true,
  label,
}) {
  return (
    <div className="inline-flex items-center gap-2 text-xs text-slate-500">
      <span
        className={[
          "h-2 w-2 rounded-full",
          online ? "bg-emerald-500" : "bg-slate-300",
        ].join(" ")}
      />

      {label && <span>{label}</span>}
    </div>
  );
}


// ============================================================
// LOADING PAGE
// ============================================================

export function LoadingPage({
  label = "Loading...",
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7F9]">
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <Loader2 size={17} className="animate-spin" />
        {label}
      </div>
    </div>
  );
}
// ============================================================
// TIMELINE
// ============================================================

export function Timeline({
  items = [],
  children,
  className = "",
}) {
  if (children) {
    return (
      <div
        className={[
          "relative",
          className,
        ].join(" ")}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={[
        "relative",
        className,
      ].join(" ")}
    >
      {items.map((item, index) => (
        <div
          key={item.id || item._id || index}
          className="relative flex gap-4 pb-6 last:pb-0"
        >
          {/* connector */}
          {index < items.length - 1 && (
            <div className="absolute left-[5px] top-3 h-full w-px bg-slate-200" />
          )}

          {/* marker */}
          <div className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#ED1C2E]" />

          {/* content */}
          <div className="min-w-0 flex-1">
            {item.title && (
              <p className="text-xs font-semibold text-slate-900">
                {item.title}
              </p>
            )}

            {item.description && (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {item.description}
              </p>
            )}

            {item.meta && (
              <p className="mt-1 text-[10px] text-slate-400">
                {item.meta}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
// ============================================================
// RAW PAYLOAD
// ============================================================

export function RawPayload({
  value,
  title = "Raw payload",
  className = "",
}) {
  let output = value;

  if (typeof value !== "string") {
    try {
      output = JSON.stringify(value ?? {}, null, 2);
    } catch {
      output = String(value ?? "");
    }
  }

  return (
    <div
      className={[
        "border border-slate-200 bg-slate-50",
        className,
      ].join(" ")}
    >
      {title && (
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {title}
          </p>
        </div>
      )}

      <pre className="max-h-[420px] overflow-auto px-4 py-4 font-mono text-[11px] leading-5 text-slate-600">
        {output}
      </pre>
    </div>
  );
}