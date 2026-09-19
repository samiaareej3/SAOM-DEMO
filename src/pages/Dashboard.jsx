import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowUpRight,
  Boxes,
  Database,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Workflow,
} from "lucide-react";

import {
  getDashboardStats,
  getAttackTimeline,
  getAlerts,
  getAssets,
  getSOARHealth,
  getSOARActions,
} from "../services/dashboardApi";

import {
  AppShell,
  AreaChart,
  Badge,
  Button,
  Card,
  EmptyState,
  LiveDot,
  LoadingPage,
  Notice,
  PageHeader,
  Panel,
  ScoreRing,
  SeverityBadge,
  SeverityBar,
  StatCard,
  severityTone,
} from "../components/ui";

/* =========================================================
   HELPERS  (unchanged — these read the backend payloads)
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

/* Title-cases the lowercase severity the API returns so it matches the
   shared severity vocabulary used across every page. */
function severityLabel(value) {
  const key = String(value || "").toLowerCase();

  if (key === "critical") return "Critical";
  if (key === "high") return "High";
  if (key === "medium") return "Medium";
  if (key === "low") return "Low";

  return "Unknown";
}

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

  /* =========================================================
     CHART SERIES  (shaped from the same backend payloads)
  ========================================================= */

  const timelineSeries = useMemo(
    () =>
      timeline.map((point, index) => ({
        label: String(getTimelineLabel(point, index)),
        value: getTimelineValue(point),
      })),
    [timeline]
  );

  const severityCounts = useMemo(
    () => ({
      Critical: criticalAlerts,
      High: highAlerts,
      Medium: mediumAlerts,
      Low: lowAlerts,
    }),
    [criticalAlerts, highAlerts, mediumAlerts, lowAlerts]
  );

  if (loading) {
    return (
      <AppShell connected={false}>
        <LoadingPage label="Connecting to the SAOM-AI backend" />
      </AppShell>
    );
  }

  return (
    <AppShell connected={!error}>
      <PageHeader
        breadcrumb="Command centre"
        title="Security operations"
        description="Live posture across monitored assets, detections and automated response."
        status={
          <div className="flex flex-wrap items-center gap-3">
            <LiveDot
              online={!error}
              label={
                lastRefresh
                  ? `Updated ${lastRefresh.toLocaleTimeString()}`
                  : "Awaiting first sync"
              }
            />

            <Badge tone="slate">Source: {dataSource}</Badge>
          </div>
        }
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>
        }
      />

      <div className="mx-auto max-w-[1600px] space-y-4 px-5 py-6 lg:px-8">
        {error && <Notice tone="warning">{error}</Notice>}

        {/* ============================================ POSTURE + HEADLINE */}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <ScoreRing
                value={securityScore}
                max={100}
                size={132}
                label="Security score"
                caption={`Risk score ${riskScore} · ${riskLevel} risk level`}
              />

              <div className="min-w-[180px]">
                <p className="text-sm font-medium text-slate-500">
                  Open detections
                </p>

                <p className="mt-2 text-[44px] font-semibold leading-none tabular-nums tracking-tight text-slate-900">
                  {totalAlerts}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {activeIncidents} still active · {logsProcessed.toLocaleString()} logs
                  processed
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="mb-3 text-sm font-medium text-slate-500">
                Severity mix
              </p>

              <SeverityBar counts={severityCounts} />
            </div>
          </Card>

          <Card className="flex flex-col p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                <Sparkles size={15} />
              </span>

              <h2 className="text-sm font-semibold text-slate-900">
                Analyst briefing
              </h2>
            </div>

            <p className="mt-4 flex-1 text-[15px] leading-7 text-slate-700">
              {intelligenceSummary}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="primary"
                icon={ShieldAlert}
                onClick={() => navigate("/incidents")}
              >
                Review incidents
              </Button>

              <Button
                variant="secondary"
                icon={Sparkles}
                onClick={() => navigate("/ai-assistant")}
              >
                Ask the assistant
              </Button>
            </div>
          </Card>
        </div>

        {/* ========================================================== KPIs */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Critical alerts"
            value={criticalAlerts}
            tone={criticalAlerts > 0 ? "critical" : "good"}
            emphasis
            hint={
              criticalAlerts > 0
                ? "Needs immediate triage"
                : "Nothing at critical severity"
            }
            icon={ShieldAlert}
            onClick={() => navigate("/incidents")}
          />

          <StatCard
            label="Active incidents"
            value={activeIncidents}
            tone={activeIncidents > 0 ? "high" : "good"}
            hint={`${activeAlertRecords.length} unresolved in the alert feed`}
            onClick={() => navigate("/incidents")}
          />

          <StatCard
            label="Assets monitored"
            value={monitoredAssets}
            tone="brand"
            hint="Reporting to the collector"
            icon={Boxes}
            onClick={() => navigate("/infrastructure")}
          />

          <StatCard
            label="Awaiting approval"
            value={pendingActions.length}
            tone={pendingActions.length > 0 ? "medium" : "good"}
            hint={`${completedActions.length} response actions completed`}
            icon={Workflow}
            onClick={() => navigate("/approvals")}
          />
        </div>

        {/* ================================================ ACTIVITY + SOAR */}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Panel
            title="Attack activity"
            hint={
              timelineSeries.length > 0
                ? `Peak of ${maxTimelineValue} events in a single interval`
                : undefined
            }
          >
            {timelineSeries.length === 0 ? (
              <EmptyState
                title="No timeline data returned"
                description="The attack timeline endpoint responded without any intervals. Activity appears here as soon as events are recorded."
              />
            ) : (
              <AreaChart data={timelineSeries} valueLabel="events" />
            )}
          </Panel>

          <Panel
            title="Response automation"
            action={
              <Badge tone={soarIsOnline ? "emerald" : "slate"}>
                {soarIsOnline ? "Online" : "Unavailable"}
              </Badge>
            }
          >
            <dl className="space-y-4">
              <div className="flex items-baseline justify-between">
                <dt className="text-sm text-slate-500">Mode</dt>

                <dd className="text-sm font-medium text-slate-900">
                  {String(soarMode).replaceAll("_", " ")}
                </dd>
              </div>

              <div className="flex items-baseline justify-between">
                <dt className="text-sm text-slate-500">Pending approval</dt>

                <dd className="text-2xl font-semibold tabular-nums text-amber-600">
                  {pendingActions.length}
                </dd>
              </div>

              <div className="flex items-baseline justify-between">
                <dt className="text-sm text-slate-500">Completed</dt>

                <dd className="text-2xl font-semibold tabular-nums text-emerald-600">
                  {completedActions.length}
                </dd>
              </div>

              <div className="flex items-baseline justify-between">
                <dt className="text-sm text-slate-500">Total actions</dt>

                <dd className="text-sm font-medium tabular-nums text-slate-900">
                  {soarActions.length}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Button size="sm" onClick={() => navigate("/automation")}>
                Open automation
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("/approvals")}
              >
                Approval queue
              </Button>
            </div>
          </Panel>
        </div>

        {/* ================================================ ALERTS + ASSETS */}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Panel
            title="Recent detections"
            hint={`${activeAlertRecords.length} unresolved`}
            action={
              <Button
                size="sm"
                variant="ghost"
                icon={ArrowUpRight}
                onClick={() => navigate("/incidents")}
              >
                All incidents
              </Button>
            }
            className="overflow-hidden"
          >
            {activeAlertRecords.length === 0 ? (
              <EmptyState
                title="No unresolved detections"
                description="Every alert returned by the backend is closed or mitigated."
              />
            ) : (
              <ul className="-mx-5 -mb-5 divide-y divide-slate-100">
                {activeAlertRecords.slice(0, 6).map((alert) => {
                  const label = severityLabel(getSeverity(alert));
                  const tone = severityTone(label);

                  return (
                    <li key={getAlertId(alert)}>
                      <button
                        type="button"
                        onClick={() => navigate("/incidents")}
                        className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors duration-150 hover:bg-slate-50"
                      >
                        <span
                          className={`h-8 w-[3px] shrink-0 rounded-full ${tone.spine}`}
                        />

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-900">
                            {getAlertTitle(alert)}
                          </span>

                          <span className="mt-0.5 block truncate font-mono text-xs text-slate-500">
                            {getAlertSource(alert)} → {getAlertTarget(alert)}
                          </span>
                        </span>

                        <SeverityBadge severity={label} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel
            title="Monitored assets"
            hint={`${monitoredAssets} reporting`}
            action={
              <Button
                size="sm"
                variant="ghost"
                icon={Boxes}
                onClick={() => navigate("/infrastructure")}
              >
                View all
              </Button>
            }
          >
            {assets.length === 0 ? (
              <EmptyState
                title="No assets returned"
                description="The asset endpoint responded with an empty inventory."
                icon={Database}
              />
            ) : (
              <ul className="space-y-3">
                {assets.slice(0, 6).map((asset, index) => (
                  <li
                    key={asset?._id || asset?.id || index}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {getAssetName(asset)}
                      </span>

                      <span className="block truncate font-mono text-xs text-slate-500">
                        {getAssetAddress(asset)}
                      </span>
                    </span>

                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}