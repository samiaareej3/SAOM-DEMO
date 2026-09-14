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
      const scanResult = unwrap(response);

      let finalResult = scanResult;

      // Get the latest saved scan result from the backend.
      try {
        const latestResponse = await fetch(
          "http://localhost:5000/api/scanner/latest"
        );

        if (latestResponse.ok) {
          const latestData = await latestResponse.json();
          const latestResult = unwrap(latestData);

          if (latestResult && Object.keys(latestResult).length > 0) {
            finalResult = latestResult;
          }
        }
      } catch (latestError) {
        console.warn("Could not fetch latest scan:", latestError);
      }

      setResult(finalResult);
    } catch (err) {
      setError(err?.message || "Environment scan failed.");
    } finally {
      setLoading(false);
    }
  }

  const findings = Array.isArray(result?.findings)
    ? result.findings
    : Array.isArray(result?.alerts)
      ? result.alerts
      : Array.isArray(result?.results)
        ? result.results
        : [];

  const status = result
    ? result.status ||
      result.scan_status ||
      result.scanStatus ||
      "SCANNED"
    : "NOT_SCANNED";

  const assetsScanned =
    result?.assets_scanned ??
    result?.assetsScanned ??
    result?.asset_count ??
    result?.assetCount ??
    result?.assets?.length ??
    result?.results?.length ??
    "—";

  const threatsFound =
    result?.threats_found ??
    result?.threatsFound ??
    result?.alerts_created ??
    result?.alertsCreated ??
    findings.length;

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
                : status === "SCANNED"
                  ? "text-cyan-300"
                  : "text-amber-300"
            }
          />

          <Stat
            label="Assets scanned"
            value={assetsScanned}
          />

          <Stat
            label="Threats found"
            value={threatsFound}
            tone={
              Number(threatsFound) > 0
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
              {findings.map((finding, index) => {
                const attackType =
                  finding.attack_type ||
                  finding.attackType ||
                  finding.type ||
                  finding.alert_type ||
                  "Security finding";

                const hostname =
                  finding.hostname ||
                  finding.asset_id ||
                  finding.assetId ||
                  finding.destination_host ||
                  "Unknown asset";

                const sourceIp =
                  finding.source_ip ||
                  finding.sourceIp ||
                  finding.source ||
                  "—";

                const destinationIp =
                  finding.destination_ip ||
                  finding.destinationIp ||
                  finding.destination ||
                  "—";

                const severity =
                  finding.severity ||
                  finding.risk_level ||
                  finding.riskLevel ||
                  "HIGH";

                const description =
                  finding.description ||
                  finding.message ||
                  finding.details ||
                  "Security activity detected during the environment scan.";

                return (
                  <div
                    key={finding.event_id || finding.id || index}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-200">
                        {attackType}
                      </p>

                      <span className="text-xs text-cyan-300">
                        {hostname}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Source: {sourceIp} → Destination: {destinationIp}
                    </p>

                    <p className="mt-2 text-xs font-semibold uppercase text-amber-300">
                      Severity: {severity}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}