import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FileSearch, RefreshCw, ShieldAlert, Workflow } from "lucide-react";

import {
  createSOARPlaybook,
  getAlertById,
  getAlerts,
  investigateAttack,
} from "../services/dashboardApi";

import {
  AppShell,
  Badge,
  Button,
  Cell,
  EmptyState,
  InfoRow,
  LoadingState,
  Notice,
  PageHeader,
  Panel,
  SearchInput,
  SegmentedControl,
  Select,
  SeverityBadge,
  SidePanel,
  SpineRow,
  StatCard,
  StatusBadge,
  Table,
} from "../components/ui";

const SEVERITIES = ["All", "Critical", "High", "Medium", "Low"];
const STATUSES = ["All", "Active", "Investigating", "Resolved"];

/* =========================================================
   HELPERS  (unchanged — backend field mapping)
========================================================= */

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

  const filtersActive =
    search !== "" || severityFilter !== "All" || statusFilter !== "All";

  return (
    <AppShell connected={!error}>
      <PageHeader
        breadcrumb="Operations"
        title="Incidents"
        description="Every detection the backend has raised, newest queue first. Select a row to open the full record and response actions."
        status={
          summary.critical > 0 ? (
            <Badge tone="red">{summary.critical} critical open</Badge>
          ) : (
            <Badge tone="emerald">No critical incidents open</Badge>
          )
        }
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={loading}
            onClick={loadIncidents}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />

      <div className="mx-auto max-w-[1600px] space-y-4 px-5 py-6 lg:px-8">
        {error && <Notice tone="error">{error}</Notice>}

        {actionMessage && (
          <Notice tone="info" onDismiss={() => setActionMessage("")}>
            {actionMessage}
          </Notice>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Critical and open"
            value={summary.critical}
            tone={summary.critical > 0 ? "critical" : "good"}
            emphasis
            hint="Unresolved at critical severity"
          />

          <StatCard
            label="Active"
            value={summary.active}
            tone={summary.active > 0 ? "high" : "good"}
            hint="Not yet picked up"
          />

          <StatCard
            label="Under investigation"
            value={summary.investigating}
            tone="brand"
            hint="Assigned to an analyst workflow"
          />

          <StatCard
            label="Total incidents"
            value={summary.total}
            hint="Returned by the alerts endpoint"
          />
        </div>

        {/* ---------------------------------------------------- filter bar */}

        <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ID, asset, source or attack type"
            className="lg:max-w-sm lg:flex-1"
          />

          <SegmentedControl
            value={severityFilter}
            onChange={setSeverityFilter}
            options={SEVERITIES}
          />

          <Select
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="lg:w-44"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "All statuses" : status}
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-3 lg:ml-auto">
            <span className="text-xs tabular-nums text-slate-500">
              {filteredIncidents.length} of {incidents.length}
            </span>

            {filtersActive && (
              <Button size="sm" variant="ghost" onClick={resetFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* -------------------------------------------------------- table */}

        <Panel className="overflow-hidden">
          {loading ? (
            <LoadingState label="Loading incidents" rows={5} />
          ) : filteredIncidents.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title={
                incidents.length === 0
                  ? "No incidents reported"
                  : "No incidents match these filters"
              }
              description={
                incidents.length === 0
                  ? "The alerts endpoint returned an empty set. New detections appear here automatically."
                  : "Widen the severity or status filter to see more of the queue."
              }
              action={
                incidents.length > 0 && (
                  <Button onClick={resetFilters}>Clear filters</Button>
                )
              }
            />
          ) : (
            <div className="-m-5">
              <Table
                columns={[
                  { key: "spine", label: "", className: "w-[3px] p-0" },
                  { key: "incident", label: "Incident" },
                  { key: "asset", label: "Asset" },
                  { key: "source", label: "Source" },
                  { key: "severity", label: "Severity" },
                  { key: "status", label: "Status" },
                  { key: "detected", label: "Detected", align: "right" },
                ]}
              >
                {filteredIncidents.map((incident) => (
                  <SpineRow
                    key={incident.id}
                    severity={incident.severity}
                    selected={selectedIncident?.id === incident.id}
                    onClick={() => openIncident(incident)}
                  >
                    <Cell>
                      <p className="font-medium text-slate-900">
                        {incident.title}
                      </p>

                      <p className="mt-0.5 font-mono text-xs text-slate-500">
                        {incident.id} · {incident.type}
                      </p>
                    </Cell>

                    <Cell className="text-slate-700">{incident.asset}</Cell>

                    <Cell className="font-mono text-[13px] text-slate-600">
                      {incident.source}
                    </Cell>

                    <Cell>
                      <SeverityBadge severity={incident.severity} />
                    </Cell>

                    <Cell>
                      <StatusBadge status={incident.status} />
                    </Cell>

                    <Cell className="text-right text-xs text-slate-500">
                      {incident.detected}
                    </Cell>
                  </SpineRow>
                ))}
              </Table>
            </div>
          )}
        </Panel>
      </div>

      {/* ------------------------------------------------- detail panel */}

      <SidePanel
        open={Boolean(selectedIncident)}
        onClose={() => setSelectedIncident(null)}
        title={selectedIncident?.title}
        subtitle={
          selectedIncident
            ? `${selectedIncident.id} · ${selectedIncident.detectedFull}`
            : ""
        }
        footer={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              icon={FileSearch}
              loading={actionLoading === "investigate"}
              disabled={Boolean(actionLoading)}
              onClick={handleInvestigation}
            >
              {actionLoading === "investigate"
                ? "Starting"
                : "Start investigation"}
            </Button>

            <Button
              icon={Workflow}
              loading={actionLoading === "playbook"}
              disabled={Boolean(actionLoading)}
              onClick={handleCreatePlaybook}
            >
              {actionLoading === "playbook"
                ? "Creating"
                : "Create SOAR playbook"}
            </Button>
          </div>
        }
      >
        {selectedIncident && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={selectedIncident.severity} />

              <StatusBadge status={selectedIncident.status} />

              <Badge tone="slate">{selectedIncident.type}</Badge>

              {detailsLoading && (
                <span className="text-xs text-slate-400">
                  Loading full record…
                </span>
              )}
            </div>

            <p className="text-sm leading-6 text-slate-700">
              {selectedIncident.description}
            </p>

            <div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Attack path
              </h3>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-slate-900">
                    {selectedIncident.source}
                  </span>

                  <span className="h-px flex-1 bg-slate-300" />

                  <span className="font-mono text-slate-900">
                    {selectedIncident.asset}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>Source</span>

                  <span>Target asset</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Record
              </h3>

              <InfoRow label="Incident ID" value={selectedIncident.id} mono />

              <InfoRow label="Detected" value={selectedIncident.detectedFull} />

              <InfoRow label="Relative" value={selectedIncident.detected} />

              <InfoRow label="Classification" value={selectedIncident.type} />

              <InfoRow
                label="Source address"
                value={selectedIncident.source}
                mono
              />

              <InfoRow label="Target asset" value={selectedIncident.asset} />
            </div>
          </div>
        )}
      </SidePanel>
    </AppShell>
  );
}