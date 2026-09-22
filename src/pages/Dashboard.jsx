 import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock3,
  Crosshair,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";

import {
  AreaChart,
  Badge,
  Button,
  Card,
  Donut,
  PageHeader,
  Panel,
  SeverityBadge,
  StatCard,
  StatusBadge,
} from "../components/ui";

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("24h");

  /*
   * Keep your existing API/service logic here if your current
   * Dashboard.jsx already fetches real backend data.
   *
   * The UI below is intentionally presentation-focused.
   */

  const stats = useMemo(
    () => [
      {
        label: "Active threats",
        value: "07",
        change: "+2 from previous period",
        tone: "red",
        icon: ShieldAlert,
      },
      {
        label: "Investigations",
        value: "18",
        change: "6 currently active",
        tone: "default",
        icon: Crosshair,
      },
      {
        label: "Systems monitored",
        value: "1,284",
        change: "99.98% telemetry coverage",
        tone: "green",
        icon: Activity,
      },
      {
        label: "Automations",
        value: "42",
        change: "38 completed today",
        tone: "blue",
        icon: Zap,
      },
    ],
    []
  );

  const activityData = [
    { value: 12 },
    { value: 18 },
    { value: 14 },
    { value: 25 },
    { value: 21 },
    { value: 34 },
    { value: 29 },
    { value: 41 },
    { value: 35 },
    { value: 48 },
    { value: 43 },
    { value: 57 },
  ];

  const incidents = [
    {
      id: "INC-2841",
      title: "Credential access attempt",
      source: "prod-api-04",
      severity: "critical",
      status: "investigating",
      time: "2m ago",
    },
    {
      id: "INC-2838",
      title: "Unusual outbound connection",
      source: "workstation-218",
      severity: "high",
      status: "active",
      time: "11m ago",
    },
    {
      id: "INC-2834",
      title: "Privilege escalation signal",
      source: "auth-service",
      severity: "high",
      status: "investigating",
      time: "24m ago",
    },
    {
      id: "INC-2829",
      title: "Suspicious DNS activity",
      source: "edge-dns-02",
      severity: "medium",
      status: "contained",
      time: "41m ago",
    },
  ];

  const investigations = [
    {
      title: "Potential lateral movement",
      description:
        "SAOM connected authentication events across three hosts.",
      progress: 76,
      severity: "high",
    },
    {
      title: "Abnormal service account activity",
      description:
        "Behaviour deviates from the account's established baseline.",
      progress: 51,
      severity: "medium",
    },
    {
      title: "Possible data exfiltration",
      description:
        "Outbound traffic pattern requires analyst validation.",
      progress: 34,
      severity: "critical",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F6F7F9]">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <PageHeader
        eyebrow="SAOM-AI / Command Center"
        title="Security operations"
        description="A live view of what SAOM is detecting, investigating, and responding to across your environment."
        actions={
          <>
            <div className="hidden items-center gap-1 border border-slate-200 bg-white p-1 sm:flex">
              {["1h", "24h", "7d"].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={[
                    "h-7 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors",
                    timeRange === range
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-900",
                  ].join(" ")}
                >
                  {range}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              icon={ArrowUpRight}
            >
              Export
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-6 lg:p-8">
        {/* ====================================================
            LIVE STATUS
        ==================================================== */}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Live telemetry
          </div>

          <span className="h-3 w-px bg-slate-300" />

          <span className="text-xs text-slate-400">
            Last updated just now
          </span>

          <Badge tone="green">
            All systems operational
          </Badge>
        </div>

        {/* ====================================================
            KEY METRICS
        ==================================================== */}

        <section className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              {...stat}
              className="border-0"
            />
          ))}
        </section>

        {/* ====================================================
            ACTIVITY + THREAT DISTRIBUTION
        ==================================================== */}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Panel
            title="Detection activity"
            description={`Security events detected during the selected ${timeRange} window.`}
            action={
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="h-2 w-2 bg-[#ED1C2E]" />
                Detections
              </div>
            }
          >
            <div className="p-5">
              <AreaChart
                data={activityData}
                height={250}
              />

              <div className="mt-4 flex justify-between text-[9px] uppercase tracking-[0.12em] text-slate-400">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>Now</span>
              </div>
            </div>
          </Panel>

          <Panel
            title="Threat posture"
            description="Current distribution of detected activity."
          >
            <div className="flex flex-col items-center px-5 py-6">
              <Donut
                value={7}
                total={32}
                size={150}
                strokeWidth={11}
                label="22%"
                sublabel="elevated"
              />

              <div className="mt-6 w-full space-y-3">
                <ThreatRow
                  label="Critical"
                  value="3"
                  percentage="9%"
                  color="#ED1C2E"
                />

                <ThreatRow
                  label="High"
                  value="11"
                  percentage="34%"
                  color="#DC2626"
                />

                <ThreatRow
                  label="Medium"
                  value="12"
                  percentage="38%"
                  color="#D97706"
                />

                <ThreatRow
                  label="Low / Info"
                  value="6"
                  percentage="19%"
                  color="#64748B"
                />
              </div>
            </div>
          </Panel>
        </section>

        {/* ====================================================
            INCIDENTS
        ==================================================== */}

        <Panel
          title="Active incidents"
          description="Threats requiring investigation or analyst attention."
          action={
            <Button
              variant="ghost"
              size="sm"
            >
              View all
            </Button>
          }
        >
          <div className="divide-y divide-slate-100">
            {incidents.map((incident) => (
              <IncidentRow
                key={incident.id}
                incident={incident}
              />
            ))}
          </div>
        </Panel>

        {/* ====================================================
            INVESTIGATION + AI STATUS
        ==================================================== */}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Panel
            title="Live investigations"
            description="Cases where SAOM is currently correlating evidence."
            action={
              <Button
                variant="ghost"
                size="sm"
              >
                Open investigation
              </Button>
            }
          >
            <div className="divide-y divide-slate-100">
              {investigations.map((item) => (
                <InvestigationRow
                  key={item.title}
                  {...item}
                />
              ))}
            </div>
          </Panel>

          <Panel
            title="SAOM AI"
            description="Autonomous analyst status."
          >
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#ED1C2E]/20 bg-red-50 text-[#ED1C2E]">
                  <Bot size={18} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Autonomous analyst active
                    </h3>

                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    SAOM is continuously correlating telemetry,
                    investigating suspicious behaviour, and preparing
                    response actions.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4 border-t border-slate-100 pt-4">
                <AIStatus
                  icon={Activity}
                  label="Telemetry analysis"
                  status="Running"
                />

                <AIStatus
                  icon={Crosshair}
                  label="Threat investigation"
                  status="6 active"
                />

                <AIStatus
                  icon={ShieldCheck}
                  label="Response automation"
                  status="Ready"
                />
              </div>

              <div className="mt-5 border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Clock3
                    size={14}
                    className="text-slate-400"
                  />

                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Next analyst action
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-700">
                  Validate the credential access chain associated
                  with <span className="font-mono">INC-2841</span>.
                </p>
              </div>
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

