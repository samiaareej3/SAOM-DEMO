import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getDashboardStats,
  getAttackTimeline,
  getAlerts,
  getAssets,
  getSOARHealth,
  getSOARActions,
} from "../services/dashboardApi";

/* =========================================================
   NAVIGATION
========================================================= */

const NAVIGATION_ITEMS = [
  {
    group: "COMMAND CENTER",
    items: [{ label: "Overview", icon: "◈", route: "/dashboard" }],
  },
  {
    group: "OPERATIONS",
    items: [
      { label: "Incidents", icon: "◉", route: "/incidents" },
      { label: "Infrastructure", icon: "▣", route: "/infrastructure" },
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
      { label: "Investigation", icon: "◇", route: "/investigation" },
      { label: "Attack Graph", icon: "⌘", route: "/attack-graph" },
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
    items: [{ label: "Security Audits", icon: "▤", route: "/audit" }],
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

/* =========================================================
   HELPERS
========================================================= */

function unwrapData(response) {
  if (!response) return {};
  return response.data || response;
}

function normalizeArray(response, key) {
  const data = unwrapData(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data[key])) return data[key];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.results)) return data.results;

  return [];
}

function getAlertId(alert) {
  return (
    alert?._id ||
    alert?.id ||
    alert?.alert_id ||
    alert?.alertId ||
    crypto.randomUUID?.()
  );
}

function getSeverity(alert) {
  return String(
    alert?.severity ||
      alert?.priority ||
      alert?.risk_level ||
      alert?.riskLevel ||
      "medium"
  ).toLowerCase();
}

function getAlertSource(alert) {
  return (
    alert?.source_ip ||
    alert?.sourceIp ||
    alert?.source_hostname ||
    alert?.sourceHostname ||
    alert?.source ||
    "Unknown source"
  );
}

function getAlertTarget(alert) {
  return (
    alert?.destination_ip ||
    alert?.destinationIp ||
    alert?.destination_hostname ||
    alert?.destinationHostname ||
    alert?.hostname ||
    alert?.asset?.hostname ||
    alert?.target ||
    "Unknown target"
  );
}

function getAlertTitle(alert) {
  return (
    alert?.attack_type ||
    alert?.attackType ||
    alert?.name ||
    alert?.title ||
    alert?.rule_name ||
    "Unknown threat"
  );
}

function getAssetName(asset) {
  return (
    asset?.hostname ||
    asset?.name ||
    asset?.asset_name ||
    asset?.assetName ||
    asset?.ip_address ||
    asset?.ip ||
    "Unknown asset"
  );
}

function getAssetAddress(asset) {
  return (
    asset?.ip_address ||
    asset?.ip ||
    asset?.address ||
    asset?.type ||
    "Infrastructure endpoint"
  );
}

function getTimelineValue(point) {
  return Number(
    point?.attacks ??
      point?.attack_count ??
      point?.attackCount ??
      point?.count ??
      point?.alerts ??
      point?.total ??
      point?.value ??
      0
  );
}

function getTimelineLabel(point, index) {
  return (
    point?.hour ||
    point?.time ||
    point?.timestamp ||
    point?.label ||
    `T-${index + 1}`
  );
}

function getActionStatus(action) {
  return String(
    action?.status ||
      action?.state ||
      action?.approval_status ||
      action?.approvalStatus ||
      "UNKNOWN"
  ).toUpperCase();
}

function isPendingAction(action) {
  return [
    "PENDING",
    "PENDING_APPROVAL",
    "WAITING_APPROVAL",
    "AWAITING_APPROVAL",
    "REQUIRES_APPROVAL",
  ].includes(getActionStatus(action));
}

function isCompletedAction(action) {
  return ["COMPLETED", "EXECUTED", "SUCCESS", "SUCCEEDED"].includes(
    getActionStatus(action)
  );
}

function severityClasses(severity) {
  const value = String(severity).toLowerCase();

  if (value === "critical") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  if (value === "high") {
    return "border-orange-400/30 bg-orange-400/10 text-orange-300";
  }

  if (value === "medium") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
}

function severityBar(severity) {
  const value = String(severity).toLowerCase();

  if (value === "critical") return "bg-red-400";
  if (value === "high") return "bg-orange-400";
  if (value === "medium") return "bg-yellow-400";

  return "bg-emerald-400";
}

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

