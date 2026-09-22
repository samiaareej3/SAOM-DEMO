 import { useState } from "react";

import { Play, Radar, ShieldCheck } from "lucide-react";

import { scanEnvironment } from "../services/dashboardApi";

import {
  AppShell,
  Badge,
  Button,
  Card,
  EmptyState,
  InfoRow,
  Notice,
  PageHeader,
  Panel,
  SeverityBadge,
  SeverityBar,
  StatCard,
  severityTone,
} from "../components/ui";

/* Unchanged — the scanner response shape varies by backend build. */
function unwrap(response) {
  return response?.data?.data || response?.data || response || {};
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

  /* --------- severity mix of the findings this scan actually returned --- */

  const severityCounts = findings.reduce(
    (counts, finding) => {
      const label = severityTone(
        finding.severity || finding.risk_level || finding.riskLevel || "High"
      ).label;

      if (counts[label] !== undefined) counts[label] += 1;

      return counts;
    },
    { Critical: 0, High: 0, Medium: 0, Low: 0 }
  );

  const statusLabel = String(status).replaceAll("_", " ").toLowerCase();

  return (
    <AppShell connected={!error}>
      <PageHeader
        breadcrumb="Analysis"
        title="Environment scanner"
        description="Sweep monitored assets for active attack behaviour and record what the collector finds."
        status={
          <Badge
            tone={
              status === "SECURE"
                ? "emerald"
                : status === "NOT_SCANNED"
                  ? "slate"
                  : "indigo"
            }
          >
            {result ? statusLabel : "No scan run yet"}
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            icon={Play}
            loading={loading}
            onClick={handleScan}
            disabled={loading}
          >
            {loading ? "Scanning" : "Start scan"}
          </Button>
        }
      />

      <div className="mx-auto max-w-[1600px] space-y-4 px-5 py-6 lg:px-8">
        {error && <Notice tone="error">{error}</Notice>}

        {/* ------------------------------------------------ scan controls */}

        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Simulation mode
            </p>

            <p className="mt-1 max-w-[62ch] text-sm leading-6 text-slate-500">
              Generates simulated attack traffic so the pipeline can be
              demonstrated safely. Turn it off to scan live telemetry only.
            </p>
          </div>

          <label className="inline-flex shrink-0 cursor-pointer items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={simulateThreats}
              onChange={(event) =>
                setSimulateThreats(event.target.checked)
              }
              className="h-4 w-4 rounded border-slate-300 accent-[#ED1C2E]"
            />

            Simulate threats
          </label>
        </Card>

        {/* --------------------------------------------------- scan result */}

        {loading && (
          <Card className="overflow-hidden p-0">
            <div className="h-0.5 w-full overflow-hidden bg-slate-100">
              <div className="h-full w-full animate-pulse bg-[#ED1C2E]" />
            </div>

            <p className="px-5 py-4 text-sm text-slate-600">
              Sweeping monitored assets. Results appear as soon as the backend
              returns them.
            </p>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Threats found"
            value={result ? threatsFound : "—"}
            tone={Number(threatsFound) > 0 && result ? "critical" : "good"}
            emphasis
            hint={
              result
                ? Number(threatsFound) > 0
                  ? "Raised as alerts in the backend"
                  : "Nothing detected in this sweep"
                : "Run a scan to populate"
            }
          />

          <StatCard
            label="Assets scanned"
            value={assetsScanned}
            tone="brand"
            hint="Reached by the collector"
          />

          <StatCard
            label="Findings recorded"
            value={result ? findings.length : "—"}
            hint="Individual detections"
          />

          <StatCard
            label="Scan status"
            value={result ? statusLabel : "Not scanned"}
            tone={status === "SECURE" ? "good" : result ? "brand" : "neutral"}
            hint="Reported by the scanner service"
          />
        </div>

        {result && findings.length > 0 && (
          <Panel title="Severity of this scan">
            <SeverityBar counts={severityCounts} />
          </Panel>
        )}

        <Panel
          title="Findings"
          hint={result ? `${findings.length} returned by the last scan` : undefined}
        >
          {!result ? (
            <EmptyState
              icon={Radar}
              title="No scan has been run in this session"
              description="Start a scan to sweep monitored assets. Results, severity and affected hosts appear here."
              action={
                <Button variant="primary" icon={Play} onClick={handleScan}>
                  Start scan
                </Button>
              }
            />
          ) : findings.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No findings in this sweep"
              description="The scanner completed without returning security findings for the monitored assets."
            />
          ) : (
            <div className="space-y-3">
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

                const tone = severityTone(severity);

                return (
                  <article
                    key={finding.event_id || finding.id || index}
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <span
                      className={`absolute inset-y-0 left-0 w-[3px] ${tone.spine}`}
                      aria-hidden="true"
                    />

                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-medium text-slate-900">
                          {attackType}
                        </h3>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Affected asset: {hostname}
                        </p>
                      </div>

                      <SeverityBadge severity={tone.label} />
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {description}
                    </p>

                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-mono text-slate-900">
                          {sourceIp}
                        </span>

                        <span className="h-px flex-1 bg-slate-300" />

                        <span className="font-mono text-slate-900">
                          {destinationIp}
                        </span>
                      </div>

                      <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                        <span>Source</span>

                        <span>Destination</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Panel>

        {result && (
          <Panel title="Scan record">
            <InfoRow label="Status" value={statusLabel} />

            <InfoRow label="Assets scanned" value={String(assetsScanned)} />

            <InfoRow label="Threats found" value={String(threatsFound)} />

            <InfoRow
              label="Simulation"
              value={simulateThreats ? "Enabled" : "Disabled"}
            />
          </Panel>
        )}
      </div>
    </AppShell>
  );
}