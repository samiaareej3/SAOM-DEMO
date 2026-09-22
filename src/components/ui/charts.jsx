 import { PALETTE, severityTone } from "./tokens";

// ============================================================
// AREA CHART
// ============================================================

export function AreaChart({
  data = [],
  height = 180,
  className = "",
  showGrid = true,
}) {
  if (!data.length) {
    return (
      <div
        className={[
          "flex items-center justify-center text-xs text-slate-400",
          className,
        ].join(" ")}
        style={{ height }}
      >
        No data
      </div>
    );
  }

  const width = 800;
  const padding = 24;

  const values = data.map((item) =>
    typeof item === "number" ? item : Number(item.value || 0)
  );

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);

  const range = Math.max(max - min, 1);

  const points = values.map((value, index) => {
    const x =
      padding +
      (index / Math.max(values.length - 1, 1)) *
        (width - padding * 2);

    const y =
      height -
      padding -
      ((value - min) / range) *
        (height - padding * 2);

    return [x, y];
  });

  const linePath = points
    .map(([x, y], index) =>
      `${index === 0 ? "M" : "L"} ${x} ${y}`
    )
    .join(" ");

  const areaPath = [
    linePath,
    `L ${points[points.length - 1][0]} ${height - padding}`,
    `L ${points[0][0]} ${height - padding}`,
    "Z",
  ].join(" ");

  return (
    <div
      className={["w-full", className].join(" ")}
      style={{ height }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <defs>
          <linearGradient
            id="saom-area-gradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor={PALETTE.red}
              stopOpacity="0.16"
            />
            <stop
              offset="100%"
              stopColor={PALETTE.red}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {showGrid &&
          [0.25, 0.5, 0.75].map((ratio) => {
            const y =
              padding +
              ratio * (height - padding * 2);

            return (
              <line
                key={ratio}
                x1={padding}
                x2={width - padding}
                y1={y}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth="1"
              />
            );
          })}

        <path
          d={areaPath}
          fill="url(#saom-area-gradient)"
        />

        <path
          d={linePath}
          fill="none"
          stroke={PALETTE.red}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        {points.map(([x, y], index) => (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="2.5"
            fill="white"
            stroke={PALETTE.red}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// LINE CHART
// ============================================================

export function LineChart({
  data = [],
  height = 180,
  className = "",
  color = PALETTE.red,
}) {
  if (!data.length) {
    return (
      <div
        className={[
          "flex items-center justify-center text-xs text-slate-400",
          className,
        ].join(" ")}
        style={{ height }}
      >
        No data
      </div>
    );
  }

  const width = 800;
  const padding = 24;

  const values = data.map((item) =>
    typeof item === "number" ? item : Number(item.value || 0)
  );

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = values.map((value, index) => {
    const x =
      padding +
      (index / Math.max(values.length - 1, 1)) *
        (width - padding * 2);

    const y =
      height -
      padding -
      ((value - min) / range) *
        (height - padding * 2);

    return [x, y];
  });

  const path = points
    .map(([x, y], index) =>
      `${index === 0 ? "M" : "L"} ${x} ${y}`
    )
    .join(" ");

  return (
    <div
      className={["w-full", className].join(" ")}
      style={{ height }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        {[0.25, 0.5, 0.75].map((ratio) => {
          const y =
            padding +
            ratio * (height - padding * 2);

          return (
            <line
              key={ratio}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="#E2E8F0"
              strokeWidth="1"
            />
          );
        })}

        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        {points.map(([x, y], index) => (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="2.5"
            fill="white"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// BAR CHART
// ============================================================

export function BarChart({
  data = [],
  height = 180,
  className = "",
  color = PALETTE.red,
}) {
  if (!data.length) {
    return (
      <div
        className={[
          "flex items-center justify-center text-xs text-slate-400",
          className,
        ].join(" ")}
        style={{ height }}
      >
        No data
      </div>
    );
  }

  const width = 800;
  const padding = 24;

  const values = data.map((item) =>
    typeof item === "number" ? item : Number(item.value || 0)
  );

  const max = Math.max(...values, 1);

  const usableWidth = width - padding * 2;
  const gap = 8;
  const barWidth =
    (usableWidth - gap * (values.length - 1)) /
    values.length;

  return (
    <div
      className={["w-full", className].join(" ")}
      style={{ height }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        {[0.25, 0.5, 0.75].map((ratio) => {
          const y =
            padding +
            ratio * (height - padding * 2);

          return (
            <line
              key={ratio}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="#E2E8F0"
              strokeWidth="1"
            />
          );
        })}

        {values.map((value, index) => {
          const barHeight =
            ((value / max) * (height - padding * 2));

          const x =
            padding +
            index * (barWidth + gap);

          const y =
            height - padding - barHeight;

          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={Math.max(barWidth, 1)}
              height={barHeight}
              fill={color}
              opacity="0.9"
            />
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// DONUT
// ============================================================

export function Donut({
  value = 0,
  total = 100,
  size = 120,
  strokeWidth = 10,
  color = PALETTE.red,
  label,
  sublabel,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const percentage =
    total > 0
      ? Math.max(0, Math.min(1, value / total))
      : 0;

  const dashOffset =
    circumference * (1 - percentage);

  return (
    <div
      className="relative inline-flex items-center justify-center"
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
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-semibold tracking-tight text-slate-900">
          {label ?? value}
        </span>

        {sublabel && (
          <span className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-400">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SPARKLINE
// ============================================================

export function Sparkline({
  data = [],
  width = 100,
  height = 32,
  color = PALETTE.red,
}) {
  if (!data.length) {
    return null;
  }

  const values = data.map((item) =>
    typeof item === "number" ? item : Number(item.value || 0)
  );

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const padding = 2;

  const points = values.map((value, index) => {
    const x =
      padding +
      (index / Math.max(values.length - 1, 1)) *
        (width - padding * 2);

    const y =
      height -
      padding -
      ((value - min) / range) *
        (height - padding * 2);

    return [x, y];
  });

  const path = points
    .map(([x, y], index) =>
      `${index === 0 ? "M" : "L"} ${x} ${y}`
    )
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}