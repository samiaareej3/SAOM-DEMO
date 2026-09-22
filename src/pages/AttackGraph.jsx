 import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AlertTriangle,
  Crosshair,
  Database,
  Globe,
  Lock,
  RefreshCw,
  Server,
  ShieldAlert,
  Terminal,
  User,
} from "lucide-react";

import { getAttackGraph } from "../services/dashboardApi";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  InfoRow,
  LoadingState,
  PageHeader,
  Panel,
  SearchInput,
  Select,
  StatCard,
} from "../components/ui";

/* =========================================================
   GRAPH CONSTANTS  (unchanged geometry contract)
========================================================= */

const NODE_WIDTH = 190;
const NODE_HEIGHT = 82;

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 650;

const ICON_MAP = {
  "Threat Actor": Globe,
  "Malicious IP": Globe,
  "Compromised Endpoint": Server,
  Execution: Terminal,
  Malware: ShieldAlert,
  "User Account": User,
  "Sensitive Asset": Database,
  "Endpoint Isolation": Lock,
  "Security Event": AlertTriangle,
};

/*
 * Kind colours restated for a light canvas: saturated enough to carry meaning
 * on white, muted enough that ten of them on screen do not fight.
 */
const NODE_COLORS = {
  source: "#DC2626",
  asset: "#CA8A04",
  execution: "#EA580C",
  response: "#059669",
  default: "#475569",
};

const KIND_LABEL = {
  source: "Threat origin",
  asset: "Affected asset",
  execution: "Execution",
  response: "Response",
  default: "Event",
};

/* =========================================================
   HELPERS  (unchanged)
========================================================= */

function normalizeGraphResponse(response) {
  const root =
    response?.data ||
    response?.result ||
    response ||
    {};

  return {
    nodes: Array.isArray(root.nodes)
      ? root.nodes
      : [],

    edges: Array.isArray(root.edges)
      ? root.edges
      : [],

    stats:
      root.stats &&
      typeof root.stats === "object"
        ? root.stats
        : {},
  };
}

function getNodeColor(node) {
  if (
    node?.color &&
    typeof node.color === "string"
  ) {
    return node.color;
  }

  return (
    NODE_COLORS[node?.kind] ||
    NODE_COLORS.default
  );
}

function getNodeIcon(node) {
  return (
    ICON_MAP[node?.type] ||
    ShieldAlert
  );
}

function getEdgeFrom(edge) {
  if (!edge) return null;

  return (
    edge.from ??
    edge.source ??
    edge.source_id ??
    null
  );
}

function getEdgeTo(edge) {
  if (!edge) return null;

  return (
    edge.to ??
    edge.target ??
    edge.target_id ??
    null
  );
}

function getNodePosition(index, total) {
  /*
   * Arrange the graph in horizontal layers.
   * This keeps larger graphs readable without
   * relying on fixed demo coordinates.
   */

  const columns = Math.min(
    5,
    Math.max(1, Math.ceil(Math.sqrt(total)))
  );

  const rows = Math.ceil(
    total / columns
  );

  const horizontalGap =
    CANVAS_WIDTH / (columns + 1);

  const verticalGap =
    CANVAS_HEIGHT / (rows + 1);

  const column =
    index % columns;

  const row =
    Math.floor(index / columns);

  return {
    x:
      horizontalGap *
      (column + 1),

    y:
      verticalGap *
      (row + 1),
  };
}

function prepareNodes(nodes) {
  return nodes.map(
    (node, index) => {
      const Icon =
        getNodeIcon(node);

      const position =
        getNodePosition(
          index,
          nodes.length
        );

      return {
        ...node,

        id:
          node.id ||
          `node-${index}`,

        label:
          node.label ||
          node.name ||
          node.id ||
          "Unknown Node",

        type:
          node.type ||
          "Security Event",

        kind:
          node.kind ||
          "default",

        icon: Icon,

        color:
          getNodeColor(node),

        x:
          node.x ??
          position.x,

        y:
          node.y ??
          position.y,
      };
    }
  );
}

/* =========================================================
   GRAPH CANVAS

   Rendered as one SVG so edges and nodes share a coordinate
   space. Nodes are buttons in the accessibility tree via
   role + tabIndex, so the graph is keyboard reachable.
========================================================= */

