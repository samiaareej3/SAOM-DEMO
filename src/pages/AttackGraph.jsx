import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Network,
  Search,
  ShieldAlert,
  Server,
  User,
  Globe,
  Database,
  Terminal,
  Lock,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

const NODE_WIDTH = 170;
const NODE_HEIGHT = 76;

const FALLBACK_NODES = [
  {
    id: "attacker",
    label: "External Attacker",
    type: "Threat Actor",
    icon: Globe,
    x: 90,
    y: 180,
    color: "#ef4444",
  },
  {
    id: "ip",
    label: "185.199.110.42",
    type: "Malicious IP",
    icon: Globe,
    x: 290,
    y: 180,
    color: "#f97316",
  },
  {
    id: "endpoint",
    label: "WS-FIN-024",
    type: "Compromised Endpoint",
    icon: Server,
    x: 490,
    y: 180,
    color: "#eab308",
  },
  {
    id: "powershell",
    label: "PowerShell",
    type: "Execution",
    icon: Terminal,
    x: 690,
    y: 180,
    color: "#06b6d4",
  },
  {
    id: "payload",
    label: "Remote Payload",
    type: "Malware",
    icon: ShieldAlert,
    x: 890,
    y: 180,
    color: "#ef4444",
  },
  {
    id: "account",
    label: "Finance Account",
    type: "User Account",
    icon: User,
    x: 490,
    y: 390,
    color: "#8b5cf6",
  },
  {
    id: "database",
    label: "Finance Database",
    type: "Sensitive Asset",
    icon: Database,
    x: 690,
    y: 390,
    color: "#ec4899",
  },
  {
    id: "lockdown",
    label: "Response Action",
    type: "Endpoint Isolation",
    icon: Lock,
    x: 890,
    y: 390,
    color: "#22c55e",
  },
];

const FALLBACK_EDGES = [
  ["attacker", "ip"],
  ["ip", "endpoint"],
  ["endpoint", "powershell"],
  ["powershell", "payload"],
  ["endpoint", "account"],
  ["account", "database"],
  ["payload", "lockdown"],
];

function unwrap(response) {
  return response?.data?.data || response?.data || response || {};
}

function getAlerts(scanData) {
  if (Array.isArray(scanData?.alerts)) return scanData.alerts;
  if (Array.isArray(scanData?.findings)) return scanData.findings;
  if (Array.isArray(scanData?.results)) return scanData.results;
  return [];
}