// ============================================================
// SUPPORTING COMPONENTS
// ============================================================

function ThreatRow({
  label,
  value,
  percentage,
  color,
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="h-2 w-2 shrink-0"
        style={{ backgroundColor: color }}
      />

      <span className="flex-1 text-xs text-slate-600">
        {label}
      </span>

      <span className="text-xs font-semibold text-slate-900">
        {value}
      </span>

      <span className="w-8 text-right text-[10px] text-slate-400">
        {percentage}
      </span>
    </div>
  );
}

function IncidentRow({
  incident,
}) {
  return (
    <div className="group flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-red-100 bg-red-50 text-[#ED1C2E]">
          <AlertTriangle size={14} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] text-slate-400">
              {incident.id}
            </span>

            <SeverityBadge
              severity={incident.severity}
            />
          </div>

          <h3 className="mt-1 text-xs font-semibold text-slate-900">
            {incident.title}
          </h3>

          <p className="mt-1 text-[11px] text-slate-500">
            {incident.source}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:justify-end">
        <StatusBadge status={incident.status} />

        <span className="w-12 text-right text-[10px] text-slate-400">
          {incident.time}
        </span>

        <ArrowUpRight
          size={14}
          className="text-slate-300 transition-colors group-hover:text-slate-700"
        />
      </div>
    </div>
  );
}

function InvestigationRow({
  title,
  description,
  progress,
  severity,
}) {
  const tone = severityToneForProgress(severity);

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: tone }}
            />

            <h3 className="text-xs font-semibold text-slate-900">
              {title}
            </h3>
          </div>

          <p className="mt-1 max-w-xl text-[11px] leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <span className="text-xs font-semibold text-slate-700">
          {progress}%
        </span>
      </div>

      <div className="mt-3 h-1 bg-slate-100">
        <div
          className="h-full"
          style={{
            width: `${progress}%`,
            backgroundColor: tone,
          }}
        />
      </div>
    </div>
  );
}

function AIStatus({
  icon: Icon,
  label,
  status,
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Icon
          size={14}
          className="text-slate-400"
        />

        <span className="text-xs text-slate-600">
          {label}
        </span>
      </div>

      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        {status}
      </span>
    </div>
  );
}

function severityToneForProgress(severity) {
  const tones = {
    critical: "#ED1C2E",
    high: "#DC2626",
    medium: "#D97706",
    low: "#2563EB",
  };

  return tones[String(severity).toLowerCase()] || "#64748B";
}