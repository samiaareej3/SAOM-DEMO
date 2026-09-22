 import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, FileText, Play, ScrollText } from "lucide-react";

import {
  runSecurityAudit,
  getAuditTriggers,
  getAuditHistory,
  getAuditById,
} from "../services/dashboardApi";

import {
  LoadingState,
  Notice,
  Select,
  StatusBadge,
  Table,
  Cell,
} from "../components/ui";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function getAuditObject(response) {
  return response?.audit || response?.data?.audit || response?.data || response || null;
}

function getHistoryArray(response) {
  return response?.audits || response?.data || [];
}

function toText(value, fallback) {
  if (typeof value === "string") return value;
  return value?.title || value?.description || fallback || JSON.stringify(value);
}


export default function Audit() {
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
        const latest = historyItems[0];
        const id = latest?.audit_id || latest?._id || latest?.id;

        if (id) {
          const response = await getAuditById(id);
          setAudit(getAuditObject(response));
        } else {
          setAudit(latest);
        }
      }
    } catch (e) {
      console.error("Failed to load audit data:", e);
      setError(e?.response?.data?.message || e?.message || "Unable to load audit information.");
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

      const created = getAuditObject(response);
      if (created) setAudit(created);

      setSuccessMessage(response?.message || "Security audit completed successfully.");
      await loadAuditData();
    } catch (e) {
      console.error("Failed to run security audit:", e);
      setError(e?.response?.data?.message || e?.message || "Unable to run security audit.");
    } finally {
      setRunning(false);
    }
  };

  const selectAudit = async (item) => {
    const id = item?.audit_id || item?._id || item?.id;

    if (!id) {
      setAudit(item);
      return;
    }

    try {
      setError("");
      const response = await getAuditById(id);
      setAudit(getAuditObject(response));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Unable to load selected audit.");
    }
  };

  const openPdfReport = () => {
    const id = audit?.audit_id || audit?._id || audit?.id;

    if (!id) {
      setError("Select or generate an audit before opening the report.");
      return;
    }

    window.open(`${API_BASE_URL}/api/report/${id}/pdf`, "_blank", "noopener,noreferrer");
  };

  const moduleScores = useMemo(() => {
    if (!audit?.module_scores) return [];

    if (Array.isArray(audit.module_scores)) return audit.module_scores;

    return Object.entries(audit.module_scores).map(([name, score]) => ({
      name,
      score,
    }));
  }, [audit]);

  const checks = Array.isArray(audit?.checks) ? audit.checks : [];
  const recommendations = Array.isArray(audit?.recommendations) ? audit.recommendations : [];
  const criticalFindings = Array.isArray(audit?.critical_findings) ? audit.critical_findings : [];
  const warnings = Array.isArray(audit?.warnings) ? audit.warnings : [];
  const passedChecks = Array.isArray(audit?.passed_checks) ? audit.passed_checks : [];

  const score = Number(audit?.overall_score ?? audit?.score ?? 0);
  const grade = audit?.security_grade || audit?.grade || "—";
  const posture = audit?.security_posture || audit?.posture || "Not available";
  const currentId = audit?.audit_id || audit?._id || audit?.id;

  const scoreClass =
    score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-[#E4002B]";

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#111]">
      <main className="mx-auto max-w-[1540px] px-5 py-7 sm:px-7 lg:px-10 lg:py-9">

        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-5 border-b border-black/10 pb-7 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E4002B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E4002B]" />
              Governance / Security posture
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Security audit</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/50 sm:text-base">
              A live assessment of security controls, findings and environmental risk.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={openPdfReport}
              disabled={!audit}
              className="inline-flex h-11 items-center gap-2 border border-black/15 bg-white px-4 text-sm font-medium transition hover:bg-black hover:text-white disabled:opacity-40"
            >
              <FileText size={16} /> PDF report
            </button>
            <button
              onClick={runAudit}
              disabled={running}
              className="inline-flex h-11 items-center gap-2 bg-[#E4002B] px-5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
            >
              <Play size={16} fill="currentColor" />
              {running ? "Running audit..." : "Run audit"}
            </button>
          </div>
        </motion.header>

        {error && <div className="mb-5"><Notice tone="error" onDismiss={() => setError("")}>{error}</Notice></div>}
        {successMessage && <div className="mb-5"><Notice tone="success" onDismiss={() => setSuccessMessage("")}>{successMessage}</Notice></div>}

        <section className="mb-6 border border-black/10 bg-white">
          <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-end lg:justify-between lg:p-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">Audit command</p>
              <h2 className="mt-1 text-xl font-semibold">Start a new assessment</h2>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-[760px] lg:grid-cols-[180px_1fr_auto]">
              <label>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">Trigger</span>
                <Select value={selectedTrigger} onChange={(e) => setSelectedTrigger(e.target.value)}>
                  <option value="MANUAL">MANUAL</option>
                  {triggers.map((trigger, i) => {
                    const value = typeof trigger === "string"
                      ? trigger
                      : trigger?.trigger_type || trigger?.name || trigger?.value;
                    if (!value || value === "MANUAL") return null;
                    return <option key={`${value}-${i}`} value={value}>{value}</option>;
                  })}
                </Select>
              </label>

              <label>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">Generated by</span>
                <input
                  value={generatedBy}
                  onChange={(e) => setGeneratedBy(e.target.value)}
                  className="h-9 w-full border border-black/12 bg-[#FAFAF8] px-3 text-sm outline-none focus:border-[#E4002B]"
                />
              </label>

              <button
                onClick={runAudit}
                disabled={running}
                className="h-9 bg-black px-5 text-sm font-semibold text-white hover:bg-[#E4002B] disabled:opacity-50"
              >
                {running ? "Scanning..." : "Start scan"}
              </button>
            </div>
          </div>

          {running && (
            <motion.div
              className="h-1 bg-[#E4002B]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
            />
          )}
        </section>

        {loading && !audit ? (
          <div className="border border-black/10 bg-white p-8">
            <LoadingState label="Loading audit history" rows={4} />
          </div>
        ) : !audit ? (
          <div className="border border-black/10 bg-white p-12 text-center">
            <ScrollText size={30} className="mx-auto mb-4 text-black/25" />
            <h2 className="text-2xl font-semibold">No audit has been generated yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/45">
              Run an assessment to evaluate the environment and generate the first posture report.
            </p>
          </div>
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative mb-6 overflow-hidden border border-black/10 bg-white"
            >
              <div className="absolute right-0 top-0 h-full w-1 bg-[#E4002B]" />
              <div className="grid lg:grid-cols-[1.05fr_1fr]">

                <div className="border-b border-black/8 p-5 sm:p-6 lg:border-b-0 lg:border-r lg:p-10">
                  <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
                    <ScoreCircle score={score} tone={scoreClass} />

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                        Overall security posture
                      </p>
                      <h2 className={`mt-2 text-3xl font-semibold tracking-[-0.04em] ${scoreClass}`}>
                        {posture}
                      </h2>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="border border-black/10 bg-[#F7F7F5] px-2.5 py-1 text-[10px] font-semibold">
                          GRADE {grade}
                        </span>
                        <span className="text-xs font-semibold text-black/40">
                          {formatDate(audit?.completed_at || audit?.created_at)}
                        </span>
                      </div>
                      <p className="mt-5 max-w-md text-sm leading-6 text-black/50">
                        {audit?.audit_name || "Latest environment security assessment"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 lg:p-10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">Audit signals</p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight">What needs attention</h3>

                  <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                    <Metric value={criticalFindings.length} label="Critical" danger={criticalFindings.length > 0} />
                    <Metric value={warnings.length} label="Warnings" danger={warnings.length > 0} />
                    <Metric value={passedChecks.length} label="Passed" />
                    <Metric value={audit?.assets_at_risk ?? "—"} label="Assets at risk" danger={Number(audit?.assets_at_risk) > 0} />
                  </div>

                  <div className="mt-8 border-t border-black/8 pt-5">
                    <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.14em]">
                      <span className="text-black/40">Checks executed</span>
                      <span>{checks.length}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-black/6">
                      <motion.div
                        className={`h-full ${score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-[#E4002B]"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${checks.length ? Math.min(100, passedChecks.length / checks.length * 100) : 0}%` }}
                        transition={{ duration: 0.9 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            <Section title="Control health" eyebrow="Security controls" description="Module-level scores returned by this audit.">
              {moduleScores.length ? (
                <div className="grid gap-x-10 gap-y-7 md:grid-cols-2">
                  {moduleScores.map((module, i) => (
                    <ScoreBar key={module.name || i} label={module.name || `Module ${i + 1}`} score={module.score} delay={i * 0.05} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-black/45">No module breakdown was returned.</p>
              )}
            </Section>

            {audit?.ai_summary && (
              <section className="relative mb-6 overflow-hidden border border-black/10 bg-black text-white">
                <div className="absolute left-0 top-0 h-full w-1 bg-[#E4002B]" />
                <div className="p-5 sm:p-6 lg:p-10">
                  <div className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#E4002B] text-[10px] font-semibold">AI</span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">SAOM AI assessment</p>
                      <h2 className="mt-1 text-2xl font-semibold">What the audit found</h2>
                    </div>
                  </div>
                  <p className="mt-6 max-w-5xl text-base leading-8 text-white/75">{audit.ai_summary}</p>
                </div>
              </section>
            )}

            <div className="mb-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <Findings title="Critical findings" eyebrow="Threat surface" items={criticalFindings} critical />
              <Findings title="Warnings" eyebrow="Review queue" items={warnings} />
            </div>

            <Section title="Recommendations" eyebrow="Next actions" description="Prioritised actions returned by the audit.">
              {recommendations.length ? (
                <div className="-mx-6 sm:-mx-8">
                  {recommendations.map((item, i) => (
                    <div key={i} className="flex gap-5 border-t border-black/8 p-5 sm:p-6">
                      <span className="text-sm font-semibold text-[#E4002B]">{String(i + 1).padStart(2, "0")}</span>
                      <p className="text-sm font-semibold leading-6 text-black/70">{toText(item, "Recommendation")}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-black/45">This audit returned no recommendations.</p>
              )}
            </Section>

            <Section title="Audit checks" eyebrow="Verification" description={`${checks.length} controls evaluated in this run.`}>
              {checks.length ? (
                <div className="-mx-6 overflow-x-auto sm:-mx-8">
                  <Table columns={[
                    { key: "check", label: "Control" },
                    { key: "status", label: "Status" },
                    { key: "severity", label: "Severity" },
                    { key: "details", label: "Details" },
                  ]}>
                    {checks.map((check, i) => (
                      <tr key={i} className="border-b border-black/6 transition hover:bg-[#FAFAF8]">
                        <Cell className="font-medium text-black">
                          {check?.name || check?.check_name || `Check ${i + 1}`}
                        </Cell>
                        <Cell><StatusBadge status={check?.status || "unknown"}>{check?.status || "—"}</StatusBadge></Cell>
                        <Cell className="font-semibold text-black/50">{check?.severity || "—"}</Cell>
                        <Cell className="max-w-[520px] text-black/50">
                          {check?.details || check?.description || check?.message || "—"}
                        </Cell>
                      </tr>
                    ))}
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-black/45">This audit returned no individual checks.</p>
              )}
            </Section>

            {passedChecks.length > 0 && (
              <Section title="Passed controls" eyebrow="Verified" description={`${passedChecks.length} controls cleared by the audit.`}>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {passedChecks.map((item, i) => (
                    <div key={i} className="flex gap-3 border border-emerald-200 bg-emerald-50/50 p-3 text-sm font-semibold text-emerald-800">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                      {toText(item, "Passed check")}
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}

        <Section title="Previous assessments" eyebrow="Audit trail" description={`${history.length} previous audit${history.length === 1 ? "" : "s"} available.`}>
          {history.length ? history.map((item, i) => {
            const id = item?.audit_id || item?._id || item?.id || i;
            const current = currentId && currentId === id;
            return (
              <button
                key={id}
                onClick={() => selectAudit(item)}
                className={`flex w-full items-center gap-4 border-t border-black/8 p-5 text-left transition hover:bg-[#FAFAF8] sm:p-6 ${current ? "bg-[#FFF7F8]" : ""}`}
              >
                <span className={`h-3 w-3 shrink-0 rounded-full ${current ? "bg-[#E4002B] shadow-[0_0_0_5px_rgba(228,0,43,0.1)]" : "bg-black/15"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{item?.audit_name || item?.name || "Security audit"}</span>
                  <span className="mt-1 block text-xs text-black/40">{formatDate(item?.created_at || item?.createdAt)}</span>
                </span>
                <span className="text-right">
                  <span className="block text-lg font-semibold">{item?.overall_score ?? item?.score ?? "—"}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-black/35">score</span>
                </span>
                {current && <span className="hidden border border-[#E4002B]/20 bg-[#FFF1F3] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#E4002B] sm:block">Viewing</span>}
              </button>
            );
          }) : <p className="text-sm text-black/45">No previous audits are available.</p>}
        </Section>
      </main>
    </div>
  );
}

function ScoreCircle({ score, tone }) {
  const radius = 79;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, Number(score) || 0));

  return (
    <div className="relative h-[180px] w-[180px] shrink-0">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(0,0,0,.07)" strokeWidth="9" />
        <motion.circle
          cx="90" cy="90" r={radius} fill="none" stroke="currentColor" strokeWidth="9"
          strokeLinecap="butt" className={tone}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - safe / 100) }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-semibold tracking-[-0.06em]">
          {Math.round(safe)}
        </motion.span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/35">out of 100</span>
      </div>
    </div>
  );
}

function Metric({ value, label, danger }) {
  const numeric = Number(value);
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`text-2xl font-semibold tracking-[-0.04em] ${danger ? "text-[#E4002B]" : "text-black"}`}>
        {Number.isFinite(numeric) ? Math.round(numeric) : value}
      </motion.div>
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-black/40">{label}</p>
    </div>
  );
}

function ScoreBar({ label, score, delay }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const bar = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-[#E4002B]";
  const text = value >= 80 ? "text-emerald-600" : value >= 60 ? "text-amber-600" : "text-[#E4002B]";

  return (
    <div>
      <div className="mb-2 flex justify-between gap-4">
        <span className="truncate text-sm font-medium capitalize text-black/70">{String(label).replaceAll("_", " ")}</span>
        <span className={`text-lg font-semibold tabular-nums ${text}`}>{value}</span>
      </div>
      <div className="h-2 overflow-hidden bg-black/6">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full ${bar}`}
        />
      </div>
    </div>
  );
}

function Section({ eyebrow, title, description, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.4 }}
      className="mb-6 border border-black/10 bg-white p-5 sm:p-6"
    >
      <div className="mb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-semibold tracking-[-0.01em]">{title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-black/45">{description}</p>
      </div>
      {children}
    </motion.section>
  );
}

function Findings({ eyebrow, title, items, critical }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.4 }}
      className="border border-black/10 bg-white"
    >
      <div className="p-5 sm:p-6">
        <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${critical ? "text-[#E4002B]" : "text-black/40"}`}>{eyebrow}</p>
        <h2 className="mt-1 text-lg font-semibold tracking-[-0.01em]">{title}</h2>
        <p className="mt-1.5 text-sm text-black/45">{items.length} item{items.length === 1 ? "" : "s"} reported.</p>
      </div>

      <div className="border-t border-black/8">
        {items.length ? items.map((item, i) => (
          <div key={i} className="flex gap-4 border-b border-black/8 p-5 last:border-b-0 sm:p-6">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center border text-xs font-semibold ${critical ? "border-[#E4002B]/25 bg-[#FFF1F3] text-[#E4002B]" : "border-amber-200 bg-amber-50 text-amber-600"}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${critical ? "text-[#E4002B]" : "text-amber-600"}`}>
                {critical ? "Critical" : "Warning"}
              </div>
              <p className="text-sm font-semibold leading-6 text-black/70">{toText(item, critical ? "Critical finding" : "Warning")}</p>
            </div>
          </div>
        )) : (
          <div className="p-6 text-sm font-semibold text-emerald-700">
            {critical ? "No critical findings were reported." : "No warnings were reported."}
          </div>
        )}
      </div>
    </motion.section>
  );
}
