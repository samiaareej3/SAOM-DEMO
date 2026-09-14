
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createSOARPlaybook,
  getAlertById,
  getAlerts,
  investigateAttack,
} from "../services/dashboardApi";

const SEVERITIES = ["All", "Critical", "High", "Medium", "Low"];
const STATUSES = ["All", "Active", "Investigating", "Resolved"];

const SEVERITY_STYLES = {
  Critical: {
    text: "text-red-300",
    border: "border-red-400/30",
    background: "bg-red-400/10",
    dot: "bg-red-400",
  },
  High: {
    text: "text-orange-300",
    border: "border-orange-400/30",
    background: "bg-orange-400/10",
    dot: "bg-orange-400",
  },
  Medium: {
    text: "text-yellow-300",
    border: "border-yellow-400/30",
    background: "bg-yellow-400/10",
    dot: "bg-yellow-400",
  },
  Low: {
    text: "text-emerald-300",
    border: "border-emerald-400/30",
    background: "bg-emerald-400/10",
    dot: "bg-emerald-400",
  },
};

const STATUS_STYLES = {
  Active: "text-red-300 border-red-400/20 bg-red-400/10",
  Investigating: "text-cyan-300 border-cyan-400/20 bg-cyan-400/10",
  Resolved: "text-emerald-300 border-emerald-400/20 bg-emerald-400/10",
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

function formatDate(value) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function formatRelativeTime(value) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const difference = Date.now() - date.getTime();
  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days} day${days === 1 ? "" : "s"} ago`;
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
    status.includes("resolve") ||
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

function normalizeIncident(alert, index) {
  const createdAt = getValue(alert, [
    "createdAt",
    "created_at",
    "timestamp",
    "detectedAt",
    "detected_at",
    "event_time",
    "time",
  ]);

  const id = getValue(
    alert,
    ["id", "_id", "alert_id", "alertId", "incident_id", "incidentId"],
    `ALERT-${index + 1}`
  );

  return {
    ...alert,
    id: String(id),
    title: getValue(
      alert,
      ["title", "name", "alert_name", "alertName", "message", "description"],
      "Security Alert"
    ),
    type: getValue(
      alert,
      ["type", "alert_type", "alertType", "category", "rule", "event_type"],
      "SECURITY_EVENT"
    ),
    severity: normalizeSeverity(
      getValue(alert, ["severity", "priority", "risk_level", "riskLevel"])
    ),
    status: normalizeStatus(
      getValue(alert, ["status", "state", "incident_status", "incidentStatus"])
    ),
    asset: getValue(
      alert,
      [
        "asset",
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
    source: getValue(
      alert,
      [
        "source",
        "source_ip",
        "sourceIp",
        "src_ip",
        "srcIp",
        "ip",
        "source_address",
      ],
      "Unknown source"
    ),
    description: getValue(
      alert,
      ["description", "message", "details", "summary"],
      "No additional description is available for this alert."
    ),
    createdAt,
    detected: formatRelativeTime(createdAt),
    detectedFull: formatDate(createdAt),
  };
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

function SeverityBadge({ severity }) {
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low;

  return (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${style.border} ${style.background} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {severity}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
        STATUS_STYLES[status] || STATUS_STYLES.Active
      }`}
    >
      {status}
    </span>
  );
}

function SummaryCard({ label, value, description, accent }) {
  return (
    <article className="border border-white/[0.08] bg-[#080e15] p-5">
      <div className={`mb-4 h-1 w-10 ${accent}`} />

      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-100">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </article>
  );
}

