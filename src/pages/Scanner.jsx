
import { useState } from "react";
import { scanEnvironment } from "../services/dashboardApi";

function unwrap(response) {
  return response?.data?.data || response?.data || response || {};
}

function Stat({ label, value, tone = "text-white" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <p className={`mt-3 text-3xl font-semibold ${tone}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}

export default function Scanner() {
  const [simulateThreats, setSimulateThreats] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleScan() {
    setLoading(true);
    setError("");

    try {
      const response = await scanEnvironment(simulateThreats);
      setResult(unwrap(response));
    } catch (err) {
      setError(err?.message || "Environment scan failed.");
    } finally {
      setLoading(false);
    }
  }

  const findings = Array.isArray(result?.findings)
    ? result.findings
    : [];

  const status = result?.status || "NOT_SCANNED";

  return (
    <main className="min-h-screen bg-[#05080d] px-6 py-8 text-slate-100 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400">
              SAOM-AI / Scanner
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Environment Scanner
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Scan monitored assets and surface security findings.
            </p>
          </div>

          <button
            onClick={handleScan}
            disabled={loading}
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Scanning…" : "Start Scan"}
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <p className="text-sm font-semibold">Simulation mode</p>

            <p className="mt-1 text-xs text-slate-500">
              Use simulated threats for safe demonstrations.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={simulateThreats}
              onChange={(event) =>
                setSimulateThreats(event.target.checked)
              }
              className="h-4 w-4 accent-cyan-400"
            />

            Simulate threats
          </label>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Scan status"
            value={status.replaceAll("_", " ")}
            tone={
              status === "SECURE"
                ? "text-emerald-300"
                : "text-amber-300"
            }
          />

          <Stat
            label="Assets scanned"
            value={result?.assets_scanned}
          />

          <Stat
            label="Threats found"
            value={result?.threats_found}
            tone={
              Number(result?.threats_found) > 0
                ? "text-red-300"
                : "text-emerald-300"
            }
          />

          <Stat
            label="Findings"
            value={findings.length}
          />
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-200">
            Scan findings
          </h2>

          {!result ? (
            <p className="mt-5 text-sm text-slate-500">
              Run a scan to view environment findings.
            </p>
          ) : findings.length === 0 ? (
            <p className="mt-5 text-sm text-emerald-300">
              No findings were returned by this scan.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {findings.map((finding, index) => (
                <div
                  key={finding.event_id || finding.id || index}
                  className="rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-200">
                      {finding.attack_type ||
                        finding.type ||
                        "Security finding"}
                    </p>

                    <span className="text-xs text-cyan-300">
                      {finding.hostname ||
                        finding.asset_id ||
                        "Unknown asset"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Source: {finding.source_ip || "—"} → Destination:{" "}
                    {finding.destination_ip ||
                      finding.destination ||
                      "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}