function NodeCard({ node, selected, onClick }) {
  const Icon = node.icon;

  return (
    <button
      onClick={() => onClick(node)}
      className={`absolute flex items-center gap-3 rounded-xl border p-3 text-left transition ${
        selected
          ? "border-cyan-300 bg-cyan-400/15 shadow-lg shadow-cyan-400/10"
          : "border-white/10 bg-[#111a2b] hover:border-cyan-400/50"
      }`}
      style={{
        left: node.x,
        top: node.y,
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="rounded-lg p-2"
        style={{
          backgroundColor: `${node.color}18`,
          color: node.color,
        }}
      >
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-white">
          {node.label}
        </p>

        <p className="mt-1 text-[10px] text-slate-500">
          {node.type}
        </p>
      </div>
    </button>
  );
}

function StatCard({ label, value, icon: Icon, tone = "cyan" }) {
  const tones = {
    cyan: "bg-cyan-400/10 text-cyan-400",
    red: "bg-red-400/10 text-red-400",
    orange: "bg-orange-400/10 text-orange-400",
    green: "bg-emerald-400/10 text-emerald-400",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111a2b] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>

        <div className={`rounded-xl p-2 ${tones[tone]}`}>
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function AttackGraph() {
  const navigate = useNavigate();

  const [selectedNode, setSelectedNode] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadLatestScan() {
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/scanner/latest"
      );

      if (!response.ok) {
        throw new Error("Latest scan could not be loaded.");
      }

      const data = await response.json();
      setScanData(unwrap(data));
    } catch (error) {
      console.warn("Attack graph is using fallback data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLatestScan();
  }, []);

  const alerts = getAlerts(scanData);

  const graphNodes = useMemo(() => {
    if (alerts.length === 0) {
      return FALLBACK_NODES;
    }

    const firstAlert = alerts[0] || {};

    const sourceIp =
      firstAlert.source_ip ||
      firstAlert.sourceIp ||
      firstAlert.source ||
      "External Source";

    const destination =
      firstAlert.hostname ||
      firstAlert.asset_id ||
      firstAlert.assetId ||
      firstAlert.destination_host ||
      firstAlert.destination ||
      "Monitored Endpoint";

    const attackType =
      firstAlert.attack_type ||
      firstAlert.attackType ||
      firstAlert.type ||
      firstAlert.alert_type ||
      "Security Threat";

    return [
      {
        ...FALLBACK_NODES[0],
        label: "External Attacker",
      },
      {
        ...FALLBACK_NODES[1],
        label: sourceIp,
      },
      {
        ...FALLBACK_NODES[2],
        label: destination,
      },
      {
        ...FALLBACK_NODES[3],
        label: attackType,
      },
      {
        ...FALLBACK_NODES[4],
        label: "Detected Threat",
      },
      {
        ...FALLBACK_NODES[5],
        label: "Affected Account",
      },
      {
        ...FALLBACK_NODES[6],
        label: "Sensitive Asset",
      },
      {
        ...FALLBACK_NODES[7],
        label: "Response Action",
      },
    ];
  }, [alerts]);

  const graphEdges = FALLBACK_EDGES;

  const filteredNodes = useMemo(() => {
    const query = search.toLowerCase().trim();

    return graphNodes.filter((node) => {
      const matchesSearch =
        !query ||
        `${node.label} ${node.type}`
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "All" || node.type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [graphNodes, search, filter]);

  const visibleNodeIds = new Set(
    filteredNodes.map((node) => node.id)
  );

  const threatNodes = alerts.length > 0 ? alerts.length : 2;
  const affectedAssets = alerts.length > 0 ? alerts.length : 3;

  return (
    <div className="min-h-screen bg-[#08111f] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-400"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-400">
                <Network size={28} />
              </div>

              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Attack Graph
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Visualize attack paths, compromised assets, and response actions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadLatestScan}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={() => setSelectedNode(null)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
            >
              <CircleDot size={16} />
              Clear Selection
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Graph Nodes"
            value={graphNodes.length}
            icon={Network}
          />

          <StatCard
            label="Threat Nodes"
            value={threatNodes}
            icon={ShieldAlert}
            tone="red"
          />

          <StatCard
            label="Affected Assets"
            value={affectedAssets}
            icon={Server}
            tone="orange"
          />

          <StatCard
            label="Response Actions"
            value="1"
            icon={CheckCircle2}
            tone="green"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 rounded-2xl border border-white/10 bg-[#0d1727] p-4 sm:p-5">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search graph nodes..."
                  className="w-full rounded-xl border border-white/10 bg-[#111a2b] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
                />
              </div>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#111a2b] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-cyan-400/60"
              >
                <option value="All">All Node Types</option>
                <option value="Threat Actor">Threat Actor</option>
                <option value="Malicious IP">Malicious IP</option>
                <option value="Compromised Endpoint">
                  Compromised Endpoint
                </option>
                <option value="Execution">Execution</option>
                <option value="Malware">Malware</option>
                <option value="User Account">User Account</option>
                <option value="Sensitive Asset">Sensitive Asset</option>
                <option value="Endpoint Isolation">
                  Endpoint Isolation
                </option>
              </select>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#08111f]">
              <div
                className="relative"
                style={{
                  width: 1080,
                  height: 570,
                  backgroundImage:
                    "radial-gradient(circle, rgba(148,163,184,0.18) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              >
                <svg
                  width="1080"
                  height="570"
                  className="absolute inset-0"
                  aria-label="Attack path connections"
                >
                  <defs>
                    <marker
                      id="attack-arrow"
                      markerWidth="8"
                      markerHeight="8"
                      refX="6"
                      refY="3"
                      orient="auto"
                    >
                      <path
                        d="M0,0 L0,6 L6,3 z"
                        fill="#64748b"
                      />
                    </marker>
                  </defs>

                  {graphEdges.map(([fromId, toId]) => {
                    const from = graphNodes.find(
                      (node) => node.id === fromId
                    );

                    const to = graphNodes.find(
                      (node) => node.id === toId
                    );

                    if (
                      !from ||
                      !to ||
                      !visibleNodeIds.has(fromId) ||
                      !visibleNodeIds.has(toId)
                    ) {
                      return null;
                    }

                    const isSelected =
                      selectedNode &&
                      (selectedNode.id === fromId ||
                        selectedNode.id === toId);

                    return (
                      <line
                        key={`${fromId}-${toId}`}
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={isSelected ? "#22d3ee" : "#475569"}
                        strokeWidth={isSelected ? "3" : "2"}
                        strokeDasharray={isSelected ? "0" : "6 5"}
                        markerEnd="url(#attack-arrow)"
                      />
                    );
                  })}
                </svg>

                {filteredNodes.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    selected={selectedNode?.id === node.id}
                    onClick={setSelectedNode}
                  />
                ))}

                <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-[#111a2b]/95 px-3 py-2 text-xs text-slate-400">
                  {loading
                    ? "Loading latest scan..."
                    : alerts.length > 0
                      ? "Connected to latest scanner result"
                      : "Showing fallback attack graph"}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                Threat
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                Network
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                Execution
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Response
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-[#111a2b] p-5">
              <div className="mb-5 flex items-center gap-2">
                <ShieldAlert size={18} className="text-cyan-400" />

                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Node Details
                </h2>
              </div>

              {selectedNode ? (
                <div>
                  <div className="mb-4 flex items-start gap-3">
                    <div
                      className="rounded-xl p-3"
                      style={{
                        backgroundColor: `${selectedNode.color}18`,
                        color: selectedNode.color,
                      }}
                    >
                      {(() => {
                        const Icon = selectedNode.icon;
                        return <Icon size={24} />;
                      })()}
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        {selectedNode.type}
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-white">
                        {selectedNode.label}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/10 bg-[#0d1727] p-3">
                      <p className="text-xs text-slate-500">
                        Node ID
                      </p>

                      <p className="mt-1 font-mono text-sm text-cyan-300">
                        {selectedNode.id}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-[#0d1727] p-3">
                      <p className="text-xs text-slate-500">
                        Risk Status
                      </p>

                      <p className="mt-1 text-sm font-semibold text-orange-300">
                        Requires Review
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-[#0d1727] p-3">
                      <p className="text-xs text-slate-500">
                        Recommended Action
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        Investigate related events and verify whether
                        the activity is authorized.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-[#0d1727] p-6 text-center">
                  <Network
                    className="mx-auto text-slate-600"
                    size={32}
                  />

                  <p className="mt-3 text-sm text-slate-400">
                    Select a node from the graph to view its details.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#111a2b] p-5">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle
                  size={18}
                  className="text-orange-400"
                />

                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Attack Path Summary
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  "External attacker identified",
                  "Malicious source contacted endpoint",
                  "Threat execution detected",
                  "Potential payload activity detected",
                  "Endpoint isolation recommended",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-3"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-300">
                      {index + 1}
                    </div>

                    <p className="text-sm leading-6 text-slate-400">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate("/investigation")}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-[#06111e] transition hover:bg-cyan-300"
              >
                Open Investigation
                <ChevronRight size={16} />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}