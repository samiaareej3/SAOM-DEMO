import { useEffect, useMemo, useState } from "react";

import {
  Ban,
  BadgeCheck,
  Check,
  FileWarning,
  Network,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  getSOARActions,
  getAlerts,
  createSOARPlaybook,
  approveSOARAction,
  rejectSOARAction,
  executeSOARAction,
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
  SearchInput,
  SegmentedControl,
  StatCard,
  StatusBadge,
  severityTone,
} from "../components/ui";

/* =========================================================
   HELPERS  (unchanged)
========================================================= */

function normalizeArray(response, key) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    response &&
    Array.isArray(response[key])
  ) {
    return response[key];
  }

  if (
    response?.data &&
    Array.isArray(response.data)
  ) {
    return response.data;
  }

  if (
    response?.data &&
    Array.isArray(response.data[key])
  ) {
    return response.data[key];
  }

  return [];
}

function getActionIcon(actionType) {
  const type =
    String(actionType || "")
      .toUpperCase();

  if (
    type.includes("ISOLATE") ||
    type.includes("ENDPOINT")
  ) {
    return Server;
  }

  if (
    type.includes("BLOCK") ||
    type.includes("IP")
  ) {
    return Network;
  }

  if (
    type.includes("CREDENTIAL") ||
    type.includes("MFA")
  ) {
    return Ban;
  }

  return ShieldCheck;
}

function formatStatus(status) {
  return String(
    status || "UNKNOWN"
  )
    .replaceAll("_", " ")
    .toLowerCase();
}

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown";
  }

  return date.toLocaleString();
}

const STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "PENDING_APPROVAL", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUCCESS", label: "Executed" },
  { value: "FAILED", label: "Failed" },
];

/* =========================================================
   APPROVAL CARD

   A decision-first layout: what the action will do, to what,
   and why — then the two buttons that resolve it.
========================================================= */

