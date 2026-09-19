/* ============================================================================
   SAOM-AI — VISUALISATION

   Drawn with inline SVG on purpose: the project had no chart library
   installed, and these five shapes cover every chart the dashboard needs
   without adding a dependency. Each one renders nothing when it has no data,
   so an empty backend response degrades to an empty state rather than an
   axis with no line on it.
============================================================================ */

import { useId } from "react";
import { PALETTE, severityTone } from "./tokens";

/* --------------------------------------------------------------- area line */

export function AreaChart({
  data = [],
  height = 200,
  stroke = PALETTE.indigo,
  fill = PALETTE.indigo,
  valueLabel = "events",
}) {
  const gradientId = useId();

  if (!Array.isArray(data) || data.length === 0) return null;

  const width = 900;
  const padding = { top: 12, right: 8, bottom: 22, left: 8 };

  const values = data.map((point) => Number(point.value) || 0);
  const max = Math.max(...values, 1);

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const step = data.length > 1 ? innerWidth / (data.length - 1) : 0;

  const points = values.map((value, index) => ({
    x: padding.left + index * step,
    y: padding.top + innerHeight - (value / max) * innerHeight,
  }));

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");

  const area = `${line} L${points[points.length - 1].x} ${
    padding.top + innerHeight
  } L${points[0].x} ${padding.top + innerHeight} Z`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-[200px] w-full"
        role="img"
        aria-label={`Trend of ${valueLabel} across ${data.length} intervals, peaking at ${max}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity="0.16" />
            <stop offset="100%" stopColor={fill} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerHeight * ratio}
            y2={padding.top + innerHeight * ratio}
            stroke={PALETTE.hairline}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />

        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="8"
            fill="transparent"
            className="cursor-default"
          >
            <title>{`${data[index].label}: ${values[index]} ${valueLabel}`}</title>
          </circle>
        ))}
      </svg>

      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-slate-400">
        <span>{data[0]?.label}</span>

        <span>Peak {max}</span>

        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- severity stack bar */

/*
 * One horizontal rule split by severity. Faster to read than a pie and it
 * doubles as a legend, which is why it carries the dashboard's severity mix.
 */
export function SeverityBar({ counts = {}, showLegend = true }) {
  const order = ["Critical", "High", "Medium", "Low"];

  const entries = order
    .map((key) => ({
      key,
      value: Number(counts[key]) || 0,
      tone: severityTone(key),
    }))
    .filter((entry) => entry.value > 0);

  const total = entries.reduce((sum, entry) => sum + entry.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100" />
    );
  }

  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
        {entries.map((entry) => (
          <div
            key={entry.key}
            className={entry.tone.spine}
            style={{ width: `${(entry.value / total) * 100}%` }}
            title={`${entry.key}: ${entry.value}`}
          />
        ))}
      </div>

      {showLegend && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {order.map((key) => {
            const tone = severityTone(key);
            const value = Number(counts[key]) || 0;

            return (
              <span key={key} className="inline-flex items-center gap-2 text-xs">
                <span className={`h-2 w-2 rounded-full ${tone.dot}`} />

                <span className="text-slate-500">{key}</span>

                <span className="font-semibold tabular-nums text-slate-900">
                  {value}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- score ring */

export function ScoreRing({
  value = 0,
  max = 100,
  size = 120,
  label,
  caption,
  tone,
}) {
  const safeValue = Math.max(0, Math.min(Number(value) || 0, max));
  const ratio = max > 0 ? safeValue / max : 0;

  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;

  const color =
    tone ||
    (ratio >= 0.75
      ? PALETTE.low
      : ratio >= 0.5
        ? PALETTE.medium
        : ratio >= 0.25
          ? PALETTE.high
          : PALETTE.critical);

  return (
    <div className="flex items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${label || "Score"}: ${safeValue} of ${max}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={PALETTE.hairline}
          strokeWidth="7"
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .6s cubic-bezier(.22,1,.36,1)" }}
        />

        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-slate-900 text-[24px] font-semibold tabular-nums"
        >
          {safeValue}
        </text>
      </svg>

      {(label || caption) && (
        <div>
          {label && (
            <p className="text-sm font-semibold text-slate-900">{label}</p>
          )}

          {caption && (
            <p className="mt-1 max-w-[28ch] text-xs leading-5 text-slate-500">
              {caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- bar series */

export function BarSeries({ data = [], valueLabel = "" }) {
  if (!Array.isArray(data) || data.length === 0) return null;

  const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);

  return (
    <ul className="space-y-3">
      {data.map((item, index) => {
        const value = Number(item.value) || 0;

        return (
          <li key={item.label || index}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm text-slate-600" title={item.label}>
                {item.label}
              </span>

              <span className="text-sm font-semibold tabular-nums text-slate-900">
                {value}
                {valueLabel && (
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    {valueLabel}
                  </span>
                )}
              </span>
            </div>

            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${item.tone || "bg-indigo-500"}`}
                style={{
                  width: `${(value / max) * 100}%`,
                  transition: "width .5s cubic-bezier(.22,1,.36,1)",
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ donut */

export function Donut({ segments = [], size = 150, centerLabel, centerValue }) {
  const active = segments.filter((segment) => Number(segment.value) > 0);
  const total = active.reduce((sum, segment) => sum + Number(segment.value), 0);

  if (total === 0) return null;

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {active.map((segment) => {
            const fraction = Number(segment.value) / total;
            const dash = circumference * fraction;

            const circle = (
              <circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="14"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              >
                <title>{`${segment.label}: ${segment.value}`}</title>
              </circle>
            );

            offset += dash;

            return circle;
          })}
        </g>

        {(centerValue !== undefined || centerLabel) && (
          <>
            <text
              x="50%"
              y="46%"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-slate-900 text-[22px] font-semibold tabular-nums"
            >
              {centerValue ?? total}
            </text>

            <text
              x="50%"
              y="62%"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-slate-400 text-[11px]"
            >
              {centerLabel}
            </text>
          </>
        )}
      </svg>

      <ul className="space-y-2">
        {active.map((segment) => (
          <li
            key={segment.label}
            className="flex items-center gap-2.5 text-sm text-slate-600"
          >
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: segment.color }}
            />

            <span className="min-w-0 truncate">{segment.label}</span>

            <span className="font-semibold tabular-nums text-slate-900">
              {segment.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}