function StatCard({
  label,
  value,
  description,
  icon,
  color = "bg-cyan-400",
}) {
  return (
    <div className="relative overflow-hidden border border-white/[0.08] bg-[#080e15] p-5">
      <div className={`absolute left-0 top-0 h-[2px] w-full ${color}`} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
            {label}
          </p>

          <p className="mt-4 break-words text-3xl font-semibold tracking-tight text-slate-100">
            {value}
          </p>

          {description && (
            <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 bg-white/[0.03] text-sm text-slate-400">
          {icon}
        </div>
      </div>

      <div className="mt-5 h-px bg-white/[0.05]" />
    </div>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
      <div>
        <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-slate-600">
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
    <div className="flex min-h-[170px] flex-col items-center justify-center px-5 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-500">
        ◌
      </div>

      <p className="mt-4 text-xs text-slate-400">{title}</p>

      <p className="mt-2 max-w-sm text-[10px] leading-relaxed text-slate-600">
        {description}
      </p>
    </div>
  );
}

function LoadingState() {
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

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [soarHealth, setSoarHealth] = useState({});
  const [soarActions, setSoarActions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const results = await Promise.allSettled([
        getDashboardStats(),
        getAlerts(),
        getAssets(),
        getAttackTimeline(),
        getSOARHealth(),
        getSOARActions(),
      ]);

      const [
        statsResult,
        alertsResult,
        assetsResult,
        timelineResult,
        healthResult,
        actionsResult,
      ] = results;

      const failedServices = [];

      if (statsResult.status === "fulfilled") {
        setStats(unwrapData(statsResult.value));
      } else {
        failedServices.push("statistics");
      }

      if (alertsResult.status === "fulfilled") {
        setAlerts(normalizeArray(alertsResult.value, "alerts"));
      } else {
        failedServices.push("alerts");
      }

      if (assetsResult.status === "fulfilled") {
        setAssets(normalizeArray(assetsResult.value, "assets"));
      } else {
        failedServices.push("assets");
      }

      if (timelineResult.status === "fulfilled") {
        setTimeline(normalizeArray(timelineResult.value, "timeline"));
      } else {
        failedServices.push("timeline");
      }

      if (healthResult.status === "fulfilled") {
        setSoarHealth(unwrapData(healthResult.value));
      } else {
        failedServices.push("SOAR health");
      }

      if (actionsResult.status === "fulfilled") {
        setSoarActions(normalizeArray(actionsResult.value, "actions"));
      } else {
        failedServices.push("SOAR actions");
      }

      if (failedServices.length > 0) {
        setError(
          `Unavailable services: ${failedServices.join(
            ", "
          )}. Other telemetry is still displayed.`
        );
      }

      setLastRefresh(new Date());
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

  /* =========================================================
     BACKEND VALUES
  ========================================================= */

  const securityScore = Number(stats?.securityScore ?? 0);
  const riskScore = Number(stats?.riskScore ?? 0);

  const riskLevel = String(stats?.riskLevel ?? "Unknown");
  const dataSource = String(stats?.source ?? "Unknown");

  const totalAlerts = Number(stats?.totalAlerts ?? 0);
  const activeIncidents = Number(stats?.activeAlerts ?? 0);
  const criticalAlerts = Number(stats?.criticalAlerts ?? 0);
  const highAlerts = Number(stats?.highAlerts ?? 0);
  const mediumAlerts = Number(stats?.mediumAlerts ?? 0);
  const lowAlerts = Number(stats?.lowAlerts ?? 0);
  const logsProcessed = Number(stats?.logsProcessed ?? 0);

  const monitoredAssets = assets.length;

  const activeAlertRecords = useMemo(() => {
    return alerts.filter((alert) => {
      const status = String(
        alert?.status || alert?.state || ""
      ).toUpperCase();

      return !["RESOLVED", "CLOSED", "MITIGATED", "COMPLETED"].includes(
        status
      );
    });
  }, [alerts]);

  const pendingActions = useMemo(() => {
    return soarActions.filter(isPendingAction);
  }, [soarActions]);

  const completedActions = useMemo(() => {
    return soarActions.filter(isCompletedAction);
  }, [soarActions]);

  const maxTimelineValue = useMemo(() => {
    return Math.max(...timeline.map(getTimelineValue), 1);
  }, [timeline]);

  const soarIsOnline =
    soarHealth?.success === true ||
    soarHealth?.status === "ok" ||
    soarHealth?.status === "healthy" ||
    soarHealth?.status === "online";

  const soarMode =
    soarHealth?.mode ||
    (soarHealth?.simulation === true ? "SIMULATION" : "UNKNOWN");

  const intelligenceSummary =
    criticalAlerts > 0
      ? `The environment reports ${criticalAlerts} critical alerts. Immediate investigation and response prioritization are recommended.`
      : highAlerts > 0
      ? `The environment reports ${highAlerts} high-severity alerts. Review affected assets and investigate attack activity.`
      : activeIncidents > 0
      ? `The environment currently reports ${activeIncidents} active incidents. Continue monitoring and reviewing incident intelligence.`
      : "No active incidents are currently reported by the backend.";

  if (loading) {
    return <LoadingState />;
  }

  return (
    <main className="min-h-screen bg-[#05080d] text-slate-200">
      <div className="min-h-screen">
        {/* =================================================
            MAIN CONTENT
        ================================================== */}

        <div className="min-w-0">
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
                Unified security visibility, threat detection and response
                intelligence.
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
            {/* ERROR */}

            {error && (
              <div className="flex flex-wrap items-center gap-3 border border-yellow-400/20 bg-yellow-400/[0.05] px-4 py-3 text-xs">
                <span className="font-semibold text-yellow-300">
                  TELEMETRY NOTICE
                </span>

                <span className="text-yellow-200/70">{error}</span>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="ml-auto text-yellow-300 hover:text-yellow-100"
                >
                  ×
                </button>
              </div>
            )}

            {/* =================================================
                EXECUTIVE OVERVIEW
            ================================================== */}

            <section className="space-y-5">
              <div className="flex flex-col justify-between gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[9px] font-bold tracking-[0.22em] text-cyan-400/70">
                    EXECUTIVE OVERVIEW
                  </p>

                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-100">
                    Security Posture
                  </h3>

                  <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500">
                    Real-time visibility into security posture, threat
                    detection, monitored infrastructure and response health.
                  </p>
                </div>

                <div className="flex items-center gap-2 border border-emerald-400/20 bg-emerald-400/[0.04] px-3 py-2 text-[9px] font-bold tracking-widest text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  SYSTEM MONITORING ACTIVE
                </div>
              </div>

              {/* PRIMARY CARDS */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Security Score"
                  value={`${securityScore}%`}
                  description="Backend security posture"
                  icon="◈"
                  color="bg-cyan-400"
                />

                <StatCard
                  label="Risk Score"
                  value={`${riskScore}/100`}
                  description={`Risk level: ${riskLevel}`}
                  icon="!"
                  color="bg-orange-400"
                />

                <StatCard
                  label="Active Incidents"
                  value={activeIncidents}
                  description="Reported by backend statistics"
                  icon="◉"
                  color="bg-blue-400"
                />

                <StatCard
                  label="Monitored Assets"
                  value={monitoredAssets}
                  description="Assets returned by infrastructure API"
                  icon="▣"
                  color="bg-emerald-400"
                />
              </div>

              {/* BACKEND TELEMETRY */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total Alerts"
                  value={totalAlerts}
                  description="All backend alerts"
                  icon="◉"
                  color="bg-cyan-400"
                />

                <StatCard
                  label="Logs Processed"
                  value={logsProcessed}
                  description="Logs processed by telemetry"
                  icon="▤"
                  color="bg-violet-400"
                />

                <StatCard
                  label="Risk Level"
                  value={riskLevel}
                  description="Backend risk classification"
                  icon="▲"
                  color="bg-red-400"
                />

                <StatCard
                  label="Data Source"
                  value={dataSource.toUpperCase()}
                  description={
                    stats?.riskScoreUpdatedAt
                      ? `Updated ${new Date(
                          stats.riskScoreUpdatedAt
                        ).toLocaleString()}`
                      : "Backend source information"
                  }
                  icon="⌁"
                  color="bg-slate-400"
                />
              </div>
            </section>

            {/* =================================================
                ALERT SEVERITY
            ================================================== */}

            <section className="border border-white/[0.07] bg-[#080e15]">
              <SectionHeader
                eyebrow="THREAT DISTRIBUTION"
                title="Alert Severity Breakdown"
                action={
                  <span className="border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[9px] text-slate-500">
                    BACKEND TELEMETRY
                  </span>
                }
              />

              <div className="grid grid-cols-2 gap-px bg-white/[0.05] md:grid-cols-3 xl:grid-cols-6">
                <StatCard
                  label="Total Alerts"
                  value={totalAlerts}
                  icon="◉"
                  color="bg-cyan-400"
                />

                <StatCard
                  label="Critical"
                  value={criticalAlerts}
                  icon="!"
                  color="bg-red-400"
                />

                <StatCard
                  label="High"
                  value={highAlerts}
                  icon="▲"
                  color="bg-orange-400"
                />

                <StatCard
                  label="Medium"
                  value={mediumAlerts}
                  icon="◆"
                  color="bg-yellow-400"
                />

                <StatCard
                  label="Low"
                  value={lowAlerts}
                  icon="●"
                  color="bg-emerald-400"
                />

                <StatCard
                  label="Active"
                  value={activeIncidents}
                  icon="◈"
                  color="bg-blue-400"
                />
              </div>
            </section>

            {/* =================================================
                QUICK ACTIONS
            ================================================== */}

            <section className="border border-white/[0.07] bg-[#080e15]">
              <SectionHeader eyebrow="OPERATIONS" title="Quick Actions" />

              <div className="grid grid-cols-1 gap-px bg-white/[0.05] sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    icon: "◉",
                    title: "Review Incidents",
                    description:
                      "Investigate active threats and incident activity.",
                    route: "/incidents",
                    action: "Open incidents",
                  },
                  {
                    icon: "▣",
                    title: "Inspect Infrastructure",
                    description:
                      "Review assets, endpoints and system risk.",
                    route: "/infrastructure",
                    action: "Open infrastructure",
                  },
                  {
                    icon: "◇",
                    title: "Start Investigation",
                    description:
                      "Trace attack paths and inspect evidence.",
                    route: "/investigation",
                    action: "Open investigation",
                  },
                  {
                    icon: "▤",
                    title: "Run Security Audit",
                    description:
                      "Evaluate posture and generate audit reports.",
                    route: "/audit",
                    action: "Open audits",
                  },
                ].map((item) => (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => navigate(item.route)}
                    className="group bg-[#080e15] p-5 text-left transition hover:bg-cyan-400/[0.04]"
                  >
                    <span className="text-xl text-cyan-400">
                      {item.icon}
                    </span>

                    <h4 className="mt-4 text-sm font-semibold text-slate-200">
                      {item.title}
                    </h4>

                    <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
                      {item.description}
                    </p>

                    <p className="mt-4 text-[10px] text-cyan-400">
                      {item.action} →
                    </p>
                  </button>
                ))}
              </div>
            </section>

            {/* =================================================
                SOAR
            ================================================== */}

            <section className="border border-white/[0.07] bg-[#080e15]">
              <SectionHeader
                eyebrow="RESPONSE INTELLIGENCE"
                title="SOAR Operations"
                action={
                  <button
                    type="button"
                    onClick={() => navigate("/automation")}
                    className="text-[9px] text-cyan-400 hover:text-cyan-300"
                  >
                    Open automation →
                  </button>
                }
              />

              <div className="grid grid-cols-1 gap-px bg-white/[0.05] md:grid-cols-3">
                <div className="bg-[#080e15] p-5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
                    ENGINE STATUS
                  </p>

                  <div className="mt-5 flex items-center gap-3">
                    <span
                      className={`h-3 w-3 rounded-full ${
                        soarIsOnline ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    />

                    <p className="text-sm font-semibold text-slate-200">
                      {soarIsOnline ? "SOAR Engine Online" : "SOAR Unavailable"}
                    </p>
                  </div>

                  <p className="mt-3 text-[10px] leading-relaxed text-slate-600">
                    Mode:{" "}
                    <span className="text-slate-400">{String(soarMode)}</span>
                  </p>

                  {soarHealth?.simulation === true && (
                    <p className="mt-2 text-[10px] text-yellow-400">
                      Simulation mode enabled
                    </p>
                  )}
                </div>

                <div className="bg-[#080e15] p-5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
                    AWAITING APPROVAL
                  </p>

                  <p className="mt-5 text-3xl font-semibold text-slate-100">
                    {pendingActions.length}
                  </p>

                  <p className="mt-2 text-[10px] text-slate-600">
                    Actions requiring analyst authorization.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/approvals")}
                    className="mt-5 text-[10px] text-cyan-400 hover:text-cyan-300"
                  >
                    Review approval queue →
                  </button>
                </div>

                <div className="bg-[#080e15] p-5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
                    COMPLETED ACTIONS
                  </p>

                  <p className="mt-5 text-3xl font-semibold text-slate-100">
                    {completedActions.length}
                  </p>

                  <p className="mt-2 text-[10px] text-slate-600">
                    Completed actions returned by the SOAR API.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/automation")}
                    className="mt-5 text-[10px] text-cyan-400 hover:text-cyan-300"
                  >
                    View response activity →
                  </button>
                </div>
              </div>
            </section>

            {/* =================================================
                ATTACK TIMELINE
            ================================================== */}

            <section className="border border-white/[0.07] bg-[#080e15]">
              <SectionHeader
                eyebrow="TELEMETRY ANALYTICS"
                title="Attack Activity"
                action={
                  <span className="border border-cyan-400/20 bg-cyan-400/[0.04] px-2 py-1 text-[8px] tracking-wider text-cyan-400">
                    LIVE TIMELINE
                  </span>
                }
              />

              <div className="p-5">
                {timeline.length === 0 ? (
                  <EmptyState
                    title="No timeline data available"
                    description="Attack activity will appear when the backend returns timeline records."
                  />
                ) : (
                  <div className="flex h-64 items-end gap-1 sm:gap-2">
                    {timeline.map((point, index) => {
                      const value = getTimelineValue(point);
                      const height =
                        value <= 0
                          ? 2
                          : Math.max((value / maxTimelineValue) * 100, 5);

                      return (
                        <div
                          key={`${getTimelineLabel(point, index)}-${index}`}
                          className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                          title={`${getTimelineLabel(
                            point,
                            index
                          )}: ${value} attacks`}
                        >
                          <span className="text-[8px] text-slate-500">
                            {value}
                          </span>

                          <div
                            className="w-full max-w-[30px] border-t border-cyan-300 bg-cyan-400/70 transition hover:bg-cyan-300"
                            style={{ height: `${height}%` }}
                          />

                          <span className="max-w-full -rotate-45 origin-top whitespace-nowrap text-[7px] text-slate-600">
                            {getTimelineLabel(point, index)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* =================================================
                INCIDENTS + AI SUMMARY
            ================================================== */}

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

                {activeAlertRecords.length === 0 ? (
                  <EmptyState
                    title="No alert records available"
                    description="The backend did not return unresolved alert records."
                  />
                ) : (
                  <div className="divide-y divide-white/[0.05]">
                    {activeAlertRecords.slice(0, 6).map((alert, index) => {
                      const severity = getSeverity(alert);

                      return (
                        <button
                          key={getAlertId(alert) || index}
                          type="button"
                          onClick={() => navigate("/incidents")}
                          className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/[0.025]"
                        >
                          <div
                            className={`h-10 w-1 shrink-0 ${severityBar(
                              severity
                            )}`}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-200">
                              {getAlertTitle(alert)}
                            </p>

                            <p className="mt-1 truncate text-[10px] text-slate-600">
                              {getAlertSource(alert)}
                              <span className="mx-2 text-slate-700">→</span>
                              {getAlertTarget(alert)}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 border px-2 py-1 text-[8px] uppercase ${severityClasses(
                              severity
                            )}`}
                          >
                            {severity}
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
                          Backend-derived environment assessment
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-7 text-slate-400">
                      {intelligenceSummary}
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

            {/* =================================================
                INFRASTRUCTURE
            ================================================== */}

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
                  description="Infrastructure assets will appear when the backend returns asset records."
                />
              ) : (
                <div className="grid gap-px bg-white/[0.05] sm:grid-cols-2 xl:grid-cols-4">
                  {assets.slice(0, 8).map((asset, index) => {
                    const status = String(
                      asset?.status ||
                        asset?.state ||
                        asset?.health ||
                        "unknown"
                    ).toLowerCase();

                    const isHealthy = [
                      "healthy",
                      "online",
                      "active",
                      "up",
                      "running",
                    ].includes(status);

                    return (
                      <div
                        key={asset?._id || asset?.id || index}
                        className="bg-[#080e15] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[9px] uppercase tracking-wider text-slate-600">
                            Asset {String(index + 1).padStart(2, "0")}
                          </span>

                          <span
                            className={`h-2 w-2 rounded-full ${
                              isHealthy ? "bg-emerald-400" : "bg-yellow-400"
                            }`}
                          />
                        </div>

                        <p className="mt-4 truncate text-xs font-semibold text-slate-200">
                          {getAssetName(asset)}
                        </p>

                        <p className="mt-2 truncate text-[10px] text-slate-600">
                          {getAssetAddress(asset)}
                        </p>

                        <p className="mt-2 text-[9px] uppercase tracking-wider text-slate-500">
                          Status: {status}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* =================================================
                FOOTER
            ================================================== */}

            <footer className="flex flex-col justify-between gap-3 border-t border-white/[0.06] pt-5 text-[9px] text-slate-600 sm:flex-row">
              <p>SAOM-AI Security Operations Platform</p>

              <p>
                Source:{" "}
                <span className="text-cyan-400">
                  {dataSource.toUpperCase()}
                </span>
                <span className="mx-2 text-slate-700">|</span>
                Telemetry:{" "}
                <span className={error ? "text-yellow-400" : "text-emerald-400"}>
                  {error ? "Partial" : "Connected"}
                </span>
                {lastRefresh && (
                  <>
                    <span className="mx-2 text-slate-700">|</span>
                    Updated: {lastRefresh.toLocaleTimeString()}
                  </>
                )}
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}