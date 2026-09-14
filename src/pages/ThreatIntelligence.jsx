import { useMemo, useState } from "react";

const INDICATORS = [
  {
    id: "TI-001",
    value: "185.220.101.45",
    type: "IP Address",
    threat: "Command and Control",
    severity: "Critical",
    confidence: 98,
    source: "Threat Intelligence Feed",
    firstSeen: "Today, 10:24 AM",
    lastSeen: "2 minutes ago",
    status: "Active",
    description:
      "Known malicious IP associated with command-and-control infrastructure and suspicious outbound traffic.",
  },
  {
    id: "TI-002",
    value: "login-security-check.com",
    type: "Domain",
    threat: "Phishing",
    severity: "High",
    confidence: 94,
    source: "External Intelligence",
    firstSeen: "Today, 09:42 AM",
    lastSeen: "14 minutes ago",
    status: "Active",
    description:
      "Suspicious domain impersonating an authentication portal and potentially collecting user credentials.",
  },
  {
    id: "TI-003",
    value: "44d88612fea8a8f36de82e1278abb02f",
    type: "File Hash",
    threat: "Malware",
    severity: "High",
    confidence: 91,
    source: "Malware Database",
    firstSeen: "Yesterday",
    lastSeen: "28 minutes ago",
    status: "Active",
    description:
      "File hash associated with a known malware sample detected in external intelligence sources.",
  },
  {
    id: "TI-004",
    value: "203.0.113.77",
    type: "IP Address",
    threat: "Port Scanning",
    severity: "Medium",
    confidence: 82,
    source: "Network Sensor",
    firstSeen: "Yesterday",
    lastSeen: "42 minutes ago",
    status: "Investigating",
    description:
      "External IP observed scanning multiple ports across monitored infrastructure.",
  },
  {
    id: "TI-005",
    value: "update-system-service.net",
    type: "Domain",
    threat: "Suspicious Infrastructure",
    severity: "Medium",
    confidence: 79,
    source: "Domain Reputation Feed",
    firstSeen: "2 days ago",
    lastSeen: "1 hour ago",
    status: "Active",
    description:
      "Recently registered domain with suspicious naming patterns and low reputation.",
  },
  {
    id: "TI-006",
    value: "eicar-test-file-signature",
    type: "File Hash",
    threat: "Test Detection",
    severity: "Low",
    confidence: 99,
    source: "Internal Security Test",
    firstSeen: "3 days ago",
    lastSeen: "3 hours ago",
    status: "Resolved",
    description:
      "Controlled security testing indicator used to verify detection and alerting workflows.",
  },
];

const SEVERITY_STYLES = {
  Critical: {
    text: "text-red-300",
    border: "border-red-400/30",
    background: "bg-red-400/10",
    dot: "bg-red-400",
  },
  High: {
    text: "text-orange-300",
    border: "border-orange-400/30",
    background: "bg-orange-400/10",
    dot: "bg-orange-400",
  },
  Medium: {
    text: "text-yellow-300",
    border: "border-yellow-400/30",
    background: "bg-yellow-400/10",
    dot: "bg-yellow-400",
  },
  Low: {
    text: "text-emerald-300",
    border: "border-emerald-400/30",
    background: "bg-emerald-400/10",
    dot: "bg-emerald-400",
  },
};

function SeverityBadge({ severity }) {
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low;

  return (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${style.border} ${style.background} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {severity}
    </span>
  );
}

function TypeBadge({ type }) {
  return (
    <span className="inline-flex border border-cyan-400/20 bg-cyan-400/[0.06] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
      {type}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Active: "border-red-400/20 bg-red-400/10 text-red-300",
    Investigating: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    Resolved: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  };

  return (
    <span
      className={`inline-flex border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
        styles[status] || styles.Active
      }`}
    >
      {status}
    </span>
  );
}

function SummaryCard({ label, value, description, accent }) {
  return (
    <article className="border border-white/[0.08] bg-[#080e15] p-5">
      <div className={`mb-4 h-1 w-10 ${accent}`} />

      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-100">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </article>
  );
}