function ApprovalCard({ action, busyId, onApprove, onReject, onExecute, onInspect }) {
  const Icon = getActionIcon(action.action_type);

  const status = String(action.status || "").toUpperCase();
  const priority = String(action.priority || "MEDIUM").toUpperCase();

  const actionId = action.action_id || action._id;

  const isPending = status === "PENDING_APPROVAL";
  const isApproved = status === "APPROVED";
  const isBusy = busyId === actionId;

  const tone = severityTone(priority);

  return (
    <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
      <span
        className={`absolute inset-y-0 left-0 w-[3px] ${tone.spine}`}
        aria-hidden="true"
      />

      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
              <Icon size={18} />
            </span>

            <div className="min-w-0">
              <h3 className="truncate font-medium text-slate-900">
                {String(action.action_type || "Response action").replaceAll(
                  "_",
                  " "
                )}
              </h3>

              <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                {actionId || "No action ID"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={
                priority === "CRITICAL"
                  ? "red"
                  : priority === "HIGH"
                    ? "amber"
                    : "slate"
              }
            >
              {priority.toLowerCase()} priority
            </Badge>

            <StatusBadge status={status}>{formatStatus(status)}</StatusBadge>
          </div>
        </div>

        {action.reason && (
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {action.reason}
          </p>
        )}

        <dl className="mt-4 grid gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-slate-500">Target</dt>

            <dd className="mt-0.5 truncate font-mono text-[13px] text-slate-900">
              {action.target || "—"}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-slate-500">Target type</dt>

            <dd className="mt-0.5 truncate text-sm text-slate-900">
              {action.target_type || "—"}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-slate-500">Source alert</dt>

            <dd className="mt-0.5 truncate font-mono text-[13px] text-slate-900">
              {action.alert_id || "—"}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-slate-500">Requested</dt>

            <dd className="mt-0.5 truncate text-sm text-slate-900">
              {formatDate(action.created_at)}
            </dd>
          </div>
        </dl>

        {action.approval_note && (
          <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
            {action.approval_note}
          </p>
        )}

        {action.execution_result && (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
            {typeof action.execution_result === "string"
              ? action.execution_result
              : JSON.stringify(action.execution_result)}
          </p>
        )}

        {action.error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
            {typeof action.error === "string"
              ? action.error
              : JSON.stringify(action.error)}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          {isPending && (
            <>
              <Button
                variant="success"
                icon={Check}
                disabled={isBusy}
                loading={isBusy}
                onClick={() => onApprove(action)}
              >
                Approve
              </Button>

              <Button
                variant="outlineDanger"
                icon={X}
                disabled={isBusy}
                onClick={() => onReject(action)}
              >
                Reject
              </Button>
            </>
          )}

          {isApproved && (
            <Button
              variant="primary"
              icon={Play}
              disabled={isBusy}
              loading={isBusy}
              onClick={() => onExecute(action)}
            >
              Execute action
            </Button>
          )}

          <Button variant="ghost" onClick={() => onInspect(action)}>
            View details
          </Button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   ALERT → PLAYBOOK GENERATOR
========================================================= */

function AlertGeneratorCard({ alert, busyAlertId, onGenerate }) {
  const alertId = alert._id || alert.id;

  const busy = busyAlertId === alertId;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <FileWarning size={17} />
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">
            {alert.attack_type || alert.title || "Security alert"}
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-500">
            {alert.severity ? `${alert.severity} · ` : ""}
            {alert.description || "No description provided."}
          </p>
        </div>
      </div>

      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        loading={busy}
        onClick={() => onGenerate(alert)}
        className="shrink-0"
      >
        {busy ? "Generating" : "Generate playbook"}
      </Button>
    </div>
  );
}

export default function Approvals() {
  const [
    actions,
    setActions,
  ] = useState([]);

  const [
    alerts,
    setAlerts,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    alertsLoading,
    setAlertsLoading,
  ] = useState(false);

  const [
    busyId,
    setBusyId,
  ] = useState(null);

  const [
    busyAlertId,
    setBusyAlertId,
  ] = useState(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState("ALL");

  const [
    error,
    setError,
  ] = useState("");

  /* Presentation-only: which action is open in the detail panel. */
  const [inspected, setInspected] = useState(null);

  /* =======================================================
     LOAD SOAR ACTIONS
  ======================================================= */

  async function loadActions() {
    setLoading(true);
    setError("");

    try {
      const response =
        await getSOARActions();

      const data =
        normalizeArray(
          response,
          "actions"
        );

      setActions(
        data
      );
    } catch (err) {
      console.error(
        "Failed to load SOAR actions:",
        err
      );

      setError(
        err?.message ||
          "Failed to load SOAR actions."
      );

      setActions([]);
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     LOAD ALERTS
  ======================================================= */

  async function loadAlerts() {
    setAlertsLoading(
      true
    );

    try {
      const response =
        await getAlerts();

      const data =
        normalizeArray(
          response,
          "alerts"
        );

      setAlerts(
        data
      );
    } catch (err) {
      console.error(
        "Failed to load alerts:",
        err
      );

      setAlerts([]);
    } finally {
      setAlertsLoading(
        false
      );
    }
  }

  useEffect(() => {
    loadActions();
  }, []);

  /* =======================================================
     GENERATE SOAR PLAYBOOK
  ======================================================= */

  async function handleGenerate(
    alert
  ) {
    const alertId =
      alert._id ||
      alert.id;

    if (!alertId) {
      setError(
        "This alert does not have a valid ID."
      );

      return;
    }

    try {
      setBusyAlertId(
        alertId
      );

      setError("");

      await createSOARPlaybook(
        alertId
      );

      await loadActions();

    } catch (err) {
      console.error(
        "Failed to generate SOAR playbook:",
        err
      );

      setError(
        err?.message ||
          "Failed to generate SOAR actions."
      );
    } finally {
      setBusyAlertId(
        null
      );
    }
  }

  /* =======================================================
     APPROVE
  ======================================================= */

  async function handleApprove(
    action
  ) {
    const actionId =
      action.action_id ||
      action._id;

    if (!actionId) {
      return;
    }

    try {
      setBusyId(
        actionId
      );

      setError("");

      await approveSOARAction(
        actionId,
        {
          approved_by:
            "ANALYST",

          approval_note:
            "Approved from SAOM-AI Approval Queue.",
        }
      );

      await loadActions();

    } catch (err) {
      console.error(
        "Approval failed:",
        err
      );

      setError(
        err?.message ||
          "Failed to approve SOAR action."
      );
    } finally {
      setBusyId(
        null
      );
    }
  }

  /* =======================================================
     REJECT
  ======================================================= */

  async function handleReject(
    action
  ) {
    const actionId =
      action.action_id ||
      action._id;

    if (!actionId) {
      return;
    }

    try {
      setBusyId(
        actionId
      );

      setError("");

      await rejectSOARAction(
        actionId,
        {
          rejected_by:
            "ANALYST",

          approval_note:
            "Rejected from SAOM-AI Approval Queue.",
        }
      );

      await loadActions();

    } catch (err) {
      console.error(
        "Rejection failed:",
        err
      );

      setError(
        err?.message ||
          "Failed to reject SOAR action."
      );
    } finally {
      setBusyId(
        null
      );
    }
  }

  /* =======================================================
     EXECUTE
  ======================================================= */

  async function handleExecute(
    action
  ) {
    const actionId =
      action.action_id ||
      action._id;

    if (!actionId) {
      return;
    }

    try {
      setBusyId(
        actionId
      );

      setError("");

      await executeSOARAction(
        actionId
      );

      await loadActions();

    } catch (err) {
      console.error(
        "Execution failed:",
        err
      );

      setError(
        err?.message ||
          "Failed to execute SOAR action."
      );
    } finally {
      setBusyId(
        null
      );
    }
  }

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredActions =
    useMemo(() => {
      const query =
        search
          .toLowerCase()
          .trim();

      return actions.filter(
        (action) => {
          const status =
            String(
              action.status ||
                ""
            ).toUpperCase();

          const searchable =
            [
              action.action_id,
              action.action_type,
              action.target,
              action.target_type,
              action.reason,
              action.priority,
              action.status,
              action.alert_id,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !query ||
            searchable.includes(
              query
            );

          const matchesFilter =
            filter === "ALL" ||
            status === filter;

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      actions,
      search,
      filter,
    ]);

  /* =======================================================
     STATS
  ======================================================= */

  const pendingCount =
    actions.filter(
      (action) =>
        action.status ===
        "PENDING_APPROVAL"
    ).length;

  const approvedCount =
    actions.filter(
      (action) =>
        action.status ===
        "APPROVED"
    ).length;

  const executedCount =
    actions.filter(
      (action) =>
        action.status ===
          "SUCCESS" ||
        action.status ===
          "FAILED"
    ).length;

  const rejectedCount =
    actions.filter(
      (action) =>
        action.status ===
        "REJECTED"
    ).length;

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <AppShell connected={!error}>
      <PageHeader
        breadcrumb="Response"
        title="Approval queue"
        description="Response actions the SOAR engine will not run until an analyst signs them off."
        status={
          pendingCount > 0 ? (
            <Badge tone="amber">{pendingCount} awaiting a decision</Badge>
          ) : (
            <Badge tone="emerald">Queue clear</Badge>
          )
        }
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={loading}
            onClick={loadActions}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />

      <div className="mx-auto max-w-[1600px] space-y-4 px-5 py-6 lg:px-8">
        {error && (
          <Notice tone="error" onDismiss={() => setError("")}>
            {error}
          </Notice>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pending approval"
            value={pendingCount}
            tone={pendingCount > 0 ? "medium" : "good"}
            emphasis
            hint="Waiting on you"
          />

          <StatCard
            label="Approved"
            value={approvedCount}
            tone="brand"
            hint="Cleared to execute"
          />

          <StatCard
            label="Executed"
            value={executedCount}
            tone="good"
            hint="Succeeded or failed"
          />

          <StatCard
            label="Rejected"
            value={rejectedCount}
            hint="Declined by an analyst"
          />
        </div>

        {/* ---------------------------------------------------- filter bar */}

        <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search action ID, target or attack type"
            className="lg:max-w-sm lg:flex-1"
          />

          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={STATUS_FILTERS}
          />

          <span className="text-xs tabular-nums text-slate-500 lg:ml-auto">
            {filteredActions.length} of {actions.length}
          </span>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* ------------------------------------------------- queue */}

          <div className="space-y-4">
            {loading ? (
              <Panel>
                <LoadingState label="Loading approval queue" rows={3} />
              </Panel>
            ) : filteredActions.length === 0 ? (
              <Panel>
                <EmptyState
                  icon={BadgeCheck}
                  title={
                    actions.length === 0
                      ? "Nothing waiting for approval"
                      : "No actions match these filters"
                  }
                  description={
                    actions.length === 0
                      ? "Generate a playbook from an alert on the right, and its response actions arrive here for sign-off."
                      : "Switch the status filter to see the rest of the queue."
                  }
                />
              </Panel>
            ) : (
              filteredActions.map((action) => (
                <ApprovalCard
                  key={action.action_id || action._id}
                  action={action}
                  busyId={busyId}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onExecute={handleExecute}
                  onInspect={setInspected}
                />
              ))
            )}
          </div>

          {/* -------------------------------------- playbook generation */}

          <Panel
            title="Generate from an alert"
            hint="Creates SOAR actions for a detection that has none"
            action={
              <Button
                size="sm"
                variant="secondary"
                loading={alertsLoading}
                onClick={loadAlerts}
                disabled={alertsLoading}
              >
                {alertsLoading ? "Loading" : "Load alerts"}
              </Button>
            }
          >
            {alerts.length === 0 ? (
              <EmptyState
                title="No alerts loaded"
                description="Load the alert feed to generate a response playbook for a detection."
              />
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 12).map((alert) => (
                  <AlertGeneratorCard
                    key={alert._id || alert.id}
                    alert={alert}
                    busyAlertId={busyAlertId}
                    onGenerate={handleGenerate}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* --------------------------------------------- action detail card */}

      {inspected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div
            className="absolute inset-0 bg-slate-900/20"
            onClick={() => setInspected(null)}
            aria-hidden="true"
          />

          <Card className="relative w-full max-w-lg p-5 shadow-2xl">
            <h2 className="text-base font-semibold text-slate-900">
              {String(inspected.action_type || "Response action").replaceAll(
                "_",
                " "
              )}
            </h2>

            <p className="mt-0.5 font-mono text-xs text-slate-500">
              {inspected.action_id || inspected._id}
            </p>

            <div className="mt-4">
              <InfoRow label="Status" value={formatStatus(inspected.status)} />

              <InfoRow
                label="Priority"
                value={String(inspected.priority || "MEDIUM").toLowerCase()}
              />

              <InfoRow label="Target" value={inspected.target} mono />

              <InfoRow label="Target type" value={inspected.target_type} />

              <InfoRow label="Source alert" value={inspected.alert_id} mono />

              <InfoRow
                label="Requested"
                value={formatDate(inspected.created_at)}
              />

              {inspected.reason && (
                <InfoRow label="Reason" value={inspected.reason} />
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <Button onClick={() => setInspected(null)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}