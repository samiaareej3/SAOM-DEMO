import { useMemo, useState } from "react";

const ASSETS = [
  {
    id: "AST-001",
    name: "Production Web Server",
    hostname: "VM-WEB-01",
    type: "Virtual Machine",
    ip: "10.0.0.21",
    os: "Ubuntu 22.04",
    status: "Online",
    risk: "Low",
    lastHeartbeat: "12 seconds ago",
    location: "Production Cluster",
    description:
      "Primary production web server responsible for customer-facing services.",
  },
  {
    id: "AST-002",
    name: "Database Server",
    hostname: "VM-DB-01",
    type: "Virtual Machine",
    ip: "10.0.0.22",
    os: "Ubuntu 22.04",
    status: "Online",
    risk: "High",
    lastHeartbeat: "18 seconds ago",
    location: "Production Cluster",
    description:
      "Primary database server containing application and security data.",
  },
  {
    id: "AST-003",
    name: "Employee Workstation",
    hostname: "VM-EMP-01",
    type: "Workstation",
    ip: "192.168.1.24",
    os: "Windows 11",
    status: "Online",
    risk: "Critical",
    lastHeartbeat: "32 seconds ago",
    location: "Corporate Network",
    description:
      "Employee workstation with recent suspicious authentication activity.",
  },
  {
    id: "AST-004",
    name: "Security Monitoring Node",
    hostname: "SAOM-SENSOR-01",
    type: "Security Sensor",
    ip: "10.0.0.50",
    os: "Debian 12",
    status: "Online",
    risk: "Low",
    lastHeartbeat: "8 seconds ago",
    location: "Security Network",
    description:
      "Security telemetry collection and monitoring sensor.",
  },
  {
    id: "AST-005",
    name: "Development Machine",
    hostname: "DEV-PC-01",
    type: "Workstation",
    ip: "192.168.1.66",
    os: "Windows 10",
    status: "Offline",
    risk: "Medium",
    lastHeartbeat: "18 minutes ago",
    location: "Development Network",
    description:
      "Development workstation currently unavailable for monitoring.",
  },
  {
    id: "AST-006",
    name: "Internal API Server",
    hostname: "VM-API-01",
    type: "Virtual Machine",
    ip: "10.0.0.42",
    os: "Ubuntu 20.04",
    status: "Online",
    risk: "Medium",
    lastHeartbeat: "44 seconds ago",
    location: "Application Cluster",
    description:
      "Internal API service supporting application integrations.",
  },
];

