 import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Check,
  Copy,
  FileSearch,
  Network,
  RefreshCw,
  Send,
  ShieldAlert,
} from "lucide-react";

import {
  backtrackAttack,
  getAlerts,
  investigateAttack,
} from "../services/dashboardApi";

import {
  AppShell,
  Badge,
  Button,
  Card,
  EmptyState,
  InfoRow,
  LoadingState,
  Notice,
  PageHeader,
  Panel,
  RawPayload,
  SearchInput,
  SeverityBadge,
  StatCard,
  StatusBadge,
  Timeline,
  severityTone,
} from "../components/ui";

/* ============================================================================
   HELPERS  (unchanged — backend field mapping)
============================================================================ */

function getValue(object, keys, fallback = "") {
  for (const key of keys) {
    const value = object?.[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
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

function getIncidentTime(incident) {
  const value = getValue(incident, [
    "createdAt",
    "created_at",
    "timestamp",
    "detection_timestamp",
    "detectionTimestamp",
    "detectedAt",
    "detected_at",
    "detected_on",
    "createdOn",
    "created_on",
    "time",
    "date",
  ]);

  const parsed = new Date(value).getTime();

  if (!Number.isNaN(parsed) && parsed > 0) {
    return parsed;
  }

  const rawId = getValue(incident, [
    "_id",
    "id",
    "alert_id",
    "alertId",
    "incident_id",
    "incidentId",
  ]);

  if (
    typeof rawId === "string" &&
    /^[a-f\d]{24}$/i.test(rawId)
  ) {
    return parseInt(rawId.substring(0, 8), 16) * 1000;
  }

  return 0;
}

function extractAlerts(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.alerts)) {
    return response.alerts;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.alerts)) {
    return response.data.alerts;
  }

  if (Array.isArray(response?.data?.results)) {
    return response.data.results;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  return [];
}

function normalizeIncident(alert, index = 0) {
  const id = getValue(
    alert,
    [
      "id",
      "_id",
      "alert_id",
      "alertId",
      "incident_id",
      "incidentId",
    ],
    `ALERT-${index + 1}`
  );

  const createdAt = getValue(alert, [
    "createdAt",
    "created_at",
    "timestamp",
    "detection_timestamp",
    "detectionTimestamp",
    "detectedAt",
    "detected_at",
    "detected_on",
    "createdOn",
    "created_on",
    "time",
    "date",
  ]);

  return {
    ...alert,

    id: String(id),

    title: getValue(
      alert,
      [
        "title",
        "name",
        "alert_name",
        "alertName",
        "message",
      ],
      "Security Alert"
    ),

    severity: normalizeSeverity(
      getValue(alert, [
        "severity",
        "priority",
        "risk_level",
        "riskLevel",
      ])
    ),

    status: normalizeStatus(
      getValue(alert, [
        "status",
        "state",
        "incident_status",
        "incidentStatus",
      ])
    ),

    type: getValue(
      alert,
      [
        "type",
        "attack_type",
        "attackType",
        "alert_type",
        "alertType",
        "category",
        "event_type",
      ],
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
        "source_address",
        "sourceAddress",
        "ip",
      ],
      "Unknown source"
    ),

    destinationIp: getValue(
      alert,
      [
        "destination_ip",
        "destinationIp",
        "dest_ip",
        "destIp",
        "destination",
        "target_ip",
        "targetIp",
      ],
      "Unknown destination"
    ),

    user: getValue(
      alert,
      [
        "user",
        "username",
        "user_name",
        "userName",
        "account",
        "user_account",
        "userAccount",
      ],
      "Unknown user"
    ),

    description: getValue(
      alert,
      [
        "description",
        "message",
        "details",
        "summary",
        "explanation",
      ],
      "No additional description is available."
    ),

    createdAt,
  };
}

function extractResultPayload(response) {
  if (!response) return null;

  return (
    response?.result ||
    response?.investigation ||
    response?.backtrack ||
    response?.data?.result ||
    response?.data?.investigation ||
    response?.data?.backtrack ||
    response?.data ||
    response
  );
}

