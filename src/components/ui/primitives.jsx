/* ============================================================================
   SAOM-AI — UI PRIMITIVES

   Presentation only. Nothing here fetches, transforms or owns application
   data; every component takes what the page already has and draws it.
============================================================================ */

import { FOCUS, SEVERITY, SURFACE, severityTone, statusTone } from "./tokens";

/* ----------------------------------------------------------------- headings */

export function PageHeader({
  title,
  description,
  breadcrumb,
  status,
  actions,
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-5 py-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
        <div className="min-w-0">
          {breadcrumb && (
            <p className="text-xs font-medium text-slate-400">{breadcrumb}</p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">
              {title}
            </h1>

            {status}
          </div>

          {description && (
            <p className="mt-1.5 max-w-[68ch] text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

export function SectionHeading({ title, hint, action, className = "" }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>

        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>

      {action}
    </div>
  );
}

/* -------------------------------------------------------------------- cards */

export function Card({ className = "", children, ...rest }) {
  return (
    <div className={`${SURFACE.card} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Panel({ title, hint, action, className = "", children }) {
  return (
    <section className={`${SURFACE.card} ${className}`}>
      {(title || action) && (
        <div className="border-b border-slate-200 px-5 py-4">
          <SectionHeading title={title} hint={hint} action={action} />
        </div>
      )}

      <div className="p-5">{children}</div>
    </section>
  );
}

/*
 * StatCard deliberately supports three weights. A dashboard where every tile
 * looks identical hides the one number that matters, so `emphasis` promotes a
 * single metric and `tone` carries severity without shouting.
 */
export function StatCard({
  label,
  value,
  hint,
  delta,
  tone = "neutral",
  emphasis = false,
  icon: Icon,
  onClick,
}) {
  const accents = {
    neutral: "text-slate-900",
    critical: "text-red-600",
    high: "text-orange-600",
    medium: "text-amber-600",
    good: "text-emerald-600",
    ai: "text-violet-600",
    brand: "text-indigo-600",
  };

  const spines = {
    neutral: "bg-slate-200",
    critical: "bg-red-600",
    high: "bg-orange-500",
    medium: "bg-amber-500",
    good: "bg-emerald-600",
    ai: "bg-violet-600",
    brand: "bg-indigo-600",
  };

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-5 text-left ${
        onClick
          ? `transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50/60 ${FOCUS}`
          : ""
      }`}
    >
      <span
        className={`absolute inset-y-0 left-0 w-[3px] ${spines[tone] || spines.neutral}`}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>

        {Icon && <Icon size={16} className="mt-0.5 shrink-0 text-slate-300" />}
      </div>

      <p
        className={`mt-3 font-semibold tabular-nums tracking-tight ${
          emphasis ? "text-[40px] leading-none" : "text-[28px] leading-none"
        } ${accents[tone] || accents.neutral}`}
      >
        {value ?? "—"}
      </p>

      {(hint || delta) && (
        <p className="mt-2.5 text-xs text-slate-500">
          {delta && <span className="mr-1.5 font-medium">{delta}</span>}
          {hint}
        </p>
      )}
    </Wrapper>
  );
}

/* ------------------------------------------------------------------ badges */

export function Badge({ tone = "slate", className = "", children }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${
        tones[tone] || tones.slate
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const tone = severityTone(severity);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${tone.border} ${tone.bg} ${tone.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {severity || "Unknown"}
    </span>
  );
}

export function StatusBadge({ status, children }) {
  const tone = statusTone(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${tone.border} ${tone.bg} ${tone.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {children || status || "Unknown"}
    </span>
  );
}

/* A quiet, always-on signal that the page is bound to a live backend. */
export function LiveDot({ online = true, label }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
      <span className="relative flex h-2 w-2">
        {online && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        )}

        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            online ? "bg-emerald-500" : "bg-slate-300"
          }`}
        />
      </span>

      {label}
    </span>
  );
}

/* ----------------------------------------------------------------- controls */

export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  loading = false,
  className = "",
  children,
  ...rest
}) {
  const variants = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400",
    ghost: "text-slate-600 hover:bg-slate-100 disabled:text-slate-300",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300",
    outlineDanger:
      "border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:text-red-300",
  };

  const sizes = {
    sm: "h-8 px-2.5 text-xs gap-1.5",
    md: "h-9 px-3.5 text-sm gap-2",
    lg: "h-10 px-4 text-sm gap-2",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 disabled:cursor-not-allowed ${FOCUS} ${
        variants[variant] || variants.secondary
      } ${sizes[size]} ${className}`}
      {...rest}
    >
      {Icon && (
        <Icon size={size === "sm" ? 14 : 16} className={loading ? "animate-spin" : ""} />
      )}

      {children}
    </button>
  );
}

export function SearchInput({ value, onChange, placeholder, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>

      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 ${FOCUS}`}
      />
    </div>
  );
}

export function Select({ value, onChange, children, className = "", label }) {
  return (
    <label className={`relative block ${className}`}>
      {label && <span className="sr-only">{label}</span>}

      <select
        value={value}
        onChange={onChange}
        className={`h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-700 ${FOCUS}`}
      >
        {children}
      </select>

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}

/* Segmented filter — faster to scan and to hit than a dropdown for 3–6 known
   values, which is what most of the filters in this product are. */
export function SegmentedControl({ value, onChange, options, className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5 ${className}`}
      role="tablist"
    >
      {options.map((option) => {
        const optionValue =
          typeof option === "string" ? option : option.value;

        const optionLabel =
          typeof option === "string" ? option : option.label;

        const active = optionValue === value;

        return (
          <button
            key={optionValue}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(optionValue)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${FOCUS} ${
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}

export function Toolbar({ children, className = "" }) {
  return (
    <div
      className={`flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ states */

export function EmptyState({ title, description, action, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Icon size={20} />
        </div>
      )}

      <p className="text-sm font-semibold text-slate-900">{title}</p>

      {description && (
        <p className="mt-1.5 max-w-[46ch] text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-slate-100 ${className}`} />;
}

export function LoadingState({ label = "Loading telemetry", rows = 3 }) {
  return (
    <div className="p-5">
      <p className="text-sm text-slate-500">{label}…</p>

      <div className="mt-4 space-y-2.5">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export function LoadingPage({ label = "Loading" }) {
  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6 lg:px-8">
      <Skeleton className="h-8 w-56" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>

      <Skeleton className="mt-4 h-72 w-full" />

      <p className="mt-4 text-xs text-slate-400">{label}…</p>
    </div>
  );
}

/* Inline messages. Errors say what failed and what is still usable, rather
   than apologising. */
export function Notice({ tone = "info", children, onDismiss }) {
  const tones = {
    info: "border-slate-200 bg-slate-50 text-slate-700",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
        tones[tone] || tones.info
      }`}
      role={tone === "error" ? "alert" : "status"}
    >
      <span className="leading-6">{children}</span>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={`shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 ${FOCUS}`}
          aria-label="Dismiss message"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-4 w-4"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- table */

export function Table({ columns, children, className = "" }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((column) => (
              <th
                key={column.key || column.label}
                scope="col"
                className={`px-4 py-3 text-xs font-medium text-slate-500 ${
                  column.align === "right" ? "text-right" : ""
                } ${column.className || ""}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/* The severity spine: a hairline rule on the leading edge of a row. It reads
   faster than a chip when scanning a long queue. */
export function SpineRow({ severity, selected, onClick, children }) {
  const tone = severityTone(severity);

  return (
    <tr
      onClick={onClick}
      className={`relative border-b border-slate-100 last:border-0 ${
        onClick ? "cursor-pointer" : ""
      } ${selected ? "bg-indigo-50/60" : "hover:bg-slate-50"}`}
    >
      <td className="w-[3px] p-0">
        <span className={`block h-full min-h-[52px] w-[3px] ${tone.spine}`} />
      </td>

      {children}
    </tr>
  );
}

export function Cell({ className = "", children, ...rest }) {
  return (
    <td className={`px-4 py-3.5 align-middle ${className}`} {...rest}>
      {children}
    </td>
  );
}

/* --------------------------------------------------------------- key/value */

export function InfoRow({ label, value, mono = false, action }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="shrink-0 text-xs text-slate-500">{label}</span>

      <span className="flex min-w-0 items-center gap-2">
        <span
          className={`truncate text-right text-sm text-slate-900 ${
            mono ? "font-mono text-[13px]" : ""
          }`}
          title={typeof value === "string" ? value : undefined}
        >
          {value ?? "—"}
        </span>

        {action}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------- timeline */

export function Timeline({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <ol className="relative ml-1.5 border-l border-slate-200">
      {items.map((item, index) => {
        const tone = item.severity
          ? severityTone(item.severity)
          : SEVERITY.Unknown;

        return (
          <li key={item.id || index} className="relative pb-5 pl-5 last:pb-0">
            <span
              className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${tone.dot}`}
            />

            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-slate-900">{item.title}</p>

              {item.time && (
                <span className="text-xs tabular-nums text-slate-400">
                  {item.time}
                </span>
              )}
            </div>

            {item.description && (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {item.description}
              </p>
            )}

            {item.meta}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------- side panel */

/*
 * Detail panel. Slides in over the page, never displaces the list behind it,
 * and traps nothing — Escape and the scrim both close it.
 */
export function SidePanel({ open, onClose, title, subtitle, children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Details"}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        className="relative flex h-full w-full max-w-[520px] flex-col border-l border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            autoFocus
            className={`rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 ${FOCUS}`}
            aria-label="Close details"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
}

/* Raw backend payloads stay inspectable — analysts need the evidence, not a
   prettified guess at it. */
export function RawPayload({ label = "Raw backend response", value }) {
  return (
    <details className="group rounded-lg border border-slate-200 bg-slate-50">
      <summary
        className={`cursor-pointer list-none px-4 py-2.5 text-xs font-medium text-slate-600 ${FOCUS}`}
      >
        <span className="inline-flex items-center gap-1.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 transition-transform duration-150 group-open:rotate-90"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>

          {label}
        </span>
      </summary>

      <pre className="max-h-[420px] overflow-auto border-t border-slate-200 p-4 font-mono text-[12px] leading-6 text-slate-700">
        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}