function GraphCanvas({ nodes, edges, nodeMap, selectedId, onSelect }) {
  return (
    <div className="overflow-auto rounded-lg border border-slate-200 bg-slate-50/60">
      <svg
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        className="h-[620px] w-full min-w-[860px]"
        role="img"
        aria-label={`Attack graph with ${nodes.length} nodes and ${edges.length} relationships`}
      >
        <defs>
          <pattern
            id="graph-grid"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="#DDE2EA" />
          </pattern>

          <marker
            id="graph-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="#94A3B8" />
          </marker>

          <marker
            id="graph-arrow-active"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="#ED1C2E" />
          </marker>
        </defs>

        <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#graph-grid)" />

        {/* ------------------------------------------------------- edges */}

        {edges.map((edge, index) => {
          const from = nodeMap.get(String(edge.from));
          const to = nodeMap.get(String(edge.to));

          if (!from || !to) return null;

          const active =
            selectedId &&
            (String(edge.from) === String(selectedId) ||
              String(edge.to) === String(selectedId));

          const midX = (from.x + to.x) / 2;

          return (
            <path
              key={`${edge.from}-${edge.to}-${index}`}
              d={`M${from.x} ${from.y} C${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
              fill="none"
              stroke={active ? "#ED1C2E" : "#CBD5E1"}
              strokeWidth={active ? 2 : 1.5}
              markerEnd={`url(#${active ? "graph-arrow-active" : "graph-arrow"})`}
            >
              <title>{`${from.label} → ${to.label}`}</title>
            </path>
          );
        })}

        {/* ------------------------------------------------------- nodes */}

        {nodes.map((node) => {
          const Icon = node.icon;

          const selected = String(node.id) === String(selectedId);

          const x = node.x - NODE_WIDTH / 2;
          const y = node.y - NODE_HEIGHT / 2;

          return (
            <g
              key={node.id}
              transform={`translate(${x} ${y})`}
              role="button"
              tabIndex={0}
              aria-label={`${node.label}, ${node.type}`}
              onClick={() => onSelect(node)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(node);
                }
              }}
              className="cursor-pointer focus:outline-none transition-opacity duration-150 hover:opacity-95"
            >
              <rect
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx="10"
                fill="#FFFFFF"
                stroke={selected ? "#ED1C2E" : "#E4E8EE"}
                strokeWidth={selected ? 2 : 1}
                style={{
                  filter: selected
                    ? "drop-shadow(0 6px 14px rgba(237,28,46,.18))"
                    : "drop-shadow(0 1px 2px rgba(15,23,42,.06))",
                }}
              />

              <rect width="4" height={NODE_HEIGHT} rx="2" fill={node.color} />

              <svg x="18" y="16" width="18" height="18" viewBox="0 0 24 24">
                <Icon size={24} color={node.color} strokeWidth={1.9} />
              </svg>

              <text
                x="18"
                y="52"
                className="fill-slate-900 text-[13px] font-medium"
              >
                {String(node.label).length > 20
                  ? `${String(node.label).slice(0, 19)}…`
                  : node.label}
              </text>

              <text x="18" y="68" className="fill-slate-400 text-[11px]">
                {String(node.type).length > 24
                  ? `${String(node.type).slice(0, 23)}…`
                  : node.type}
              </text>

              <title>{`${node.label} — ${node.type}`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function AttackGraph() {
  const navigate =
    useNavigate();

  const [
    graphData,
    setGraphData,
  ] = useState({
    nodes: [],
    edges: [],
    stats: {},
  });

  const [
    selectedNode,
    setSelectedNode,
  ] = useState(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState("All");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  async function loadAttackGraph() {
    setLoading(true);
    setError("");

    try {
      const response =
        await getAttackGraph();

      const normalized =
        normalizeGraphResponse(
          response
        );

      setGraphData(
        normalized
      );

      setSelectedNode(
        null
      );
    } catch (err) {
      console.error(
        "Failed to load attack graph:",
        err
      );

      setError(
        err?.message ||
          "Failed to load attack graph."
      );

      setGraphData({
        nodes: [],
        edges: [],
        stats: {},
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttackGraph();
  }, []);

  const graphNodes = useMemo(
    () =>
      prepareNodes(
        graphData.nodes
      ),
    [graphData.nodes]
  );

  const graphEdges = useMemo(
    () =>
      graphData.edges
        .map((edge) => ({
          from:
            getEdgeFrom(edge),

          to:
            getEdgeTo(edge),

          metadata:
            edge.metadata ||
            {},
        }))
        .filter(
          (edge) =>
            edge.from &&
            edge.to
        ),
    [graphData.edges]
  );

  const nodeMap = useMemo(() => {
    const map = new Map();

    graphNodes.forEach(
      (node) => {
        map.set(
          String(node.id),
          node
        );
      }
    );

    return map;
  }, [graphNodes]);

  const nodeTypes = useMemo(() => {
    const types =
      graphNodes
        .map(
          (node) =>
            node.type
        )
        .filter(Boolean);

    return [
      "All",
      ...Array.from(
        new Set(types)
      ),
    ];
  }, [graphNodes]);

  const filteredNodes = useMemo(() => {
    const query =
      search
        .toLowerCase()
        .trim();

    return graphNodes.filter(
      (node) => {
        const searchable = [
          node.id,
          node.label,
          node.type,
          node.kind,
          node.metadata?.ip,
          node.metadata?.hostname,
          node.metadata?.asset_id,
          node.metadata?.attack_type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !query ||
          searchable.includes(
            query
          );

        const matchesFilter =
          filter === "All" ||
          node.type ===
            filter;

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );
  }, [
    graphNodes,
    search,
    filter,
  ]);

  const visibleNodeIds =
    useMemo(
      () =>
        new Set(
          filteredNodes.map(
            (node) =>
              String(node.id)
          )
        ),
      [filteredNodes]
    );

  const visibleEdges =
    useMemo(
      () =>
        graphEdges.filter(
          (edge) =>
            visibleNodeIds.has(
              String(edge.from)
            ) &&
            visibleNodeIds.has(
              String(edge.to)
            )
        ),
      [
        graphEdges,
        visibleNodeIds,
      ]
    );

  const stats =
    graphData.stats || {};

  const totalNodes =
    Number.isFinite(
      Number(stats.nodes)
    )
      ? Number(stats.nodes)
      : graphNodes.length;

  const totalEdges =
    Number.isFinite(
      Number(stats.edges)
    )
      ? Number(stats.edges)
      : graphEdges.length;

  const threatNodes =
    Number.isFinite(
      Number(
        stats.threat_nodes
      )
    )
      ? Number(
          stats.threat_nodes
        )
      : graphNodes.filter(
          (node) =>
            node.kind ===
            "source"
        ).length;

  const affectedAssets =
    Number.isFinite(
      Number(
        stats.affected_assets
      )
    )
      ? Number(
          stats.affected_assets
        )
      : graphNodes.filter(
          (node) =>
            node.kind ===
            "asset"
        ).length;

  const responseActions =
    Number.isFinite(
      Number(
        stats.response_actions
      )
    )
      ? Number(
          stats.response_actions
        )
      : graphNodes.filter(
          (node) =>
            node.kind ===
            "response"
        ).length;

  /* Relationships touching the selected node, for the detail rail. */
  const connections = useMemo(() => {
    if (!selectedNode) return { inbound: [], outbound: [] };

    const id = String(selectedNode.id);

    return {
      inbound: graphEdges
        .filter((edge) => String(edge.to) === id)
        .map((edge) => nodeMap.get(String(edge.from)))
        .filter(Boolean),

      outbound: graphEdges
        .filter((edge) => String(edge.from) === id)
        .map((edge) => nodeMap.get(String(edge.to)))
        .filter(Boolean),
    };
  }, [selectedNode, graphEdges, nodeMap]);

  return (
    <>
      <PageHeader
        breadcrumb="Analysis"
        title="Attack graph"
        description="How the observed activity connects: where it came from, what it touched and what responded."
        status={
          <Badge tone="slate">
            {totalNodes} nodes · {totalEdges} relationships
          </Badge>
        }
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={loading}
            onClick={loadAttackGraph}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />

    <div className="mx-auto max-w-[1600px] space-y-4 px-5 py-5 lg:px-8">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Threat origins"
            value={threatNodes}
            tone={threatNodes > 0 ? "critical" : "good"}
            emphasis
            hint="Entry points in the graph"
          />

          <StatCard
            label="Affected assets"
            value={affectedAssets}
            tone={affectedAssets > 0 ? "medium" : "good"}
            hint="Reached by the attack path"
          />

          <StatCard
            label="Response actions"
            value={responseActions}
            tone="good"
            hint="Containment nodes"
          />

          <StatCard
            label="Relationships"
            value={totalEdges}
            tone="brand"
            hint="Directed edges between nodes"
          />
        </div>

        {/* ---------------------------------------------------- filter bar */}

        <div className="flex flex-col gap-2.5 border border-slate-200 bg-white p-3 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search node, IP, hostname or attack type"
            className="lg:max-w-sm lg:flex-1"
          />

          <Select
            label="Node type"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="lg:w-56"
          >
            {nodeTypes.map((type) => (
              <option key={type} value={type}>
                {type === "All" ? "All node types" : type}
              </option>
            ))}
          </Select>

          <div className="flex flex-wrap items-center gap-4 lg:ml-auto">
            {Object.entries(KIND_LABEL).map(([kind, label]) => (
              <span
                key={kind}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: NODE_COLORS[kind] }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ------------------------------------------- canvas + detail rail */}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Panel
            title="Attack path"
            hint={`${filteredNodes.length} of ${graphNodes.length} nodes shown`}
          >
            {loading ? (
              <LoadingState label="Building the attack graph" rows={3} />
            ) : filteredNodes.length === 0 ? (
              <EmptyState
                icon={Crosshair}
                title={
                  graphNodes.length === 0
                    ? "No attack graph returned"
                    : "No nodes match these filters"
                }
                description={
                  graphNodes.length === 0
                    ? "The graph endpoint returned no nodes. It populates once correlated attack activity is recorded."
                    : "Clear the search or switch back to all node types."
                }
              />
            ) : (
              <GraphCanvas
                nodes={filteredNodes}
                edges={visibleEdges}
                nodeMap={nodeMap}
                selectedId={selectedNode?.id}
                onSelect={setSelectedNode}
              />
            )}
          </Panel>

          <div className="space-y-4">
            <Panel title="Node details">
              {!selectedNode ? (
                <EmptyState
                  title="Select a node"
                  description="Click any node in the graph to see its metadata and the relationships that reach it."
                />
              ) : (
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    {(() => {
                      const SelectedIcon = selectedNode.icon;
                      return (
                        <span
                          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: `${selectedNode.color}14`,
                            color: selectedNode.color,
                          }}
                        >
                          <SelectedIcon size={18} />
                        </span>
                      );
                    })()}

                    <div className="min-w-0">
                      <p className="break-words font-medium text-slate-900">
                        {selectedNode.label}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {selectedNode.type}
                      </p>
                    </div>
                  </div>

                  <Badge tone="slate">
                    {KIND_LABEL[selectedNode.kind] || KIND_LABEL.default}
                  </Badge>

                  <div>
                    <InfoRow label="Node ID" value={selectedNode.id} mono />

                    {selectedNode.metadata?.ip && (
                      <InfoRow
                        label="IP address"
                        value={selectedNode.metadata.ip}
                        mono
                      />
                    )}

                    {selectedNode.metadata?.hostname && (
                      <InfoRow
                        label="Hostname"
                        value={selectedNode.metadata.hostname}
                        mono
                      />
                    )}

                    {selectedNode.metadata?.asset_id && (
                      <InfoRow
                        label="Asset ID"
                        value={selectedNode.metadata.asset_id}
                        mono
                      />
                    )}

                    {selectedNode.metadata?.attack_type && (
                      <InfoRow
                        label="Attack type"
                        value={selectedNode.metadata.attack_type}
                      />
                    )}
                  </div>

                  {(connections.inbound.length > 0 ||
                    connections.outbound.length > 0) && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-slate-900">
                        Connections
                      </h3>

                      <ul className="space-y-1.5">
                        {connections.inbound.map((node) => (
                          <li
                            key={`in-${node.id}`}
                            className="flex items-center gap-2 text-sm text-slate-600"
                          >
                            <span className="text-slate-400">←</span>

                            <button
                              type="button"
                              onClick={() => setSelectedNode(node)}
                              className="truncate text-left hover:text-slate-900 hover:underline"
                            >
                              {node.label}
                            </button>
                          </li>
                        ))}

                        {connections.outbound.map((node) => (
                          <li
                            key={`out-${node.id}`}
                            className="flex items-center gap-2 text-sm text-slate-600"
                          >
                            <span className="text-slate-400">→</span>

                            <button
                              type="button"
                              onClick={() => setSelectedNode(node)}
                              className="truncate text-left hover:text-slate-900 hover:underline"
                            >
                              {node.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    variant="secondary"
                    onClick={() => navigate("/investigation")}
                    className="w-full"
                  >
                    Open investigation workspace
                  </Button>
                </div>
              )}
            </Panel>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Reading this graph
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Edges point in the direction the activity travelled. A node's
                left edge is coloured by its role, so a red spine marks where an
                attack entered and a green one marks where it was contained.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}