function getResultSummary(result) {
  if (!result) return null;

  if (typeof result === "string") {
    return result;
  }

  return (
    result.summary ||
    result.message ||
    result.explanation ||
    result.analysis ||
    result.result ||
    null
  );
}

export default function Investigation() {
  const navigate = useNavigate();
  const location = useLocation();

  /*
   * Threat Intelligence sends the selected alert through
   * React Router state:
   *
   * navigate("/investigation", {
   *   state: { incident: indicator.rawAlert }
   * })
   */
  const incomingIncident =
    location.state?.incident || null;

  const [incidents, setIncidents] = useState([]);

  const [selectedId, setSelectedId] = useState(
    incomingIncident?.id ||
      incomingIncident?._id
      ? String(
          incomingIncident.id ||
            incomingIncident._id
        )
      : ""
  );

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [actionLoading, setActionLoading] =
    useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [investigationResult, setInvestigationResult] =
    useState(null);

  const [backtrackResult, setBacktrackResult] =
    useState(null);

  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState("");

  const [copied, setCopied] = useState("");

  /* --------------------------------------------------------------------------
     LOAD INCIDENTS
  -------------------------------------------------------------------------- */

  const loadIncidents = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await getAlerts();

        const normalized = extractAlerts(response)
          .map((alert, index) =>
            normalizeIncident(alert, index)
          )
          .sort(
            (a, b) =>
              getIncidentTime(b) -
              getIncidentTime(a)
          );

        setIncidents(normalized);

        /*
         * If Threat Intelligence sent an incident,
         * preserve/select that exact incident.
         */
        const incomingId =
          incomingIncident?.id ||
          incomingIncident?._id
            ? String(
                incomingIncident.id ||
                  incomingIncident._id
              )
            : "";

        const incomingExists =
          incomingId &&
          normalized.some(
            (incident) =>
              String(incident.id) ===
              incomingId
          );

        if (incomingExists) {
          setSelectedId(incomingId);
        } else if (normalized.length > 0) {
          /*
           * Otherwise select the newest alert.
           */
          setSelectedId(
            String(normalized[0].id)
          );
        } else if (incomingIncident) {
          /*
           * Fallback if backend doesn't return
           * the incoming incident.
           */
          const fallback =
            normalizeIncident(
              incomingIncident,
              0
            );

          setIncidents([fallback]);
          setSelectedId(String(fallback.id));
        } else {
          setSelectedId("");
        }
      } catch (requestError) {
        console.error(
          "Investigation alerts error:",
          requestError
        );

        setError(
          requestError?.message ||
            "Unable to load security incidents."
        );

        /*
         * If we arrived from Threat Intelligence,
         * still allow investigation of that alert.
         */
        if (incomingIncident) {
          const fallback =
            normalizeIncident(
              incomingIncident,
              0
            );

          setIncidents([fallback]);
          setSelectedId(String(fallback.id));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [incomingIncident]
  );

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  /* --------------------------------------------------------------------------
     DERIVED DATA
  -------------------------------------------------------------------------- */

  const filteredIncidents = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return incidents;
    }

    return incidents.filter((incident) =>
      [
        incident.id,
        incident.title,
        incident.type,
        incident.severity,
        incident.status,
        incident.asset,
        incident.sourceIp,
        incident.destinationIp,
        incident.user,
        incident.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [incidents, search]);

  const selectedIncident = useMemo(() => {
    return (
      incidents.find(
        (incident) =>
          String(incident.id) ===
          String(selectedId)
      ) ||
      null
    );
  }, [incidents, selectedId]);

  const summary = useMemo(() => {
    return {
      total: incidents.length,

      critical: incidents.filter(
        (incident) =>
          incident.severity === "Critical"
      ).length,

      active: incidents.filter(
        (incident) =>
          incident.status === "Active"
      ).length,

      resolved: incidents.filter(
        (incident) =>
          incident.status === "Resolved"
      ).length,
    };
  }, [incidents]);

  /* --------------------------------------------------------------------------
     INCIDENT SELECTION
  -------------------------------------------------------------------------- */

  function handleIncidentSelect(id) {
    setSelectedId(String(id));

    setInvestigationResult(null);
    setBacktrackResult(null);

    setMessage("");
    setError("");

    /*
     * Clear old notes when switching incidents.
     * Notes here are session-local analyst notes.
     */
    setNotes([]);
    setNote("");
  }

  /* --------------------------------------------------------------------------
     INVESTIGATION
  -------------------------------------------------------------------------- */

  async function handleInvestigation() {
    if (!selectedIncident) {
      setMessage(
        "Select an incident before starting an investigation."
      );
      return;
    }

    if (
      !selectedIncident.asset ||
      selectedIncident.asset ===
        "Unknown asset"
    ) {
      setMessage(
        "No target asset is available for this incident."
      );
      return;
    }

    setActionLoading("investigate");
    setError("");
    setMessage("");
    setInvestigationResult(null);

    try {
      const response =
        await investigateAttack(
          selectedIncident.asset
        );

      const result =
        extractResultPayload(response);

      setInvestigationResult(result);

      setMessage(
        "Investigation completed successfully."
      );
    } catch (requestError) {
      console.error(
        "Investigation request failed:",
        requestError
      );

      setError(
        requestError?.message ||
          "The backend could not complete the investigation."
      );
    } finally {
      setActionLoading("");
    }
  }

  /* --------------------------------------------------------------------------
     BACKTRACK
  -------------------------------------------------------------------------- */

  async function handleBacktrack() {
    if (!selectedIncident) {
      setMessage(
        "Select an incident before starting attack backtracking."
      );
      return;
    }

    if (
      !selectedIncident.asset ||
      selectedIncident.asset ===
        "Unknown asset"
    ) {
      setMessage(
        "No target asset is available for attack backtracking."
      );
      return;
    }

    setActionLoading("backtrack");
    setError("");
    setMessage("");
    setBacktrackResult(null);

    try {
      const response =
        await backtrackAttack(
          selectedIncident.asset
        );

      const result =
        extractResultPayload(response);

      setBacktrackResult(result);

      setMessage(
        "Attack backtracking completed successfully."
      );
    } catch (requestError) {
      console.error(
        "Backtracking request failed:",
        requestError
      );

      setError(
        requestError?.message ||
          "The backend could not complete attack backtracking."
      );
    } finally {
      setActionLoading("");
    }
  }

  /* --------------------------------------------------------------------------
     COPY
  -------------------------------------------------------------------------- */

  async function copyValue(value, key) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(
        String(value)
      );

      setCopied(key);

      window.setTimeout(() => {
        setCopied("");
      }, 1500);
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );
    }
  }

  /* --------------------------------------------------------------------------
     NOTES
  -------------------------------------------------------------------------- */

  function addNote() {
    const trimmed = note.trim();

    if (!trimmed) return;

    setNotes((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length}`,
        author: "You",
        time: new Date().toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
        text: trimmed,
      },
    ]);

    setNote("");
  }

  /* --------------------------------------------------------------------------
     RESULT RENDERER
  -------------------------------------------------------------------------- */

  function ResultViewer({ result, label }) {
    if (!result) return null;

    const summaryText = getResultSummary(result);

    return (
      <div className="space-y-3">
        {summaryText && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">{label}</p>

            <p className="mt-1.5 text-sm leading-6 text-slate-800">
              {typeof summaryText === "string"
                ? summaryText
                : JSON.stringify(summaryText, null, 2)}
            </p>
          </div>
        )}

        <RawPayload value={result} />
      </div>
    );
  }

  /* --------------------------------------------------------------------------
     COPY BUTTON
  -------------------------------------------------------------------------- */

  function CopyAction({ value, fieldKey }) {
    return (
      <button
        type="button"
        onClick={() => copyValue(value, fieldKey)}
        className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        aria-label={`Copy ${fieldKey}`}
      >
        {copied === fieldKey ? <Check size={13} /> : <Copy size={13} />}
      </button>
    );
  }

  /* ==========================================================================
     RENDER
  ========================================================================== */

  const attackChain = selectedIncident
    ? [
        {
          id: "source",
          title: selectedIncident.sourceIp,
          description: "Origin of the observed activity",
          severity: selectedIncident.severity,
          time: formatDate(selectedIncident.createdAt),
        },
        {
          id: "event",
          title: selectedIncident.type,
          description: selectedIncident.description,
          severity: selectedIncident.severity,
        },
        {
          id: "asset",
          title: selectedIncident.asset,
          description: `Destination ${selectedIncident.destinationIp} · account ${selectedIncident.user}`,
          severity: selectedIncident.severity,
        },
      ]
    : [];

  return (
    <AppShell connected={!error}>
      <PageHeader
        breadcrumb="Analysis"
        title="Investigation"
        description="Work one incident at a time: read its chain, run backend analysis and keep notes as you go."
        status={
          selectedIncident ? (
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={selectedIncident.severity} />

              <StatusBadge status={selectedIncident.status} />
            </div>
          ) : (
            <Badge tone="slate">No incident selected</Badge>
          )
        }
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => loadIncidents(true)}
            disabled={refreshing || loading}
          >
            Refresh
          </Button>
        }
      />

      <div className="mx-auto max-w-[1600px] space-y-4 px-5 py-6 lg:px-8">
        {error && <Notice tone="error">{error}</Notice>}

        {message && (
          <Notice tone="info" onDismiss={() => setMessage("")}>
            {message}
          </Notice>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Critical"
            value={summary.critical}
            tone={summary.critical > 0 ? "critical" : "good"}
            emphasis
            hint="Across the incident queue"
          />

          <StatCard
            label="Active"
            value={summary.active}
            tone={summary.active > 0 ? "high" : "good"}
            hint="Not yet resolved"
          />

          <StatCard
            label="Resolved"
            value={summary.resolved}
            tone="good"
            hint="Closed by an analyst"
          />

          <StatCard
            label="Total"
            value={summary.total}
            hint="Returned by the alerts endpoint"
          />
        </div>

        {/* ---------------------------- three-column investigation workspace */}

        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
          {/* ------------------------------------------- left: queue */}

          <Panel
            title="Incidents"
            hint={`${filteredIncidents.length} of ${incidents.length}`}
            className="self-start overflow-hidden"
          >
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter the queue"
            />

            {loading ? (
              <div className="mt-4">
                <LoadingState label="Loading incidents" rows={4} />
              </div>
            ) : filteredIncidents.length === 0 ? (
              <EmptyState
                title="No incidents"
                description="Nothing matches this filter."
              />
            ) : (
              <ul className="-mx-5 -mb-5 mt-4 max-h-[560px] divide-y divide-slate-100 overflow-y-auto border-t border-slate-100">
                {filteredIncidents.map((incident) => {
                  const active =
                    String(incident.id) === String(selectedId);

                  const tone = severityTone(incident.severity);

                  return (
                    <li key={incident.id}>
                      <button
                        type="button"
                        onClick={() => handleIncidentSelect(incident.id)}
                        className={`flex w-full gap-3 px-5 py-3 text-left transition-colors duration-150 ${
                          active ? "bg-slate-100/70" : "hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`mt-0.5 h-8 w-[3px] shrink-0 rounded-full ${tone.spine}`}
                        />

                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-900">
                            {incident.title}
                          </span>

                          <span className="mt-0.5 block truncate text-xs text-slate-500">
                            {incident.asset} · {incident.status}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {/* --------------------------------------- centre: workspace */}

          <div className="space-y-4">
            {!selectedIncident ? (
              <Panel>
                <EmptyState
                  icon={FileSearch}
                  title="Select an incident to investigate"
                  description="Pick one from the queue on the left. Its attack chain, analysis tools and evidence appear here."
                />
              </Panel>
            ) : (
              <>
                <Card className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-slate-900">
                        {selectedIncident.title}
                      </h2>

                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {selectedIncident.id} · {selectedIncident.type}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="primary"
                        icon={FileSearch}
                        loading={actionLoading === "investigate"}
                        disabled={Boolean(actionLoading)}
                        onClick={handleInvestigation}
                      >
                        {actionLoading === "investigate"
                          ? "Investigating"
                          : "Run investigation"}
                      </Button>

                      <Button
                        icon={Network}
                        loading={actionLoading === "backtrack"}
                        disabled={Boolean(actionLoading)}
                        onClick={handleBacktrack}
                      >
                        {actionLoading === "backtrack"
                          ? "Backtracking"
                          : "Backtrack attack"}
                      </Button>
                    </div>
                  </div>

                  <p className="mt-4 max-w-[76ch] text-[15px] leading-7 text-slate-700">
                    {selectedIncident.description}
                  </p>
                </Card>

                <Panel title="Attack chain" hint="Source, event and target as reported">
                  <Timeline items={attackChain} />
                </Panel>

                {investigationResult && (
                  <Panel title="Investigation result">
                    <ResultViewer
                      result={investigationResult}
                      label="Backend analysis"
                    />
                  </Panel>
                )}

                {backtrackResult && (
                  <Panel title="Attack backtracking">
                    <ResultViewer
                      result={backtrackResult}
                      label="Reconstructed attack path"
                    />
                  </Panel>
                )}

                <Panel
                  title="Analyst notes"
                  hint="Kept in this session only — not sent to the backend"
                >
                  <div className="flex gap-2">
                    <input
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") addNote();
                      }}
                      placeholder="Record what you observed"
                      className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C2E] focus-visible:ring-offset-2"
                    />

                    <Button
                      variant="primary"
                      icon={Send}
                      onClick={addNote}
                      disabled={!note.trim()}
                    >
                      Add note
                    </Button>
                  </div>

                  {notes.length > 0 && (
                    <ul className="mt-4 space-y-2.5">
                      {notes.map((entry) => (
                        <li
                          key={entry.id}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-xs font-medium text-slate-700">
                              {entry.author}
                            </span>

                            <span className="text-xs tabular-nums text-slate-400">
                              {entry.time}
                            </span>
                          </div>

                          <p className="mt-1 text-sm leading-6 text-slate-700">
                            {entry.text}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </>
            )}
          </div>

          {/* ------------------------------------ right: intelligence */}

          <div className="space-y-4">
            <Panel title="Incident record">
              {!selectedIncident ? (
                <p className="text-sm text-slate-500">
                  Select an incident to see its metadata.
                </p>
              ) : (
                <div>
                  <InfoRow
                    label="Incident ID"
                    value={selectedIncident.id}
                    mono
                    action={
                      <CopyAction
                        value={selectedIncident.id}
                        fieldKey="Incident ID"
                      />
                    }
                  />

                  <InfoRow
                    label="Source IP"
                    value={selectedIncident.sourceIp}
                    mono
                    action={
                      <CopyAction
                        value={selectedIncident.sourceIp}
                        fieldKey="Source IP"
                      />
                    }
                  />

                  <InfoRow
                    label="Destination"
                    value={selectedIncident.destinationIp}
                    mono
                    action={
                      <CopyAction
                        value={selectedIncident.destinationIp}
                        fieldKey="Destination"
                      />
                    }
                  />

                  <InfoRow label="Asset" value={selectedIncident.asset} />

                  <InfoRow label="Account" value={selectedIncident.user} />

                  <InfoRow
                    label="Detected"
                    value={formatDate(selectedIncident.createdAt)}
                  />

                  <InfoRow
                    label="Classification"
                    value={selectedIncident.type}
                  />
                </div>
              )}
            </Panel>

            <Panel title="Next steps">
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  icon={ShieldAlert}
                  className="w-full justify-start"
                  onClick={() => navigate("/incidents")}
                >
                  Back to incident queue
                </Button>

                <Button
                  variant="secondary"
                  icon={Network}
                  className="w-full justify-start"
                  onClick={() => navigate("/attack-graph")}
                >
                  View the attack graph
                </Button>

                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => navigate("/automation")}
                >
                  Open response automation
                </Button>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}