export default function Incidents() {
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState([]);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedIncident, setSelectedIncident] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError("");
    setActionMessage("");

    try {
      const response = await getAlerts();
      const rawAlerts = extractAlerts(response);

      setIncidents(rawAlerts.map(normalizeIncident));
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Unable to load incidents from the SAOM-AI backend."
      );
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const summary = useMemo(() => {
    return {
      total: incidents.length,
      active: incidents.filter((incident) => incident.status === "Active")
        .length,
      critical: incidents.filter(
        (incident) =>
          incident.severity === "Critical" && incident.status !== "Resolved"
      ).length,
      investigating: incidents.filter(
        (incident) => incident.status === "Investigating"
      ).length,
    };
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return incidents.filter((incident) => {
      const searchableText = [
        incident.id,
        incident.title,
        incident.type,
        incident.asset,
        incident.source,
        incident.description,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesSeverity =
        severityFilter === "All" || incident.severity === severityFilter;

      const matchesStatus =
        statusFilter === "All" || incident.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [incidents, search, severityFilter, statusFilter]);

  async function openIncident(incident) {
    setSelectedIncident(incident);
    setActionMessage("");
    setError("");

    if (!incident.id) return;

    setDetailsLoading(true);

    try {
      const response = await getAlertById(incident.id);
      const detailedAlert =
        response?.alert ||
        response?.data?.alert ||
        response?.data ||
        response;

      if (detailedAlert && typeof detailedAlert === "object") {
        setSelectedIncident({
          ...incident,
          ...normalizeIncident(detailedAlert, 0),
        });
      }
    } catch {
      // The table data remains available if the detail endpoint fails.
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleInvestigation() {
    if (!selectedIncident?.asset) {
      setActionMessage("No target asset is available for investigation.");
      return;
    }

    setActionLoading("investigate");
    setActionMessage("");
    setError("");

    try {
      await investigateAttack(selectedIncident.asset);

      setActionMessage(
        "Investigation started successfully. Opening Investigation workspace..."
      );

      setTimeout(() => {
        navigate("/investigation", {
          state: {
            incident: selectedIncident,
            targetAssetId: selectedIncident.asset,
          },
        });
      }, 500);
    } catch (requestError) {
      setActionMessage(
        requestError?.message || "Unable to start the investigation."
      );
    } finally {
      setActionLoading("");
    }
  }

  async function handleCreatePlaybook() {
    if (!selectedIncident?.id) {
      setActionMessage("No alert ID is available for SOAR playbook creation.");
      return;
    }

    setActionLoading("playbook");
    setActionMessage("");
    setError("");

    try {
      await createSOARPlaybook(selectedIncident.id);

      setActionMessage(
        "SOAR playbook created successfully. Opening Automation workspace..."
      );

      setTimeout(() => {
        navigate("/automation", {
          state: {
            incident: selectedIncident,
            alertId: selectedIncident.id,
          },
        });
      }, 500);
    } catch (requestError) {
      setActionMessage(
        requestError?.message || "Unable to create the SOAR playbook."
      );
    } finally {
      setActionLoading("");
    }
  }

  function resetFilters() {
    setSearch("");
    setSeverityFilter("All");
    setStatusFilter("All");
  }

  return (
    <main className="min-h-screen bg-[#05080d] px-4 py-6 text-slate-200 sm:px-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="flex flex-col justify-between gap-5 border-b border-white/[0.06] pb-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-400/70">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Security Operations / Incidents
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
              Incident Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Investigate, prioritize and track security incidents detected
              across your monitored environment.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start border border-emerald-400/20 bg-emerald-400/[0.04] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-emerald-400 lg:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Threat Engine Online
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Incidents"
            value={summary.total}
            description="Alerts returned by the backend"
            accent="bg-cyan-400"
          />

          <SummaryCard
            label="Active Incidents"
            value={summary.active}
            description="Require immediate attention"
            accent="bg-red-400"
          />

          <SummaryCard
            label="Critical Incidents"
            value={summary.critical}
            description="Unresolved critical threats"
            accent="bg-orange-400"
          />

          <SummaryCard
            label="Under Investigation"
            value={summary.investigating}
            description="Currently being investigated"
            accent="bg-violet-400"
          />
        </section>

        {error && (
          <section className="border border-red-400/20 bg-red-400/[0.06] p-4">
            <p className="text-xs font-semibold text-red-300">{error}</p>

            <button
              type="button"
              onClick={loadIncidents}
              className="mt-3 border border-red-400/30 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-400/10"
            >
              Retry Request
            </button>
          </section>
        )}

        <section className="border border-white/[0.08] bg-[#080e15]">
          <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] p-5 xl:flex-row xl:items-center">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400/70">
                Incident Registry
              </p>

              <h2 className="mt-2 text-lg font-semibold text-slate-100">
                Detected Incidents
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Review backend alerts and open an incident for investigation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {filteredIncidents.length} Results
              </span>

              <button
                type="button"
                onClick={loadIncidents}
                disabled={loading}
                className="border border-cyan-400/30 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-400/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <button
                type="button"
                onClick={resetFilters}
                className="border border-white/[0.1] px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-300"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 border-b border-white/[0.07] p-5 md:grid-cols-3">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search incident, asset or source..."
              className="border border-white/[0.1] bg-[#050a10] px-4 py-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
            />

            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value)}
              className="border border-white/[0.1] bg-[#050a10] px-4 py-3 text-xs text-slate-300 outline-none focus:border-cyan-400/50"
            >
              {SEVERITIES.map((severity) => (
                <option key={severity} value={severity}>
                  {severity === "All" ? "All Severities" : severity}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="border border-white/[0.1] bg-[#050a10] px-4 py-3 text-xs text-slate-300 outline-none focus:border-cyan-400/50"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Statuses" : status}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />

              <p className="mt-4 text-sm font-medium text-slate-300">
                Loading incidents from SAOM-AI...
              </p>

              <p className="mt-2 text-xs text-slate-600">
                Connecting to the alert registry.
              </p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-medium text-slate-300">
                No incidents found
              </p>

              <p className="mt-2 text-xs text-slate-600">
                Try changing your search or filter selection.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.015]">
                    {[
                      "Incident",
                      "Severity",
                      "Asset",
                      "Source",
                      "Status",
                      "Detected",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className={`px-5 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600 ${
                          heading === "Action" ? "text-right" : ""
                        }`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredIncidents.map((incident) => (
                    <tr
                      key={incident.id}
                      className="border-b border-white/[0.06] transition hover:bg-cyan-400/[0.025]"
                    >
                      <td className="px-5 py-5">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-cyan-400/20 bg-cyan-400/[0.04] text-xs text-cyan-300">
                            ◈
                          </div>

                          <div>
                            <p className="text-[10px] font-bold tracking-wider text-cyan-400/70">
                              {incident.id}
                            </p>

                            <p className="mt-1 max-w-[280px] text-sm font-medium text-slate-200">
                              {incident.title}
                            </p>

                            <p className="mt-1 text-[10px] tracking-wider text-slate-600">
                              {incident.type}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <SeverityBadge severity={incident.severity} />
                      </td>

                      <td className="px-5 py-5">
                        <p className="text-xs font-medium text-slate-300">
                          {incident.asset}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-600">
                          Monitored endpoint
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-mono text-xs text-slate-400">
                          {incident.source}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge status={incident.status} />
                      </td>

                      <td className="px-5 py-5 text-xs text-slate-500">
                        {incident.detected}
                      </td>

                      <td className="px-5 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => openIncident(incident)}
                          className="border border-white/[0.1] px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.04] hover:text-cyan-300"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedIncident && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Incident details"
          >
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-white/[0.1] bg-[#080e15]">
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-5">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400/70">
                    Incident Details
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-slate-100">
                    {selectedIncident.title}
                  </h2>

                  <p className="mt-1 text-xs text-slate-600">
                    {selectedIncident.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="text-xl text-slate-500 transition hover:text-white"
                  aria-label="Close incident details"
                >
                  ×
                </button>
              </div>

              {detailsLoading && (
                <div className="border-b border-white/[0.08] px-5 py-3 text-xs text-cyan-300">
                  Loading complete alert details...
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">
                    Severity
                  </p>

                  <div className="mt-2">
                    <SeverityBadge severity={selectedIncident.severity} />
                  </div>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">
                    Status
                  </p>

                  <div className="mt-2">
                    <StatusBadge status={selectedIncident.status} />
                  </div>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">
                    Alert Type
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {selectedIncident.type}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">
                    Affected Asset
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {selectedIncident.asset}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">
                    Source Address
                  </p>

                  <p className="mt-2 break-all font-mono text-sm text-slate-300">
                    {selectedIncident.source}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">
                    Detected At
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {selectedIncident.detectedFull}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">
                    Description
                  </p>

                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {selectedIncident.description}
                  </p>
                </div>
              </div>

              {actionMessage && (
                <div className="mx-5 mb-5 border border-cyan-400/20 bg-cyan-400/[0.05] p-3 text-xs text-cyan-300">
                  {actionMessage}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2 border-t border-white/[0.08] p-5">
                <button
                  type="button"
                  onClick={handleInvestigation}
                  disabled={Boolean(actionLoading)}
                  className="border border-violet-400/30 bg-violet-400/[0.06] px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-violet-300 transition hover:bg-violet-400/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "investigate"
                    ? "Starting..."
                    : "Investigate"}
                </button>

                <button
                  type="button"
                  onClick={handleCreatePlaybook}
                  disabled={Boolean(actionLoading)}
                  className="border border-cyan-400/30 bg-cyan-400/[0.06] px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-400/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "playbook"
                    ? "Creating..."
                    : "Create SOAR Playbook"}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="border border-white/[0.1] px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 transition hover:border-white/20 hover:text-white"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}