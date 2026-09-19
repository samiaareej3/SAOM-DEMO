import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AlertTriangle, CheckCircle2, FileText, Play, ScrollText } from "lucide-react";

import {
  runSecurityAudit,
  getAuditTriggers,
  getAuditHistory,
  getAuditById,
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
  ScoreRing,
  Select,
  StatCard,
  StatusBadge,
  Table,
  Cell,
} from "../components/ui";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

/* =========================================================
   HELPERS  (unchanged)
========================================================= */

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

function getAuditObject(response) {
  return (
    response?.audit ||
    response?.data?.audit ||
    response?.data ||
    response ||
    null
  );
}

function getHistoryArray(response) {
  return response?.audits || response?.data || [];
}

/* Module score bar. Colour follows the same thresholds as the score ring so
   a weak module reads the same way everywhere. */
function ScoreBar({ label, score }) {
  const value = Number(score) || 0;

  const tone =
    value >= 75
      ? "bg-emerald-600"
      : value >= 50
        ? "bg-amber-500"
        : value >= 25
          ? "bg-orange-500"
          : "bg-red-600";

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm text-slate-700">
          {String(label).replaceAll("_", " ")}
        </span>

        <span className="text-sm font-semibold tabular-nums text-slate-900">
          {value}
        </span>
      </div>

      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{
            width: `${Math.max(0, Math.min(value, 100))}%`,
            transition: "width .5s cubic-bezier(.22,1,.36,1)",
          }}
        />
      </div>
    </li>
  );
}

function toText(value, fallback) {
  if (typeof value === "string") return value;

  return value?.title || value?.description || fallback || JSON.stringify(value);
}

