import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getDashboardStats,
  getAttackTimeline,
  getAlerts,
  getAssets,
} from "../services/dashboardApi";

const NAVIGATION_ITEMS = [
  {
    group: "COMMAND CENTER",
    items: [
      {
        label: "Overview",
        icon: "◈",
        route: "/dashboard",
        active: true,
      },
    ],
  },
  {
    group: "OPERATIONS",
    items: [
      {
        label: "Incidents",
        icon: "◉",
        route: "/incidents",
      },
      {
        label: "Infrastructure",
        icon: "▣",
        route: "/infrastructure",
      },
      {
        label: "Threat Intelligence",
        icon: "⌁",
        route: "/threat-intelligence",
      },
    ],
  },
  {
    group: "ANALYSIS",
    items: [
      {
        label: "Investigation",
        icon: "◇",
        route: "/investigation",
      },
      {
        label: "Attack Graph",
        icon: "⌘",
        route: "/attack-graph",
      },
    ],
  },
  {
    group: "RESPONSE",
    items: [
      {
        label: "Response & Automation",
        icon: "⚡",
        route: "/response",
      },
      {
        label: "Approval Queue",
        icon: "✓",
        route: "/approvals",
      },
    ],
  },
  {
    group: "GOVERNANCE",
    items: [
      {
        label: "Security Audits",
        icon: "▤",
        route: "/audit",
      },
    ],
  },
  {
    group: "INTELLIGENCE",
    items: [
      {
        label: "AI Assistant",
        icon: "✦",
        route: "/ai-assistant",
      },
    ],
  },
];

function normalizeArray(data, key) {
  if (Array.isArray(data)) return data;

  return data?.[key] || data?.data || [];
}

function getAlertId(alert) {
  return alert?._id || alert?.id || alert?.alert_id;
}

function getAlertSource(alert) {
  return (
    alert?.source_ip ||
    alert?.source_hostname ||
    alert?.source ||
    "Unknown source"
  );
}

function getAlertTarget(alert) {
  return (
    alert?.destination_ip ||
    alert?.destination_hostname ||
    alert?.hostname ||
    alert?.asset?.hostname ||
    "Unknown target"
  );
}

function getSeverityClass(severity) {
  const normalized = String(severity || "medium").toLowerCase();

  if (normalized === "critical") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  if (normalized === "high") {
    return "border-orange-400/30 bg-orange-400/10 text-orange-300";
  }

  if (normalized === "medium") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
}