export default function ThreatIntelligence() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [copiedIndicator, setCopiedIndicator] = useState("");

  const summary = useMemo(() => {
    return {
      total: INDICATORS.length,
      active: INDICATORS.filter((item) => item.status === "Active").length,
      critical: INDICATORS.filter((item) => item.severity === "Critical")
        .length,
      highConfidence: INDICATORS.filter((item) => item.confidence >= 90).length,
    };
  }, []);

  const filteredIndicators = useMemo(() => {
    return INDICATORS.filter((indicator) => {
      const searchableText = [
        indicator.id,
        indicator.value,
        indicator.type,
        indicator.threat,
        indicator.source,
        indicator.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(search.toLowerCase());

      const matchesType =
        typeFilter === "All" || indicator.type === typeFilter;

      const matchesSeverity =
        severityFilter === "All" || indicator.severity === severityFilter;

      return matchesSearch && matchesType && matchesSeverity;
    });
  }, [search, typeFilter, severityFilter]);

  async function handleCopy(value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndicator(value);

      window.setTimeout(() => {
        setCopiedIndicator("");
      }, 1800);
    } catch {
      setCopiedIndicator("");
    }
  }

  function resetFilters() {
    setSearch("");
    setTypeFilter("All");
    setSeverityFilter("All");
  }

  return (
    <main className="min-h-screen space-y-6 bg-[#05080d] px-6 py-6 text-slate-200">
      {/* HEADER */}
      <section className="flex flex-col justify-between gap-5 border-b border-white/[0.06] pb-6 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-400/70">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Security Operations / Threat Intelligence
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
            Threat Intelligence
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Discover, review and investigate indicators of compromise from
            connected intelligence sources.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start border border-emerald-400/20 bg-emerald-400/[0.04] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-emerald-400 lg:self-auto">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Intelligence Feed Online
        </div>
      </section>

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Indicators"
          value={summary.total}
          description="Collected intelligence indicators"
          accent="bg-cyan-400"
        />

        <SummaryCard
          label="Active Indicators"
          value={summary.active}
          description="Currently requiring attention"
          accent="bg-red-400"
        />

        <SummaryCard
          label="Critical Indicators"
          value={summary.critical}
          description="Highest-priority threat signals"
          accent="bg-orange-400"
        />

        <SummaryCard
          label="High Confidence"
          value={summary.highConfidence}
          description="Indicators with confidence above 90%"
          accent="bg-emerald-400"
        />
      </section>

      {/* REGISTRY */}
      <section className="border border-white/[0.08] bg-[#080e15]">
        <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] p-5 xl:flex-row xl:items-center">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400/70">
              Intelligence Registry
            </p>

            <h2 className="mt-2 text-lg font-semibold text-slate-100">
              Indicators of Compromise
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Review malicious IPs, domains, file hashes and threat metadata.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              {filteredIndicators.length} Results
            </span>

            <button
              type="button"
              onClick={resetFilters}
              className="border border-white/[0.1] px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-300"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 gap-3 border-b border-white/[0.07] p-5 md:grid-cols-3">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search indicator, source, threat..."
            className="border border-white/[0.1] bg-[#050a10] px-4 py-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
          />

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="border border-white/[0.1] bg-[#050a10] px-4 py-3 text-xs text-slate-300 outline-none focus:border-cyan-400/50"
          >
            <option value="All">All Indicator Types</option>
            <option value="IP Address">IP Address</option>
            <option value="Domain">Domain</option>
            <option value="File Hash">File Hash</option>
          </select>

          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
            className="border border-white/[0.1] bg-[#050a10] px-4 py-3 text-xs text-slate-300 outline-none focus:border-cyan-400/50"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.015]">
                <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Indicator
                </th>

                <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Type
                </th>

                <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Threat
                </th>

                <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Severity
                </th>

                <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Confidence
                </th>

                <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Source
                </th>

                <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredIndicators.map((indicator) => (
                <tr
                  key={indicator.id}
                  className="border-b border-white/[0.06] transition hover:bg-cyan-400/[0.025]"
                >
                  <td className="px-5 py-5">
                    <div className="max-w-[260px]">
                      <p className="text-[10px] font-bold tracking-wider text-cyan-400/70">
                        {indicator.id}
                      </p>

                      <p className="mt-2 break-all font-mono text-xs text-slate-200">
                        {indicator.value}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-5">
                    <TypeBadge type={indicator.type} />
                  </td>

                  <td className="px-5 py-5 text-xs text-slate-400">
                    {indicator.threat}
                  </td>

                  <td className="px-5 py-5">
                    <SeverityBadge severity={indicator.severity} />
                  </td>

                  <td className="px-5 py-5">
                    <div className="w-24">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-300">
                          {indicator.confidence}%
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden bg-white/[0.08]">
                        <div
                          className="h-full bg-cyan-400"
                          style={{ width: `${indicator.confidence}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-5 text-xs text-slate-500">
                    {indicator.source}
                  </td>

                  <td className="px-5 py-5">
                    <StatusBadge status={indicator.status} />
                  </td>

                  <td className="px-5 py-5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedIndicator(indicator)}
                      className="border border-white/[0.1] px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.04] hover:text-cyan-300"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredIndicators.length === 0 && (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-medium text-slate-300">
              No indicators found
            </p>

            <p className="mt-2 text-xs text-slate-600">
              Try changing your search or filter selection.
            </p>
          </div>
        )}
      </section>

      {/* DETAILS MODAL */}
      {selectedIndicator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-2xl border border-white/[0.1] bg-[#080e15]">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400/70">
                  Indicator Details
                </p>

                <h2 className="mt-2 text-xl font-semibold text-slate-100">
                  {selectedIndicator.id}
                </h2>

                <p className="mt-2 break-all font-mono text-xs text-slate-400">
                  {selectedIndicator.value}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIndicator(null)}
                className="text-xl text-slate-500 transition hover:text-white"
                aria-label="Close indicator details"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Indicator Value
                </p>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="break-all font-mono text-sm text-slate-200">
                    {selectedIndicator.value}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleCopy(selectedIndicator.value)}
                    className="self-start border border-cyan-400/30 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-400/[0.08]"
                  >
                    {copiedIndicator === selectedIndicator.value
                      ? "Copied"
                      : "Copy Indicator"}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Type
                </p>

                <div className="mt-2">
                  <TypeBadge type={selectedIndicator.type} />
                </div>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Threat Category
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {selectedIndicator.threat}
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Severity
                </p>

                <div className="mt-2">
                  <SeverityBadge severity={selectedIndicator.severity} />
                </div>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Confidence
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {selectedIndicator.confidence}%
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Source
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {selectedIndicator.source}
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Status
                </p>

                <div className="mt-2">
                  <StatusBadge status={selectedIndicator.status} />
                </div>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  First Seen
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {selectedIndicator.firstSeen}
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Last Seen
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {selectedIndicator.lastSeen}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Intelligence Description
                </p>

                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {selectedIndicator.description}
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-white/[0.08] p-5">
              <button
                type="button"
                onClick={() => setSelectedIndicator(null)}
                className="border border-cyan-400/30 bg-cyan-400/[0.06] px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-400/[0.12]"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}