
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  Lock,
  Network,
  Search,
  Send,
  Server,
  ShieldAlert,
  Terminal,
  User,
  XCircle,
} from "lucide-react";

import {
  backtrackAttack,
  getAlerts,
  investigateAttack,
} from "../services/dashboardApi";

const SEVERITIES = ["Critical", "High", "Medium", "Low"];

const severityStyles = {
  Critical: "bg-red-500/15 text-red-400 border-red-500/30",
  High: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Low: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

const statusStyles = {
  Active: "bg-red-500/15 text-red-300 border-red-500/20",
  Investigating: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
  Resolved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
};

function getValue(object, keys, fallback = "") {
  for (const key of keys) {
    const value = object?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
}

function normalizeSeverity(value) {
  const severity = String(value || "Low").toLowerCase();

  if (severity.includes("critical")) return "Critical";
  if (severity.includes("high")) return "High";
  if (severity.includes("medium")) return "Medium";

  return "Low";
}

function normalizeStatus(value) {
  const status = String(value || "Active").toLowerCase();

  if (
    status.includes("resolved") ||
    status.includes("closed") ||
    status.includes("complete")
  ) {
    return "Resolved";
  }

  if (
    status.includes("investigat") ||
    status.includes("progress") ||
    status.includes("review")
  ) {
    return "Investigating";
  }

  return "Active";
}

function formatDate(value) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function extractAlerts(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.alerts)) return response.alerts;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.alerts)) return response.data.alerts;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.items)) return response.items;

  return [];
}

