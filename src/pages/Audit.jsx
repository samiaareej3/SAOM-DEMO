import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  runSecurityAudit,
  getAuditTriggers,
  getAuditHistory,
  getAuditById,
} from "../services/dashboardApi";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

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

function StatCard({ label, value, color = "text-white" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>

      <p className={`mt-3 text-3xl font-semibold ${color}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}

function SectionCard({ title, children, action }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-200">
          {title}
        </h2>

        {action}
      </div>

      {children}
    </section>
  );
}

function ScoreBar({ label, score }) {
  const numericScore = Number(score || 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-300">{label}</span>

        <span className="font-semibold text-white">
          {Number.isFinite(numericScore) ? numericScore : 0}/100
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all"
          style={{
            width: `${Math.min(100, Math.max(0, numericScore))}%`,
          }}
        />
      </div>
    </div>
  );
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
    <main className="min-h-screen bg-[#070b14] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end">
          <div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mb-4 text-sm text-cyan-300 transition hover:text-cyan-200"
            >
              ← Back to Dashboard
            </button>

            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
              SAOM-AI / Compliance & Security
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Security Audit Center
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Run security audits, review findings, inspect security posture,
              and generate audit reports.
            </p>
          </div>

          <button
            type="button"
            onClick={runAudit}
            disabled={running}
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Running Audit..." : "Run Security Audit"}
          </button>
        </header>

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        )}

        <SectionCard title="Audit Configuration">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-400">
                Trigger Type
              </span>

              <select
                value={selectedTrigger}
                onChange={(event) =>
                  setSelectedTrigger(event.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-[#0d1422] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                <option value="MANUAL">Manual</option>

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
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm text-slate-400">
                Generated By
              </span>

              <input
                value={generatedBy}
                onChange={(event) =>
                  setGeneratedBy(event.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-[#0d1422] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                placeholder="Enter audit owner"
              />
            </label>
          </div>
        </SectionCard>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-slate-400">
            Loading audit data...
          </div>
        ) : audit ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Overall Score"
                value={`${overallScore}/100`}
                color="text-cyan-300"
              />

              <StatCard
                label="Security Grade"
                value={securityGrade}
                color="text-emerald-300"
              />

              <StatCard
                label="Assets at Risk"
                value={audit.assets_at_risk}
                color="text-amber-300"
              />

              <StatCard
                label="Open Alerts"
                value={audit.open_alerts}
                color="text-red-300"
              />
            </div>

            <SectionCard
              title="Audit Summary"
              action={
                <button
                  type="button"
                  onClick={openPdfReport}
                  className="rounded-lg border border-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
                >
                  Open PDF Report
                </button>
              }
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Audit Name
                    </p>

                    <p className="mt-1 text-lg font-semibold text-white">
                      {audit.audit_name || "Security Audit"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Security Posture
                    </p>

                    <p className="mt-1 text-base font-medium text-cyan-300">
                      {posture}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/[0.04] p-3">
                      <p className="text-xs text-slate-500">
                        Total Assets
                      </p>

                      <p className="mt-1 text-xl font-semibold">
                        {audit.total_assets ?? "—"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/[0.04] p-3">
                      <p className="text-xs text-slate-500">
                        Resolved Alerts
                      </p>

                      <p className="mt-1 text-xl font-semibold">
                        {audit.resolved_alerts ?? "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    AI Summary
                  </p>

                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {audit.ai_summary ||
                      "No AI summary is available for this audit."}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 text-xs text-slate-500 sm:grid-cols-2">
                <p>
                  Created:{" "}
                  <span className="text-slate-300">
                    {formatDate(audit.created_at)}
                  </span>
                </p>

                <p>
                  Completed:{" "}
                  <span className="text-slate-300">
                    {formatDate(audit.completed_at)}
                  </span>
                </p>

                <p>
                  Trigger:{" "}
                  <span className="text-slate-300">
                    {audit.trigger_type || "—"}
                  </span>
                </p>

                <p>
                  Generated By:{" "}
                  <span className="text-slate-300">
                    {audit.generated_by || "—"}
                  </span>
                </p>
              </div>
            </SectionCard>

            {moduleScores.length > 0 && (
              <SectionCard title="Module Scores">
                <div className="grid gap-5 md:grid-cols-2">
                  {moduleScores.map((module, index) => (
                    <ScoreBar
                      key={`${module.name || module.module || index}`}
                      label={
                        module.name ||
                        module.module ||
                        module.module_name ||
                        `Module ${index + 1}`
                      }
                      score={
                        module.score ??
                        module.overall_score ??
                        module.value ??
                        0
                      }
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="Critical Findings">
                {criticalFindings.length === 0 ? (
                  <p className="text-sm text-emerald-300">
                    No critical findings reported.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {criticalFindings.map((finding, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100"
                      >
                        {typeof finding === "string"
                          ? finding
                          : finding?.title ||
                            finding?.description ||
                            JSON.stringify(finding)}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Warnings">
                {warnings.length === 0 ? (
                  <p className="text-sm text-emerald-300">
                    No warnings reported.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {warnings.map((warning, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100"
                      >
                        {typeof warning === "string"
                          ? warning
                          : warning?.title ||
                            warning?.description ||
                            JSON.stringify(warning)}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            <SectionCard title="Recommendations">
              {recommendations.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No recommendations available.
                </p>
              ) : (
                <ol className="space-y-3">
                  {recommendations.map((recommendation, index) => (
                    <li
                      key={index}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300"
                    >
                      <span className="mr-3 font-semibold text-cyan-300">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      {typeof recommendation === "string"
                        ? recommendation
                        : recommendation?.title ||
                          recommendation?.description ||
                          JSON.stringify(recommendation)}
                    </li>
                  ))}
                </ol>
              )}
            </SectionCard>

            <SectionCard title="Audit Checks">
              {checks.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No individual checks available.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-3 py-3">Check</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Severity</th>
                        <th className="px-3 py-3">Details</th>
                      </tr>
                    </thead>

                    <tbody>
                      {checks.map((check, index) => (
                        <tr
                          key={index}
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="px-3 py-4 text-slate-200">
                            {check?.name ||
                              check?.check_name ||
                              `Check ${index + 1}`}
                          </td>

                          <td className="px-3 py-4">
                            <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-300">
                              {check?.status || "—"}
                            </span>
                          </td>

                          <td className="px-3 py-4 text-slate-300">
                            {check?.severity || "—"}
                          </td>

                          <td className="px-3 py-4 text-slate-400">
                            {check?.details ||
                              check?.description ||
                              "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            {passedChecks.length > 0 && (
              <SectionCard title="Passed Checks">
                <div className="space-y-2">
                  {passedChecks.map((check, index) => (
                    <div
                      key={index}
                      className="rounded-lg bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200"
                    >
                      ✓{" "}
                      {typeof check === "string"
                        ? check
                        : check?.name ||
                          check?.description ||
                          JSON.stringify(check)}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
            <h2 className="text-xl font-semibold text-white">
              No audit available
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Run your first security audit to generate a report.
            </p>
          </div>
        )}

        <SectionCard title="Audit History">
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">
              No previous audits found.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((historyItem, index) => {
                const historyId =
                  historyItem?.audit_id ||
                  historyItem?._id ||
                  historyItem?.id ||
                  index;

                return (
                  <button
                    key={historyId}
                    type="button"
                    onClick={() => selectAudit(historyItem)}
                    className="flex w-full flex-col justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.04] sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-medium text-slate-200">
                        {historyItem?.audit_name ||
                          historyItem?.name ||
                          "Security Audit"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(
                          historyItem?.created_at ||
                            historyItem?.createdAt
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-cyan-300">
                        Score:{" "}
                        {historyItem?.overall_score ??
                          historyItem?.score ??
                          "—"}
                      </span>

                      <span className="text-xs text-slate-500">
                        View →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </main>
  );
}