const RISK_STYLES = {
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

const STATUS_STYLES = {
  Online: "text-emerald-300 border-emerald-400/20 bg-emerald-400/10",
  Offline: "text-red-300 border-red-400/20 bg-red-400/10",
};

function RiskBadge({ risk }) {
  const style = RISK_STYLES[risk] || RISK_STYLES.Low;

  return (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${style.border} ${style.background} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {risk}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
        STATUS_STYLES[status] || STATUS_STYLES.Offline
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "Online" ? "bg-emerald-400" : "bg-red-400"
        }`}
      />

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

export default function Infrastructure() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [selectedAsset, setSelectedAsset] = useState(null);

  const summary = useMemo(() => {
    return {
      total: ASSETS.length,
      online: ASSETS.filter((asset) => asset.status === "Online").length,
      offline: ASSETS.filter((asset) => asset.status === "Offline").length,
      critical: ASSETS.filter((asset) => asset.risk === "Critical").length,
    };
  }, []);

  const filteredAssets = useMemo(() => {
    return ASSETS.filter((asset) => {
      const searchableText = [
        asset.id,
        asset.name,
        asset.hostname,
        asset.type,
        asset.ip,
        asset.os,
        asset.location,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || asset.status === statusFilter;

      const matchesRisk = riskFilter === "All" || asset.risk === riskFilter;

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [search, statusFilter, riskFilter]);

  return (
    <main className="min-h-screen space-y-6 bg-[#05080d] px-6 py-6 text-slate-200">
      {/* HEADER */}
      <section className="flex flex-col justify-between gap-5 border-b border-white/[0.06] pb-6 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-400/70">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Security Operations / Infrastructure
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
            Infrastructure
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Monitor infrastructure health, asset availability and risk across
            your connected environment.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start border border-emerald-400/20 bg-emerald-400/[0.04] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-emerald-400 lg:self-auto">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Asset Monitoring Active
        </div>
      </section>

      {/* SUMMARY */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Assets"
          value={summary.total}
          description="Registered monitored assets"
          accent="bg-cyan-400"
        />

        <SummaryCard
          label="Online Assets"
          value={summary.online}
          description="Currently responding"
          accent="bg-emerald-400"
        />

        <SummaryCard
          label="Offline Assets"
          value={summary.offline}
          description="Not responding to heartbeat"
          accent="bg-red-400"
        />

        <SummaryCard
          label="Critical Risk"
          value={summary.critical}
          description="Assets requiring attention"
          accent="bg-orange-400"
        />
      </section>

      {/* ASSET REGISTRY */}
      <section className="border border-white/[0.08] bg-[#080e15]">
        <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] p-5 xl:flex-row xl:items-center">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400/70">
              Asset Registry
            </p>

            <h2 className="mt-2 text-lg font-semibold text-slate-100">
              Monitored Infrastructure
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Review connected systems, health status and risk levels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              {filteredAssets.length} Results
            </span>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setRiskFilter("All");
              }}
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
            placeholder="Search asset, hostname, IP..."
            className="border border-white/[0.1] bg-[#050a10] px-4 py-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-white/[0.1] bg-[#050a10] px-4 py-3 text-xs text-slate-300 outline-none focus:border-cyan-400/50"
          >
            <option value="All">All Statuses</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>

          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
            className="border border-white/[0.1] bg-[#050a10] px-4 py-3 text-xs text-slate-300 outline-none focus:border-cyan-400/50"
          >
            <option value="All">All Risk Levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.015]">
                <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Asset
                </th>

                <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Type
                </th>

                <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  IP Address
                </th>

                <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Operating System
                </th>

                <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Status
                </th>

                <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Risk
                </th>

                <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Heartbeat
                </th>

                <th className="px-5 py-4 text-right text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAssets.map((asset) => (
                <tr
                  key={asset.id}
                  className="border-b border-white/[0.06] transition hover:bg-cyan-400/[0.025]"
                >
                  <td className="px-5 py-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-cyan-400/20 bg-cyan-400/[0.04] text-xs text-cyan-300">
                        ▣
                      </div>

                      <div>
                        <p className="text-[10px] font-bold tracking-wider text-cyan-400/70">
                          {asset.id}
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-200">
                          {asset.name}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-600">
                          {asset.hostname}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-5 text-xs text-slate-400">
                    {asset.type}
                  </td>

                  <td className="px-5 py-5 font-mono text-xs text-slate-400">
                    {asset.ip}
                  </td>

                  <td className="px-5 py-5 text-xs text-slate-400">
                    {asset.os}
                  </td>

                  <td className="px-5 py-5">
                    <StatusBadge status={asset.status} />
                  </td>

                  <td className="px-5 py-5">
                    <RiskBadge risk={asset.risk} />
                  </td>

                  <td className="px-5 py-5 text-xs text-slate-500">
                    {asset.lastHeartbeat}
                  </td>

                  <td className="px-5 py-5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedAsset(asset)}
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

        {filteredAssets.length === 0 && (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-medium text-slate-300">
              No assets found
            </p>

            <p className="mt-2 text-xs text-slate-600">
              Try changing your search or filter selection.
            </p>
          </div>
        )}
      </section>

      {/* ASSET DETAIL MODAL */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-2xl border border-white/[0.1] bg-[#080e15]">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400/70">
                  Asset Details
                </p>

                <h2 className="mt-2 text-xl font-semibold text-slate-100">
                  {selectedAsset.name}
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  {selectedAsset.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAsset(null)}
                className="text-xl text-slate-500 transition hover:text-white"
                aria-label="Close asset details"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Hostname
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {selectedAsset.hostname}
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  IP Address
                </p>

                <p className="mt-2 font-mono text-sm text-slate-300">
                  {selectedAsset.ip}
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Operating System
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {selectedAsset.os}
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Asset Type
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {selectedAsset.type}
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Location
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {selectedAsset.location}
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Last Heartbeat
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {selectedAsset.lastHeartbeat}
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Status
                </p>

                <div className="mt-2">
                  <StatusBadge status={selectedAsset.status} />
                </div>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Risk Level
                </p>

                <div className="mt-2">
                  <RiskBadge risk={selectedAsset.risk} />
                </div>
              </div>

              <div className="sm:col-span-2">
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Description
                </p>

                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {selectedAsset.description}
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-white/[0.08] p-5">
              <button
                type="button"
                onClick={() => setSelectedAsset(null)}
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