function normalizeIncident(alert, index) {
  const id = getValue(
    alert,
    ["id", "_id", "alert_id", "alertId", "incident_id", "incidentId"],
    `ALERT-${index + 1}`
  );

  const createdAt = getValue(alert, [
    "createdAt",
    "created_at",
    "timestamp",
    "detectedAt",
    "detected_at",
    "time",
  ]);

  return {
    ...alert,
    id: String(id),
    title: getValue(
      alert,
      ["title", "name", "alert_name", "alertName", "message"],
      "Security Alert"
    ),
    severity: normalizeSeverity(
      getValue(alert, ["severity", "priority", "risk_level", "riskLevel"])
    ),
    status: normalizeStatus(
      getValue(alert, ["status", "state", "incident_status", "incidentStatus"])
    ),
    type: getValue(
      alert,
      ["type", "alert_type", "alertType", "category", "event_type"],
      "SECURITY_EVENT"
    ),
    asset: getValue(
      alert,
      [
        "asset",
        "asset_id",
        "assetId",
        "asset_name",
        "assetName",
        "hostname",
        "host",
        "target",
        "target_asset",
        "targetAsset",
      ],
      "Unknown asset"
    ),
    sourceIp: getValue(
      alert,
      [
        "source_ip",
        "sourceIp",
        "src_ip",
        "srcIp",
        "ip",
        "source",
        "source_address",
      ],
      "Unknown source"
    ),
    user: getValue(
      alert,
      ["user", "username", "user_name", "userName", "account"],
      "Unknown user"
    ),
    description: getValue(
      alert,
      ["description", "message", "details", "summary"],
      "No additional description is available."
    ),
    createdAt,
  };
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function SectionCard({ title, icon: Icon, children, action }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111a2b] p-5 shadow-xl shadow-black/10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            {title}
          </h2>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function StatCard({ label, value, icon: Icon, tone = "cyan" }) {
  const tones = {
    cyan: "text-cyan-400 bg-cyan-400/10",
    red: "text-red-400 bg-red-400/10",
    orange: "text-orange-400 bg-orange-400/10",
    green: "text-emerald-400 bg-emerald-400/10",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111a2b] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400">{label}</span>

        <div className={`rounded-xl p-2 ${tones[tone]}`}>
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function extractResultPayload(response) {
  if (!response) return null;

  return (
    response?.result ||
    response?.investigation ||
    response?.data?.result ||
    response?.data?.investigation ||
    response?.data ||
    response
  );
}

export default function Investigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const incomingIncident = location.state?.incident || null;

  const [incidents, setIncidents] = useState([]);
  const [selectedId, setSelectedId] = useState(
    incomingIncident?.id ? String(incomingIncident.id) : ""
  );

  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);

  const [investigationResult, setInvestigationResult] = useState(null);
  const [backtrackResult, setBacktrackResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAlerts();
      const normalized = extractAlerts(response).map(normalizeIncident);

      setIncidents(normalized);

      if (!selectedId && normalized.length > 0) {
        setSelectedId(
          incomingIncident?.id
            ? String(incomingIncident.id)
            : String(normalized[0].id)
        );
      }
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Unable to load incidents for investigation."
      );

      if (incomingIncident) {
        setIncidents([normalizeIncident(incomingIncident, 0)]);
        setSelectedId(String(incomingIncident.id));
      }
    } finally {
      setLoading(false);
    }
  }, [incomingIncident, selectedId]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const filteredIncidents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return incidents;

    return incidents.filter((incident) =>
      [
        incident.id,
        incident.title,
        incident.severity,
        incident.status,
        incident.asset,
        incident.sourceIp,
        incident.user,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [incidents, search]);

  const selectedIncident = useMemo(() => {
    return (
      incidents.find((incident) => String(incident.id) === String(selectedId)) ||
      incidents[0] ||
      null
    );
  }, [incidents, selectedId]);

  const summary = useMemo(() => {
    return {
      total: incidents.length,
      critical: incidents.filter(
        (incident) => incident.severity === "Critical"
      ).length,
      active: incidents.filter((incident) => incident.status === "Active")
        .length,
      resolved: incidents.filter(
        (incident) => incident.status === "Resolved"
      ).length,
    };
  }, [incidents]);

  function addNote() {
    if (!note.trim()) return;

    setNotes((current) => [
      ...current,
      {
        author: "You",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        text: note.trim(),
      },
    ]);

    setNote("");
  }

  async function handleInvestigation() {
    if (!selectedIncident?.asset) {
      setMessage("No target asset is available for this incident.");
      return;
    }

    setActionLoading("investigate");
    setError("");
    setMessage("");
    setInvestigationResult(null);

    try {
      const response = await investigateAttack(selectedIncident.asset);

      setInvestigationResult(extractResultPayload(response));
      setMessage("Investigation completed successfully.");
    } catch (requestError) {
      setError(
        requestError?.message ||
          "The backend could not complete the investigation."
      );
    } finally {
      setActionLoading("");
    }
  }

  async function handleBacktrack() {
    if (!selectedIncident?.asset) {
      setMessage("No target asset is available for attack backtracking.");
      return;
    }

    setActionLoading("backtrack");
    setError("");
    setMessage("");
    setBacktrackResult(null);

    try {
      const response = await backtrackAttack(selectedIncident.asset);

      setBacktrackResult(extractResultPayload(response));
      setMessage("Attack backtracking completed successfully.");
    } catch (requestError) {
      setError(
        requestError?.message ||
          "The backend could not complete attack backtracking."
      );
    } finally {
      setActionLoading("");
    }
  }

  return (
    <div className="min-h-screen bg-[#08111f] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-400"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-400">
                <ShieldAlert size={28} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Investigation Center
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Investigate incidents, review backend results, and backtrack
                  attack activity.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/incidents")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
          >
            View All Incidents
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Incidents"
            value={summary.total}
            icon={Activity}
          />

          <StatCard
            label="Critical Cases"
            value={summary.critical}
            icon={AlertTriangle}
            tone="red"
          />

          <StatCard
            label="Active Cases"
            value={summary.active}
            icon={Clock3}
            tone="orange"
          />

          <StatCard
            label="Resolved Cases"
            value={summary.resolved}
            icon={CheckCircle2}
            tone="green"
          />
        </div>

        {error && (
          <div className="mb-6 border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 border border-cyan-400/20 bg-cyan-400/[0.06] p-4 text-sm text-cyan-300">
            {message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-white/10 bg-[#0d1727] p-4">
            <div className="mb-4">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">
                Backend Incidents
              </h2>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search incidents..."
                  className="w-full rounded-xl border border-white/10 bg-[#111a2b] py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Loading incidents...
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIncidents.map((incident) => {
                  const active = String(selectedId) === String(incident.id);

                  return (
                    <button
                      type="button"
                      key={incident.id}
                      onClick={() => {
                        setSelectedId(String(incident.id));
                        setInvestigationResult(null);
                        setBacktrackResult(null);
                        setMessage("");
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        active
                          ? "border-cyan-400/60 bg-cyan-400/10"
                          : "border-white/10 bg-[#111a2b] hover:border-cyan-400/30"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-semibold text-slate-500">
                          {incident.id}
                        </span>

                        <span
                          className={`h-2 w-2 rounded-full ${
                            incident.status === "Resolved"
                              ? "bg-emerald-400"
                              : incident.severity === "Critical"
                              ? "bg-red-400"
                              : "bg-orange-400"
                          }`}
                        />
                      </div>

                      <h3 className="line-clamp-2 text-sm font-semibold text-white">
                        {incident.title}
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge className={severityStyles[incident.severity]}>
                          {incident.severity}
                        </Badge>

                        <Badge
                          className={
                            statusStyles[incident.status] ||
                            statusStyles.Active
                          }
                        >
                          {incident.status}
                        </Badge>
                      </div>
                    </button>
                  );
                })}

                {filteredIncidents.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
                    No incidents found.
                  </div>
                )}
              </div>
            )}
          </aside>

          <main className="space-y-6">
            {!selectedIncident ? (
              <section className="rounded-2xl border border-white/10 bg-[#111a2b] p-8 text-center">
                <p className="text-sm text-slate-400">
                  Select an incident to begin investigation.
                </p>
              </section>
            ) : (
              <>
                <section className="rounded-2xl border border-white/10 bg-[#111a2b] p-5">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge
                          className={
                            severityStyles[selectedIncident.severity]
                          }
                        >
                          {selectedIncident.severity} Severity
                        </Badge>

                        <Badge
                          className={
                            statusStyles[selectedIncident.status] ||
                            statusStyles.Active
                          }
                        >
                          {selectedIncident.status}
                        </Badge>

                        <span className="text-xs text-slate-500">
                          {selectedIncident.id}
                        </span>
                      </div>

                      <h2 className="text-xl font-bold text-white sm:text-2xl">
                        {selectedIncident.title}
                      </h2>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                        {selectedIncident.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate("/incidents")}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
                    >
                      <Eye size={16} />
                      Incident Details
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="mb-1 text-xs text-slate-500">
                        Affected Asset
                      </p>

                      <div className="flex items-center gap-2 break-all text-sm font-medium text-white">
                        <Server size={15} className="text-cyan-400" />
                        {selectedIncident.asset}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs text-slate-500">
                        Source IP
                      </p>

                      <div className="flex items-center gap-2 break-all font-mono text-sm text-white">
                        <Network size={15} className="text-cyan-400" />
                        {selectedIncident.sourceIp}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs text-slate-500">
                        User Account
                      </p>

                      <div className="flex items-center gap-2 break-all text-sm font-medium text-white">
                        <Lock size={15} className="text-cyan-400" />
                        {selectedIncident.user}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs text-slate-500">
                        Detected At
                      </p>

                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <Clock3 size={15} className="text-cyan-400" />
                        {formatDate(selectedIncident.createdAt)}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#111a2b] p-5">
                  <div className="mb-5 flex items-center gap-2">
                    <Terminal size={18} className="text-cyan-400" />

                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                      Investigation Actions
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleInvestigation}
                      disabled={Boolean(actionLoading)}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-[#06111e] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShieldAlert size={17} />

                      {actionLoading === "investigate"
                        ? "Investigating..."
                        : "Run Investigation"}
                    </button>

                    <button
                      type="button"
                      onClick={handleBacktrack}
                      disabled={Boolean(actionLoading)}
                      className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-3 text-sm font-semibold text-violet-300 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Network size={17} />

                      {actionLoading === "backtrack"
                        ? "Backtracking..."
                        : "Backtrack Attack"}
                    </button>
                  </div>
                </section>

                {investigationResult && (
                  <SectionCard title="Investigation Result" icon={Activity}>
                    <pre className="max-h-[500px] overflow-auto rounded-xl border border-white/10 bg-[#0a111d] p-4 text-xs leading-6 text-cyan-200">
                      {JSON.stringify(investigationResult, null, 2)}
                    </pre>
                  </SectionCard>
                )}

                {backtrackResult && (
                  <SectionCard title="Attack Backtracking Result" icon={Network}>
                    <pre className="max-h-[500px] overflow-auto rounded-xl border border-white/10 bg-[#0a111d] p-4 text-xs leading-6 text-violet-200">
                      {JSON.stringify(backtrackResult, null, 2)}
                    </pre>
                  </SectionCard>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                  <SectionCard title="Incident Context" icon={FileText}>
                    <div className="space-y-3">
                      <div className="rounded-xl bg-[#0d1727] p-3">
                        <p className="text-xs text-slate-500">Alert Type</p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {selectedIncident.type}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#0d1727] p-3">
                        <p className="text-xs text-slate-500">Severity</p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {selectedIncident.severity}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#0d1727] p-3">
                        <p className="text-xs text-slate-500">Status</p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {selectedIncident.status}
                        </p>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Investigation Summary" icon={Terminal}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-[#0d1727] p-3">
                        <span className="text-sm text-slate-400">
                          Investigation Status
                        </span>

                        <span className="text-sm font-semibold text-cyan-300">
                          {investigationResult ? "Completed" : "Not Started"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-[#0d1727] p-3">
                        <span className="text-sm text-slate-400">
                          Backtracking Status
                        </span>

                        <span className="text-sm font-semibold text-violet-300">
                          {backtrackResult ? "Completed" : "Not Started"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-[#0d1727] p-3">
                        <span className="text-sm text-slate-400">
                          Analyst Notes
                        </span>

                        <span className="text-sm font-bold text-white">
                          {notes.length}
                        </span>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                <SectionCard title="Analyst Notes" icon={User}>
                  <div className="space-y-4">
                    {notes.length === 0 && (
                      <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">
                        No analyst notes have been added yet.
                      </div>
                    )}

                    {notes.map((item, index) => (
                      <div
                        key={`${item.time}-${index}`}
                        className="rounded-xl border border-white/10 bg-[#0d1727] p-4"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-cyan-400/10 p-1.5 text-cyan-400">
                              <User size={14} />
                            </div>

                            <span className="text-sm font-semibold text-white">
                              {item.author}
                            </span>
                          </div>

                          <span className="text-xs text-slate-500">
                            {item.time}
                          </span>
                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                          {item.text}
                        </p>
                      </div>
                    ))}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Add an investigation note..."
                        rows={3}
                        className="min-h-[90px] flex-1 resize-y rounded-xl border border-white/10 bg-[#0d1727] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
                      />

                      <button
                        type="button"
                        onClick={addNote}
                        disabled={!note.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-[#06111e] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 sm:self-end"
                      >
                        <Send size={16} />
                        Add Note
                      </button>
                    </div>
                  </div>
                </SectionCard>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}