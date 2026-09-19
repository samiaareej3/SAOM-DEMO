import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Check, Copy, FileSearch, Radar } from "lucide-react";

import { getAlerts } from "../services/dashboardApi";

import {
  AppShell,
  Badge,
  Button,
  Card,
  Cell,
  Donut,
  EmptyState,
  InfoRow,
  LoadingState,
  Notice,
  PALETTE,
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

/* =========================================================
   HELPERS  (unchanged — backend field mapping)
========================================================= */

function normalizeAlert(alert, index) {
  const severity = alert.severity || "Low";

  const sourceIp =
    alert.source_ip ||
    alert.sourceIp ||
    alert.ip_address ||
    alert.ip ||
    "Unknown";

  const attackType =
    alert.attack_type ||
    alert.attackType ||
    alert.title ||
    "Unknown Threat";

  const timestamp =
    alert.detection_timestamp ||
    alert.detected_at ||
    alert.createdAt ||
    alert.timestamp ||
    null;

  const status =
    alert.status ||
    (severity === "Critical" || severity === "High"
      ? "Active"
      : "Investigating");

  return {
    id: alert._id || alert.id || `TI-${String(index + 1).padStart(3, "0")}`,
    value: sourceIp,
    type: sourceIp.includes(".") ? "IP Address" : "Indicator",
    threat: attackType,
    severity,
    confidence:
      alert.confidence !== undefined
        ? Number(alert.confidence)
        : Math.min(99, Math.max(60, Number(alert.risk_score || 60))),
    source: alert.source || "SAOM-AI Detection Engine",
    firstSeen: timestamp
      ? new Date(timestamp).toLocaleString()
      : "Unknown",
    lastSeen: timestamp
      ? new Date(timestamp).toLocaleString()
      : "Unknown",
    status,
    description:
      alert.description ||
      `Threat detected by SAOM-AI for ${attackType}.`,
    rawAlert: alert,
  };
}

export default function ThreatIntelligence() {
  const navigate = useNavigate();

  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [copiedIndicator, setCopiedIndicator] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadThreatIntelligence() {
      try {
        setLoading(true);
        setError("");

        const response = await getAlerts();

        const alerts = Array.isArray(response)
          ? response
          : response?.alerts ||
            response?.data ||
            response?.results ||
            [];

        const normalizedIndicators = alerts.map(normalizeAlert);

        if (mounted) {
          setIndicators(normalizedIndicators);
        }
      } catch (err) {
        console.error("Threat intelligence loading failed:", err);

        if (mounted) {
          setError(
            err?.message || "Unable to load threat intelligence data."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadThreatIntelligence();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    return {
      total: indicators.length,
      active: indicators.filter((item) => item.status === "Active").length,
      critical: indicators.filter((item) => item.severity === "Critical")
        .length,
      highConfidence: indicators.filter((item) => item.confidence >= 90)
        .length,
    };
  }, [indicators]);

  const filteredIndicators = useMemo(() => {
    return indicators.filter((indicator) => {
      const searchableText = [
        indicator.id,
        indicator.value,
        indicator.type,
        indicator.threat,
        indicator.source,
        indicator.status,
        indicator.description,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(search.toLowerCase());

      const matchesType =
        typeFilter === "All" || indicator.type === typeFilter;

      const matchesSeverity =
        severityFilter === "All" ||
        indicator.severity === severityFilter;

      return matchesSearch && matchesType && matchesSeverity;
    });
  }, [indicators, search, typeFilter, severityFilter]);

  async function handleCopy(value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndicator(value);

      window.setTimeout(() => {
        setCopiedIndicator("");
      }, 1800);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  function resetFilters() {
    setSearch("");
    setTypeFilter("All");
    setSeverityFilter("All");
  }

  /* -------- derived views over the same normalized indicators ---------- */

  const indicatorTypes = useMemo(
    () => ["All", ...new Set(indicators.map((item) => item.type))],
    [indicators]
  );

  const severitySegments = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };

    indicators.forEach((item) => {
      const key = String(item.severity || "Low");

      if (counts[key] !== undefined) counts[key] += 1;
    });

    return [
      { label: "Critical", value: counts.Critical, color: PALETTE.critical },
      { label: "High", value: counts.High, color: PALETTE.high },
      { label: "Medium", value: counts.Medium, color: PALETTE.medium },
      { label: "Low", value: counts.Low, color: PALETTE.low },
    ];
  }, [indicators]);

  const topThreats = useMemo(() => {
    const tally = new Map();

    indicators.forEach((item) => {
      tally.set(item.threat, (tally.get(item.threat) || 0) + 1);
    });

    return [...tally.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
  }, [indicators]);

  const filtersActive =
    search !== "" || typeFilter !== "All" || severityFilter !== "All";

  return (
    <AppShell connected={!error}>
      <PageHeader
        breadcrumb="Analysis"
        title="Threat intelligence"
        description="Indicators extracted from detections, with confidence, first and last sighting, and the detection source."
        status={<Badge tone="slate">{summary.total} indicators</Badge>}
      />

      <div className="mx-auto max-w-[1600px] space-y-4 px-5 py-6 lg:px-8">
        {error && <Notice tone="error">{error}</Notice>}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Critical indicators"
            value={summary.critical}
            tone={summary.critical > 0 ? "critical" : "good"}
            emphasis
            hint="Block or contain first"
          />

          <StatCard
            label="Active"
            value={summary.active}
            tone={summary.active > 0 ? "high" : "good"}
            hint="Still observed in the environment"
          />

          <StatCard
            label="High confidence"
            value={summary.highConfidence}
            tone="brand"
            hint="Scored 90 or above"
          />

          <StatCard
            label="Total tracked"
            value={summary.total}
            hint="Across all detection sources"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Panel title="Severity distribution">
            {summary.total === 0 ? (
              <EmptyState
                title="Nothing to distribute yet"
                description="Indicators appear once the detection engine reports alerts."
              />
            ) : (
              <Donut
                segments={severitySegments}
                centerValue={summary.total}
                centerLabel="indicators"
              />
            )}
          </Panel>

          <Panel title="Most frequent threats" hint="By indicator count">
            {topThreats.length === 0 ? (
              <EmptyState
                title="No threat categories yet"
                description="Categories are grouped from the attack type on each detection."
              />
            ) : (
              <ul className="space-y-3">
                {topThreats.map((threat) => (
                  <li
                    key={threat.label}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="truncate text-sm text-slate-700">
                      {threat.label}
                    </span>

                    <span className="flex items-center gap-3">
                      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                        <span
                          className="block h-full rounded-full bg-indigo-500"
                          style={{
                            width: `${
                              (threat.value / topThreats[0].value) * 100
                            }%`,
                          }}
                        />
                      </span>

                      <span className="w-6 text-right text-sm font-semibold tabular-nums text-slate-900">
                        {threat.value}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* ---------------------------------------------------- filter bar */}

        <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search indicator, threat or source"
            className="lg:max-w-sm lg:flex-1"
          />

          <SegmentedControl
            value={severityFilter}
            onChange={setSeverityFilter}
            options={SEVERITIES}
          />

          <Select
            label="Indicator type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="lg:w-48"
          >
            {indicatorTypes.map((type) => (
              <option key={type} value={type}>
                {type === "All" ? "All types" : type}
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-3 lg:ml-auto">
            <span className="text-xs tabular-nums text-slate-500">
              {filteredIndicators.length} of {indicators.length}
            </span>

            {filtersActive && (
              <Button size="sm" variant="ghost" onClick={resetFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <Panel className="overflow-hidden">
          {loading ? (
            <LoadingState label="Loading indicators" rows={5} />
          ) : filteredIndicators.length === 0 ? (
            <EmptyState
              icon={Radar}
              title={
                indicators.length === 0
                  ? "No indicators available"
                  : "No indicators match these filters"
              }
              description={
                indicators.length === 0
                  ? "The alerts endpoint returned no detections to extract indicators from."
                  : "Try a broader severity or type filter."
              }
            />
          ) : (
            <div className="-m-5">
              <Table
                columns={[
                  { key: "spine", label: "", className: "w-[3px] p-0" },
                  { key: "indicator", label: "Indicator" },
                  { key: "threat", label: "Threat" },
                  { key: "severity", label: "Severity" },
                  { key: "confidence", label: "Confidence" },
                  { key: "status", label: "Status" },
                  { key: "seen", label: "Last seen", align: "right" },
                ]}
              >
                {filteredIndicators.map((indicator) => (
                  <SpineRow
                    key={indicator.id}
                    severity={indicator.severity}
                    selected={selectedIndicator?.id === indicator.id}
                    onClick={() => setSelectedIndicator(indicator)}
                  >
                    <Cell>
                      <p className="font-mono text-[13px] font-medium text-slate-900">
                        {indicator.value}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {indicator.type} · {indicator.source}
                      </p>
                    </Cell>

                    <Cell className="text-slate-700">{indicator.threat}</Cell>

                    <Cell>
                      <SeverityBadge severity={indicator.severity} />
                    </Cell>

                    <Cell>
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <span
                            className="block h-full rounded-full bg-slate-700"
                            style={{
                              width: `${Math.min(indicator.confidence, 100)}%`,
                            }}
                          />
                        </span>

                        <span className="text-xs tabular-nums text-slate-600">
                          {indicator.confidence}%
                        </span>
                      </span>
                    </Cell>

                    <Cell>
                      <StatusBadge status={indicator.status} />
                    </Cell>

                    <Cell className="text-right text-xs text-slate-500">
                      {indicator.lastSeen}
                    </Cell>
                  </SpineRow>
                ))}
              </Table>
            </div>
          )}
        </Panel>
      </div>

      <SidePanel
        open={Boolean(selectedIndicator)}
        onClose={() => setSelectedIndicator(null)}
        title={selectedIndicator?.value}
        subtitle={selectedIndicator?.threat}
        footer={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              icon={FileSearch}
              onClick={() =>
                navigate("/investigation", {
                  state: { incident: selectedIndicator?.rawAlert },
                })
              }
            >
              Investigate this indicator
            </Button>

            <Button
              icon={copiedIndicator === selectedIndicator?.value ? Check : Copy}
              onClick={() => handleCopy(selectedIndicator?.value)}
            >
              {copiedIndicator === selectedIndicator?.value
                ? "Copied"
                : "Copy value"}
            </Button>
          </div>
        }
      >
        {selectedIndicator && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={selectedIndicator.severity} />

              <StatusBadge status={selectedIndicator.status} />

              <Badge tone="indigo">{selectedIndicator.type}</Badge>
            </div>

            <p className="text-sm leading-6 text-slate-700">
              {selectedIndicator.description}
            </p>

            <Card className="p-4">
              <p className="text-xs text-slate-500">Confidence</p>

              <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                {selectedIndicator.confidence}%
              </p>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{
                    width: `${Math.min(selectedIndicator.confidence, 100)}%`,
                  }}
                />
              </div>
            </Card>

            <div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Sighting record
              </h3>

              <InfoRow label="Indicator ID" value={selectedIndicator.id} mono />

              <InfoRow label="Value" value={selectedIndicator.value} mono />

              <InfoRow label="Source" value={selectedIndicator.source} />

              <InfoRow label="First seen" value={selectedIndicator.firstSeen} />

              <InfoRow label="Last seen" value={selectedIndicator.lastSeen} />
            </div>
          </div>
        )}
      </SidePanel>
    </AppShell>
  );
}