function getSeverityBarClass(severity) {
  const normalized = String(severity || "medium").toLowerCase();

  if (normalized === "critical") return "bg-red-400";
  if (normalized === "high") return "bg-orange-400";
  if (normalized === "medium") return "bg-yellow-400";

  return "bg-emerald-400";
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="relative overflow-hidden border border-white/[0.08] bg-[#080e15] p-5">
      <div
        className={`absolute left-0 top-0 h-[2px] w-full ${color}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
            {label}
          </p>

          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-100">
            {value}
          </p>
        </div>

        <div className="flex h-8 w-8 items-center justify-center border border-white/10 bg-white/[0.03] text-sm text-slate-400">
          {icon}
        </div>
      </div>

      <div className="mt-5 h-px bg-white/[0.05]" />
    </div>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
      <div>
        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-600">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-sm font-semibold text-slate-200">
          {title}
        </h2>
      </div>

      {action}
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex min-h-[190px] flex-col items-center justify-center px-5 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-500">
        ◌
      </div>

      <p className="mt-4 text-xs text-slate-400">{title}</p>

      <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-slate-600">
        {description}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        statsResponse,
        alertsResponse,
        assetsResponse,
        timelineResponse,
      ] = await Promise.all([
        getDashboardStats(),
        getAlerts(),
        getAssets(),
        getAttackTimeline(),
      ]);

      setStats(statsResponse || {});
      setAlerts(normalizeArray(alertsResponse, "alerts"));
      setAssets(normalizeArray(assetsResponse, "assets"));
      setTimeline(normalizeArray(timelineResponse, "timeline"));
    } catch (requestError) {
      console.error("Dashboard loading error:", requestError);

      setError(
        requestError?.message || "Failed to load dashboard telemetry."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const activeAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const status = String(alert?.status || "").toUpperCase();

      return !["RESOLVED", "CLOSED", "MITIGATED"].includes(status);
    });
  }, [alerts]);

  const criticalAlerts = useMemo(() => {
    return activeAlerts.filter(
      (alert) =>
        String(alert?.severity || "").toLowerCase() === "critical"
    );
  }, [activeAlerts]);

  const highAlerts = useMemo(() => {
    return activeAlerts.filter(
      (alert) =>
        String(alert?.severity || "").toLowerCase() === "high"
    );
  }, [activeAlerts]);

  const maxTimelineValue = useMemo(() => {
    return Math.max(
      ...timeline.map((point) =>
        Number(
          point?.attacks ??
            point?.count ??
            point?.alerts ??
            point?.total ??
            0
        )
      ),
      1
    );
  }, [timeline]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05080d] text-slate-400">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-800 border-t-cyan-400" />

          <p className="mt-5 text-xs uppercase tracking-[0.2em]">
            Initializing SAOM-AI
          </p>

          <p className="mt-2 text-[10px] text-slate-600">
            Loading command center telemetry...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05080d] text-slate-200">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-[275px] shrink-0 flex-col border-r border-white/[0.06] bg-[#070b11] lg:flex">
          <div className="flex h-[94px] items-center border-b border-white/[0.06] px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-cyan-400/50 bg-cyan-400/[0.05] text-lg font-bold text-cyan-300">
                S
              </div>

              <div>
                <h1 className="text-xl font-semibold tracking-wide text-slate-100">
                  SAOM<span className="text-cyan-400">-AI</span>
                </h1>

                <p className="mt-1 text-[9px] tracking-[0.22em] text-slate-600">
                  SECURITY OPERATIONS
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-7">
            {NAVIGATION_ITEMS.map((section) => (
              <div key={section.group} className="mb-7">
                <p className="mb-3 px-4 text-[9px] font-bold tracking-[0.22em] text-slate-600">
                  {section.group}
                </p>

                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.route}
                      type="button"
                      onClick={() => navigate(item.route)}
                      className={`group flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left text-xs transition ${
                        item.active
                          ? "border-cyan-400 bg-cyan-400/[0.08] text-cyan-300"
                          : "border-transparent text-slate-500 hover:border-cyan-400/40 hover:bg-white/[0.025] hover:text-slate-200"
                      }`}
                    >
                      <span
                        className={`w-5 text-center text-sm ${
                          item.active
                            ? "text-cyan-300"
                            : "text-slate-600 group-hover:text-cyan-300"
                        }`}
                      >
                        {item.icon}
                      </span>

                      <span>{item.label}</span>

                      {item.label === "Incidents" &&
                        activeAlerts.length > 0 && (
                          <span className="ml-auto rounded-full bg-red-400/15 px-2 py-1 text-[9px] text-red-300">
                            {activeAlerts.length}
                          </span>
                        )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/[0.06] p-6">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />

              <div>
                <p className="text-[10px] font-medium text-slate-400">
                  SAOM Core Online
                </p>

                <p className="mt-1 text-[9px] text-slate-600">
                  Backend connection active
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="min-w-0 flex-1">
          {/* HEADER */}
          <header className="flex min-h-[105px] items-center justify-between border-b border-white/[0.06] px-5 py-5 sm:px-8">
            <div>
              <p className="text-[9px] font-bold tracking-[0.22em] text-slate-600">
                SECURITY OPERATIONS / COMMAND CENTER
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
                Command Center
              </h2>

              <p className="mt-2 hidden text-xs text-slate-500 sm:block">
                Unified security visibility, threat detection and response intelligence.
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 border border-emerald-400/20 bg-emerald-400/[0.04] px-3 py-2 text-[9px] font-bold tracking-widest text-emerald-400 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                LIVE
              </div>

              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[10px] text-slate-400 transition hover:border-cyan-400/30 hover:text-slate-200 disabled:opacity-50"
              >
                {refreshing ? "Refreshing..." : "↻ Refresh"}
              </button>

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/[0.05] text-xs font-bold text-cyan-300">
                A
              </div>
            </div>
          </header>

          <div className="space-y-6 p-5 sm:p-8">
            {error && (
              <div className="flex items-center gap-3 border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-xs">
                <span className="font-semibold text-red-400">
                  SYSTEM ERROR
                </span>

                <span className="text-red-300/70">{error}</span>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="ml-auto text-red-400 hover:text-red-200"
                >
                  ×
                </button>
              </div>
            )}

            {/* OVERVIEW */}
            <section>
              <div className="mb-4">
                <p className="text-[9px] font-bold tracking-[0.22em] text-slate-600">
                  EXECUTIVE OVERVIEW
                </p>

                <h3 className="mt-2 text-lg font-semibold text-slate-200">
                  Security Posture
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <StatCard
                  label="Total Alerts"
                  value={stats.totalAlerts ?? alerts.length}
                  icon="◉"
                  color="bg-cyan-400"
                />

                <StatCard
                  label="Critical"
                  value={stats.criticalAlerts ?? criticalAlerts.length}
                  icon="!"
                  color="bg-red-400"
                />

                <StatCard
                  label="High"
                  value={stats.highAlerts ?? highAlerts.length}
                  icon="▲"
                  color="bg-orange-400"
                />

                <StatCard
                  label="Medium"
                  value={stats.mediumAlerts ?? 0}
                  icon="◆"
                  color="bg-yellow-400"
                />

                <StatCard
                  label="Low"
                  value={stats.lowAlerts ?? 0}
                  icon="●"
                  color="bg-emerald-400"
                />

                <StatCard
                  label="Active Incidents"
                  value={activeAlerts.length}
                  icon="◈"
                  color="bg-blue-400"
                />
              </div>
            </section>

            {/* QUICK ACTIONS */}
            <section className="border border-white/[0.07] bg-[#080e15]">
              <SectionHeader
                eyebrow="OPERATIONS"
                title="Quick Actions"
              />

              <div className="grid grid-cols-1 gap-px bg-white/[0.05] sm:grid-cols-2 xl:grid-cols-4">
                <button
                  type="button"
                  onClick={() => navigate("/incidents")}
                  className="group bg-[#080e15] p-5 text-left transition hover:bg-cyan-400/[0.04]"
                >
                  <span className="text-xl text-cyan-400">◉</span>

                  <h4 className="mt-4 text-sm font-semibold text-slate-200">
                    Review Incidents
                  </h4>

                  <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
                    Investigate active threats and incident activity.
                  </p>

                  <p className="mt-4 text-[10px] text-cyan-400">
                    Open incidents →
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/infrastructure")}
                  className="group bg-[#080e15] p-5 text-left transition hover:bg-cyan-400/[0.04]"
                >
                  <span className="text-xl text-cyan-400">▣</span>

                  <h4 className="mt-4 text-sm font-semibold text-slate-200">
                    Inspect Infrastructure
                  </h4>

                  <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
                    Review assets, endpoints and system risk.
                  </p>

                  <p className="mt-4 text-[10px] text-cyan-400">
                    Open infrastructure →
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/investigation")}
                  className="group bg-[#080e15] p-5 text-left transition hover:bg-cyan-400/[0.04]"
                >
                  <span className="text-xl text-cyan-400">◇</span>

                  <h4 className="mt-4 text-sm font-semibold text-slate-200">
                    Start Investigation
                  </h4>

                  <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
                    Trace attack paths and inspect evidence.
                  </p>

                  <p className="mt-4 text-[10px] text-cyan-400">
                    Open investigation →
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/audit")}
                  className="group bg-[#080e15] p-5 text-left transition hover:bg-cyan-400/[0.04]"
                >
                  <span className="text-xl text-cyan-400">▤</span>

                  <h4 className="mt-4 text-sm font-semibold text-slate-200">
                    Run Security Audit
                  </h4>

                  <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
                    Evaluate posture and generate audit reports.
                  </p>

                  <p className="mt-4 text-[10px] text-cyan-400">
                    Open audits →
                  </p>
                </button>
              </div>
            </section>

            {/* ATTACK ACTIVITY */}
            <section className="border border-white/[0.07] bg-[#080e15]">
              <SectionHeader
                eyebrow="TELEMETRY ANALYTICS"
                title="Attack Activity"
                action={
                  <span className="border border-cyan-400/20 bg-cyan-400/[0.04] px-2 py-1 text-[8px] tracking-wider text-cyan-400">
                    LAST 24 HOURS
                  </span>
                }
              />

              <div className="p-5">
                {timeline.length === 0 ? (
                  <EmptyState
                    title="No timeline data available"
                    description="Attack telemetry will appear here when the backend returns timeline data."
                  />
                ) : (
                  <div className="flex h-64 items-end gap-1 sm:gap-2">
                    {timeline.map((point, index) => {
                      const value = Number(
                        point?.attacks ??
                          point?.count ??
                          point?.alerts ??
                          point?.total ??
                          0
                      );

                      const height =
                        value === 0
                          ? 2
                          : Math.max((value / maxTimelineValue) * 100, 5);

                      return (
                        <div
                          key={`${point?.hour || point?.time || index}-${index}`}
                          className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                          title={`${point?.hour || point?.time || "Time"}: ${value} attacks`}
                        >
                          <span className="text-[8px] text-slate-500">
                            {value}
                          </span>

                          <div
                            className="w-full max-w-[28px] border-t border-cyan-300 bg-cyan-400/70 transition hover:bg-cyan-300"
                            style={{ height: `${height}%` }}
                          />

                          <span className="max-w-full -rotate-45 origin-top whitespace-nowrap text-[7px] text-slate-600">
                            {point?.hour || point?.time || "--"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* INCIDENTS AND AI SUMMARY */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="border border-white/[0.07] bg-[#080e15]">
                <SectionHeader
                  eyebrow="OPERATIONS"
                  title="Priority Incidents"
                  action={
                    <button
                      type="button"
                      onClick={() => navigate("/incidents")}
                      className="text-[9px] text-cyan-400 hover:text-cyan-300"
                    >
                      View all →
                    </button>
                  }
                />

                {activeAlerts.length === 0 ? (
                  <EmptyState
                    title="No active incidents"
                    description="The environment currently has no unresolved incidents."
                  />
                ) : (
                  <div className="divide-y divide-white/[0.05]">
                    {activeAlerts.slice(0, 6).map((alert, index) => {
                      const severity = String(
                        alert?.severity || "medium"
                      ).toLowerCase();

                      return (
                        <button
                          type="button"
                          key={getAlertId(alert) || index}
                          onClick={() => navigate("/incidents")}
                          className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/[0.025]"
                        >
                          <div
                            className={`h-10 w-1 shrink-0 ${getSeverityBarClass(
                              severity
                            )}`}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-200">
                              {alert?.attack_type || "UNKNOWN_THREAT"}
                            </p>

                            <p className="mt-1 truncate text-[10px] text-slate-600">
                              {getAlertSource(alert)}
                              <span className="mx-2 text-slate-700">
                                →
                              </span>
                              {getAlertTarget(alert)}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 border px-2 py-1 text-[8px] uppercase ${getSeverityClass(
                              severity
                            )}`}
                          >
                            {alert?.severity || "Medium"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="border border-white/[0.07] bg-[#080e15]">
                <SectionHeader
                  eyebrow="AI INTELLIGENCE"
                  title="Security Summary"
                />

                <div className="p-5">
                  <div className="border border-cyan-400/15 bg-cyan-400/[0.025] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center border border-cyan-400/25 bg-cyan-400/[0.05] text-lg text-cyan-300">
                        ✦
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-200">
                          SAOM-AI Intelligence Layer
                        </p>

                        <p className="mt-1 text-[9px] text-slate-600">
                          Live environment assessment
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-7 text-slate-400">
                      {criticalAlerts.length > 0
                        ? `The environment currently contains ${criticalAlerts.length} critical active incident${
                            criticalAlerts.length === 1 ? "" : "s"
                          }. Immediate investigation and response prioritization is recommended.`
                        : highAlerts.length > 0
                        ? `The environment currently contains ${highAlerts.length} high-severity active incident${
                            highAlerts.length === 1 ? "" : "s"
                          }. Review affected assets and investigate attack activity.`
                        : activeAlerts.length > 0
                        ? `The environment currently contains ${activeAlerts.length} active incident${
                            activeAlerts.length === 1 ? "" : "s"
                          }. Continue monitoring and review incident intelligence.`
                        : "No active incidents are currently detected. Continue monitoring telemetry and maintaining security controls."}
                    </p>

                    <button
                      type="button"
                      onClick={() => navigate("/ai-assistant")}
                      className="mt-6 border border-cyan-400/25 px-3 py-2 text-[10px] text-cyan-300 transition hover:bg-cyan-400/[0.08]"
                    >
                      Open AI Assistant →
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* INFRASTRUCTURE SNAPSHOT */}
            <section className="border border-white/[0.07] bg-[#080e15]">
              <SectionHeader
                eyebrow="INFRASTRUCTURE"
                title="Infrastructure Snapshot"
                action={
                  <button
                    type="button"
                    onClick={() => navigate("/infrastructure")}
                    className="text-[9px] text-cyan-400 hover:text-cyan-300"
                  >
                    View infrastructure →
                  </button>
                }
              />

              {assets.length === 0 ? (
                <EmptyState
                  title="No asset data available"
                  description="Infrastructure assets will appear here when the backend returns asset data."
                />
              ) : (
                <div className="grid gap-px bg-white/[0.05] sm:grid-cols-2 xl:grid-cols-4">
                  {assets.slice(0, 8).map((asset, index) => (
                    <div
                      key={asset?._id || asset?.id || index}
                      className="bg-[#080e15] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[9px] uppercase tracking-wider text-slate-600">
                          Asset {String(index + 1).padStart(2, "0")}
                        </span>

                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      </div>

                      <p className="mt-4 truncate text-xs font-semibold text-slate-200">
                        {asset?.hostname ||
                          asset?.name ||
                          asset?.asset_name ||
                          asset?.ip_address ||
                          "Unknown Asset"}
                      </p>

                      <p className="mt-2 truncate text-[10px] text-slate-600">
                        {asset?.ip_address ||
                          asset?.ip ||
                          asset?.type ||
                          "Infrastructure endpoint"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* FOOTER STATUS */}
            <footer className="flex flex-col justify-between gap-3 border-t border-white/[0.06] pt-5 text-[9px] text-slate-600 sm:flex-row">
              <p>SAOM-AI Security Operations Platform</p>

              <p>
                Telemetry:{" "}
                <span className="text-emerald-400">Connected</span>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}