export default function Audit() {
  const navigate = useNavigate();

  const [audit, setAudit] = useState(null);
  const [history, setHistory] = useState([]);
  const [triggers, setTriggers] = useState([]);

  const [selectedTrigger, setSelectedTrigger] = useState("MANUAL");
  const [generatedBy, setGeneratedBy] = useState("SAOM-AI Dashboard");

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadAuditData = async () => {
    try {
      setLoading(true);
      setError("");

      const [historyResponse, triggersResponse] = await Promise.all([
        getAuditHistory(25),
        getAuditTriggers(),
      ]);

      const historyItems = getHistoryArray(historyResponse);
      const triggerItems =
        triggersResponse?.triggers ||
        triggersResponse?.data ||
        triggersResponse ||
        [];

      setHistory(Array.isArray(historyItems) ? historyItems : []);
      setTriggers(Array.isArray(triggerItems) ? triggerItems : []);

      if (!audit && historyItems?.length > 0) {
        const latestAudit = historyItems[0];
        const latestAuditId =
          latestAudit?.audit_id ||
          latestAudit?._id ||
          latestAudit?.id;

        if (latestAuditId) {
          const latestResponse = await getAuditById(latestAuditId);
          setAudit(getAuditObject(latestResponse));
        } else {
          setAudit(latestAudit);
        }
      }
    } catch (requestError) {
      console.error("Failed to load audit data:", requestError);
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load audit information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  const runAudit = async () => {
    try {
      setRunning(true);
      setError("");
      setSuccessMessage("");

      const response = await runSecurityAudit({
        trigger_type: selectedTrigger,
        generated_by: generatedBy,
      });

      const createdAudit = getAuditObject(response);

      if (createdAudit) {
        setAudit(createdAudit);
      }

      setSuccessMessage(
        response?.message || "Security audit completed successfully."
      );

      await loadAuditData();
    } catch (requestError) {
      console.error("Failed to run security audit:", requestError);

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to run security audit."
      );
    } finally {
      setRunning(false);
    }
  };

  const selectAudit = async (auditItem) => {
    const auditId =
      auditItem?.audit_id || auditItem?._id || auditItem?.id;

    if (!auditId) {
      setAudit(auditItem);
      return;
    }

    try {
      setError("");

      const response = await getAuditById(auditId);
      setAudit(getAuditObject(response));
    } catch (requestError) {
      console.error("Failed to load selected audit:", requestError);

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load selected audit."
      );
    }
  };

  const openPdfReport = () => {
    const auditId =
      audit?.audit_id || audit?._id || audit?.id;

    if (!auditId) {
      setError("Select or generate an audit before opening the report.");
      return;
    }

    window.open(
      `${API_BASE_URL}/api/report/${auditId}/pdf`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const moduleScores = useMemo(() => {
    if (!audit?.module_scores) return [];

    if (Array.isArray(audit.module_scores)) {
      return audit.module_scores;
    }

    return Object.entries(audit.module_scores).map(
      ([moduleName, score]) => ({
        name: moduleName,
        score,
      })
    );
  }, [audit]);

  const checks = Array.isArray(audit?.checks)
    ? audit.checks
    : [];

  const recommendations = Array.isArray(audit?.recommendations)
    ? audit.recommendations
    : [];

  const criticalFindings = Array.isArray(audit?.critical_findings)
    ? audit.critical_findings
    : [];

  const warnings = Array.isArray(audit?.warnings)
    ? audit.warnings
    : [];

  const passedChecks = Array.isArray(audit?.passed_checks)
    ? audit.passed_checks
    : [];

  const securityGrade =
    audit?.security_grade ||
    audit?.grade ||
    "—";

  const overallScore =
    audit?.overall_score ??
    audit?.score ??
    0;

  const posture =
    audit?.security_posture ||
    audit?.posture ||
    "Not available";

  return (
    <AppShell connected={!error}>
      <PageHeader
        breadcrumb="Governance"
        title="Security audit"
        description="Run a posture assessment, review its findings and export the signed report."
        status={
          audit ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="indigo">Grade {securityGrade}</Badge>

              <Badge tone="slate">{posture}</Badge>
            </div>
          ) : (
            <Badge tone="slate">No audit selected</Badge>
          )
        }
        actions={
          <>
            <Button
              variant="secondary"
              icon={FileText}
              onClick={openPdfReport}
              disabled={!audit}
            >
              Open PDF report
            </Button>

            <Button
              variant="primary"
              icon={Play}
              loading={running}
              onClick={runAudit}
              disabled={running}
            >
              {running ? "Running audit" : "Run audit"}
            </Button>
          </>
        }
      />

      <div className="mx-auto max-w-[1600px] space-y-4 px-5 py-6 lg:px-8">
        {error && (
          <Notice tone="error" onDismiss={() => setError("")}>
            {error}
          </Notice>
        )}

        {successMessage && (
          <Notice tone="success" onDismiss={() => setSuccessMessage("")}>
            {successMessage}
          </Notice>
        )}

        {running && (
          <Card className="overflow-hidden p-0">
            <div className="h-0.5 w-full overflow-hidden bg-slate-100">
              <div className="h-full w-full animate-pulse bg-indigo-500" />
            </div>

            <p className="px-5 py-4 text-sm text-slate-600">
              Running the audit modules. This page updates when the backend
              returns the completed report.
            </p>
          </Card>
        )}

        {/* ----------------------------------------------- audit controls */}

        <Panel title="Run a new audit">
          <div className="grid gap-4 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] md:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs text-slate-500">
                Trigger
              </span>

              <Select
                value={selectedTrigger}
                onChange={(event) => setSelectedTrigger(event.target.value)}
              >
                <option value="MANUAL">MANUAL</option>

                {triggers.map((trigger, index) => {
                  const value =
                    typeof trigger === "string"
                      ? trigger
                      : trigger?.trigger_type ||
                        trigger?.name ||
                        trigger?.value;

                  if (!value || value === "MANUAL") return null;

                  return (
                    <option key={`${value}-${index}`} value={value}>
                      {value}
                    </option>
                  );
                })}
              </Select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs text-slate-500">
                Generated by
              </span>

              <input
                value={generatedBy}
                onChange={(event) => setGeneratedBy(event.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              />
            </label>

            <Button
              variant="primary"
              icon={Play}
              loading={running}
              onClick={runAudit}
              disabled={running}
              className="md:mb-0"
            >
              {running ? "Running" : "Run audit"}
            </Button>
          </div>
        </Panel>

        {loading && !audit ? (
          <Panel>
            <LoadingState label="Loading audit history" rows={4} />
          </Panel>
        ) : !audit ? (
          <Panel>
            <EmptyState
              icon={ScrollText}
              title="No audit has been generated yet"
              description="Run an audit to score the environment, list findings and produce an exportable report."
              action={
                <Button variant="primary" icon={Play} onClick={runAudit}>
                  Run the first audit
                </Button>
              }
            />
          </Panel>
        ) : (
          <>
            {/* ------------------------------------------ score + summary */}

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <Card className="p-6">
                <ScoreRing
                  value={Number(overallScore) || 0}
                  max={100}
                  size={140}
                  label={`Overall score · grade ${securityGrade}`}
                  caption={posture}
                />

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <InfoRow
                    label="Audit"
                    value={audit?.audit_name || "Security audit"}
                  />

                  <InfoRow
                    label="Trigger"
                    value={audit?.trigger_type || selectedTrigger}
                  />

                  <InfoRow
                    label="Generated by"
                    value={audit?.generated_by || generatedBy}
                  />

                  <InfoRow
                    label="Completed"
                    value={formatDate(
                      audit?.completed_at || audit?.created_at
                    )}
                  />
                </div>
              </Card>

              <Panel title="Module scores">
                {moduleScores.length === 0 ? (
                  <EmptyState
                    title="No module breakdown returned"
                    description="This audit reported an overall score without per-module detail."
                  />
                ) : (
                  <ul className="space-y-4">
                    {moduleScores.map((module, index) => (
                      <ScoreBar
                        key={module.name || index}
                        label={module.name || `Module ${index + 1}`}
                        score={module.score}
                      />
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            {/* --------------------------------------------------- counts */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Critical findings"
                value={criticalFindings.length}
                tone={criticalFindings.length > 0 ? "critical" : "good"}
                emphasis
                hint="Must be remediated"
              />

              <StatCard
                label="Warnings"
                value={warnings.length}
                tone={warnings.length > 0 ? "medium" : "good"}
                hint="Review when convenient"
              />

              <StatCard
                label="Checks passed"
                value={passedChecks.length}
                tone="good"
                hint={`${checks.length} checks executed`}
              />

              <StatCard
                label="Assets at risk"
                value={audit?.assets_at_risk ?? "—"}
                tone="brand"
                hint={`${audit?.total_assets ?? "—"} assets assessed`}
              />
            </div>

            {audit?.ai_summary && (
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-slate-900">
                  Audit summary
                </h2>

                <p className="mt-3 max-w-[78ch] text-[15px] leading-7 text-slate-700">
                  {audit.ai_summary}
                </p>
              </Card>
            )}

            {/* ------------------------------------------------- findings */}

            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title="Critical findings">
                {criticalFindings.length === 0 ? (
                  <p className="text-sm text-emerald-700">
                    No critical findings were reported.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {criticalFindings.map((finding, index) => (
                      <li
                        key={index}
                        className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
                      >
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />

                        {toText(finding, "Critical finding")}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Warnings">
                {warnings.length === 0 ? (
                  <p className="text-sm text-emerald-700">
                    No warnings were reported.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {warnings.map((warning, index) => (
                      <li
                        key={index}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
                      >
                        {toText(warning, "Warning")}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <Panel title="Recommendations" hint="In the order the audit ranked them">
              {recommendations.length === 0 ? (
                <p className="text-sm text-slate-500">
                  This audit returned no recommendations.
                </p>
              ) : (
                <ol className="space-y-2.5">
                  {recommendations.map((recommendation, index) => (
                    <li
                      key={index}
                      className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold tabular-nums text-slate-500 ring-1 ring-slate-200">
                        {index + 1}
                      </span>

                      {toText(recommendation, "Recommendation")}
                    </li>
                  ))}
                </ol>
              )}
            </Panel>

            {/* --------------------------------------------------- checks */}

            <Panel title="Audit checks" className="overflow-hidden">
              {checks.length === 0 ? (
                <p className="text-sm text-slate-500">
                  This audit returned no individual checks.
                </p>
              ) : (
                <div className="-m-5">
                  <Table
                    columns={[
                      { key: "check", label: "Check" },
                      { key: "status", label: "Status" },
                      { key: "severity", label: "Severity" },
                      { key: "details", label: "Details" },
                    ]}
                  >
                    {checks.map((check, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <Cell className="font-medium text-slate-900">
                          {check?.name ||
                            check?.check_name ||
                            `Check ${index + 1}`}
                        </Cell>

                        <Cell>
                          <StatusBadge status={check?.status || "unknown"}>
                            {check?.status || "—"}
                          </StatusBadge>
                        </Cell>

                        <Cell className="text-slate-600">
                          {check?.severity || "—"}
                        </Cell>

                        <Cell className="max-w-[420px] text-slate-600">
                          {check?.details ||
                            check?.description ||
                            check?.message ||
                            "—"}
                        </Cell>
                      </tr>
                    ))}
                  </Table>
                </div>
              )}
            </Panel>

            {passedChecks.length > 0 && (
              <Panel title="Passed checks">
                <ul className="flex flex-wrap gap-2">
                  {passedChecks.map((check, index) => (
                    <li
                      key={index}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800"
                    >
                      <CheckCircle2 size={14} />

                      {toText(check, "Passed check")}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </>
        )}

        {/* -------------------------------------------------- audit history */}

        <Panel
          title="Audit history"
          hint={`${history.length} previous audits`}
          className="overflow-hidden"
        >
          {history.length === 0 ? (
            <EmptyState
              title="No previous audits"
              description="Completed audits are listed here so you can compare posture over time."
            />
          ) : (
            <ul className="-mx-5 -mb-5 divide-y divide-slate-100">
              {history.map((historyItem, index) => {
                const historyId =
                  historyItem?.audit_id ||
                  historyItem?._id ||
                  historyItem?.id ||
                  index;

                const isCurrent =
                  audit &&
                  (audit.audit_id || audit._id || audit.id) === historyId;

                return (
                  <li key={historyId}>
                    <button
                      type="button"
                      onClick={() => selectAudit(historyItem)}
                      className={`flex w-full flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors duration-150 ${
                        isCurrent ? "bg-indigo-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-900">
                          {historyItem?.audit_name ||
                            historyItem?.name ||
                            "Security audit"}
                        </span>

                        <span className="mt-0.5 block text-xs text-slate-500">
                          {formatDate(
                            historyItem?.created_at || historyItem?.createdAt
                          )}
                        </span>
                      </span>

                      <span className="flex items-center gap-4">
                        <span className="text-sm font-semibold tabular-nums text-slate-900">
                          {historyItem?.overall_score ??
                            historyItem?.score ??
                            "—"}
                        </span>

                        {isCurrent && <Badge tone="indigo">Viewing</Badge>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}