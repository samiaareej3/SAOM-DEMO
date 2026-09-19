import { useEffect, useMemo, useState } from "react";

import { Boxes } from "lucide-react";

import { getAssets } from "../services/dashboardApi";

import {
  AppShell,
  Badge,
  Cell,
  EmptyState,
  InfoRow,
  LoadingState,
  Notice,
  PageHeader,
  Panel,
  SearchInput,
  SegmentedControl,
  Select,
  SeverityBadge,
  SeverityBar,
  SidePanel,
  SpineRow,
  StatCard,
  StatusBadge,
  Table,
} from "../components/ui";

/* =========================================================
   HELPERS  (unchanged — backend field mapping)
========================================================= */

function normalizeAsset(asset, index) {
  const statusValue = asset.status || asset.health || asset.state || "Offline";
  const riskValue =
    asset.risk ||
    asset.risk_level ||
    asset.riskLevel ||
    asset.severity ||
    "Low";

  const normalizedStatus =
    String(statusValue).charAt(0).toUpperCase() +
    String(statusValue).slice(1).toLowerCase();

  const normalizedRisk =
    String(riskValue).charAt(0).toUpperCase() +
    String(riskValue).slice(1).toLowerCase();

  return {
    id: asset.id || asset._id || `AST-${String(index + 1).padStart(3, "0")}`,
    name: asset.name || asset.asset_name || asset.hostname || "Unnamed Asset",
    hostname: asset.hostname || asset.host || asset.name || "Unknown Host",
    type: asset.type || asset.asset_type || asset.category || "Unknown",
    ip: asset.ip || asset.ip_address || asset.ipAddress || "N/A",
    os: asset.os || asset.operating_system || asset.operatingSystem || "N/A",
    status: normalizedStatus,
    risk: normalizedRisk,
    lastHeartbeat:
      asset.lastHeartbeat ||
      asset.last_heartbeat ||
      asset.lastSeen ||
      asset.last_seen ||
      "N/A",
    location: asset.location || asset.network || "Unknown Location",
    description:
      asset.description ||
      asset.details ||
      "No description available for this asset.",
  };
}

export default function Infrastructure() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [selectedAsset, setSelectedAsset] = useState(null);

  /* View mode is presentation-only state; it never touches the request. */
  const [view, setView] = useState("table");

  useEffect(() => {
    let isMounted = true;

    async function loadAssets() {
      try {
        setLoading(true);
        setError("");

        const response = await getAssets();

        const receivedAssets = Array.isArray(response)
          ? response
          : response?.assets ||
            response?.data ||
            response?.results ||
            [];

        const formattedAssets = receivedAssets.map(normalizeAsset);

        if (isMounted) {
          setAssets(formattedAssets);
        }
      } catch (requestError) {
        console.error("Failed to load infrastructure assets:", requestError);

        if (isMounted) {
          setError(
            requestError.message ||
              "Unable to load infrastructure assets from backend."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    return {
      total: assets.length,
      online: assets.filter((asset) => asset.status === "Online").length,
      offline: assets.filter((asset) => asset.status === "Offline").length,
      critical: assets.filter((asset) => asset.risk === "Critical").length,
    };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const searchableText = [
        asset.id,
        asset.name,
        asset.hostname,
        asset.type,
        asset.ip,
        asset.os,
        asset.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || asset.status === statusFilter;

      const matchesRisk =
        riskFilter === "All" || asset.risk === riskFilter;

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [assets, search, statusFilter, riskFilter]);

  /* ------------------ derived views over the same asset list ------------ */

  const riskCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };

    assets.forEach((asset) => {
      if (counts[asset.risk] !== undefined) counts[asset.risk] += 1;
    });

    return counts;
  }, [assets]);

  const byType = useMemo(() => {
    const tally = new Map();

    assets.forEach((asset) => {
      tally.set(asset.type, (tally.get(asset.type) || 0) + 1);
    });

    return [...tally.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  }, [assets]);

  const availability =
    summary.total > 0
      ? Math.round((summary.online / summary.total) * 100)
      : 0;

  return (
    <AppShell connected={!error}>
      <PageHeader
        breadcrumb="Operations"
        title="Infrastructure"
        description="Every asset reporting to SAOM-AI, with its health, exposure and last heartbeat."
        status={
          <Badge tone={summary.offline > 0 ? "amber" : "emerald"}>
            {availability}% of assets online
          </Badge>
        }
        actions={
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: "table", label: "Table" },
              { value: "cards", label: "Cards" },
            ]}
          />
        }
      />

      <div className="mx-auto max-w-[1600px] space-y-4 px-5 py-6 lg:px-8">
        {error && <Notice tone="error">{error}</Notice>}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Critical exposure"
            value={summary.critical}
            tone={summary.critical > 0 ? "critical" : "good"}
            emphasis
            hint="Assets at critical risk"
          />

          <StatCard
            label="Online"
            value={summary.online}
            tone="good"
            hint="Heartbeat received"
          />

          <StatCard
            label="Offline"
            value={summary.offline}
            tone={summary.offline > 0 ? "high" : "good"}
            hint="No recent heartbeat"
          />

          <StatCard
            label="Total assets"
            value={summary.total}
            tone="brand"
            hint="In the monitored inventory"
            icon={Boxes}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Panel title="Risk across the estate">
            <SeverityBar counts={riskCounts} />
          </Panel>

          <Panel title="Inventory by type">
            {byType.length === 0 ? (
              <EmptyState
                title="No asset types reported"
                description="Type is read from the asset record returned by the backend."
              />
            ) : (
              <ul className="flex flex-wrap gap-2">
                {byType.map((item) => (
                  <li key={item.label}>
                    <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                      {item.label}

                      <span className="font-semibold tabular-nums text-slate-900">
                        {item.value}
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
            placeholder="Search hostname, IP, OS or location"
            className="lg:max-w-sm lg:flex-1"
          />

          <Select
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="lg:w-40"
          >
            {["All", "Online", "Offline"].map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "All statuses" : status}
              </option>
            ))}
          </Select>

          <SegmentedControl
            value={riskFilter}
            onChange={setRiskFilter}
            options={["All", "Critical", "High", "Medium", "Low"]}
          />

          <span className="text-xs tabular-nums text-slate-500 lg:ml-auto">
            {filteredAssets.length} of {assets.length}
          </span>
        </div>

        {/* -------------------------------------------------- asset views */}

        {loading ? (
          <Panel>
            <LoadingState label="Loading asset inventory" rows={5} />
          </Panel>
        ) : filteredAssets.length === 0 ? (
          <Panel>
            <EmptyState
              icon={Boxes}
              title={
                assets.length === 0
                  ? "No assets returned"
                  : "No assets match these filters"
              }
              description={
                assets.length === 0
                  ? "The asset endpoint responded with an empty inventory."
                  : "Clear a filter to widen the inventory view."
              }
            />
          </Panel>
        ) : view === "table" ? (
          <Panel className="overflow-hidden">
            <div className="-m-5">
              <Table
                columns={[
                  { key: "spine", label: "", className: "w-[3px] p-0" },
                  { key: "asset", label: "Asset" },
                  { key: "type", label: "Type" },
                  { key: "ip", label: "Address" },
                  { key: "os", label: "Platform" },
                  { key: "risk", label: "Risk" },
                  { key: "status", label: "Status" },
                  { key: "seen", label: "Last heartbeat", align: "right" },
                ]}
              >
                {filteredAssets.map((asset) => (
                  <SpineRow
                    key={asset.id}
                    severity={asset.risk}
                    selected={selectedAsset?.id === asset.id}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <Cell>
                      <p className="font-medium text-slate-900">{asset.name}</p>

                      <p className="mt-0.5 font-mono text-xs text-slate-500">
                        {asset.hostname}
                      </p>
                    </Cell>

                    <Cell className="text-slate-700">{asset.type}</Cell>

                    <Cell className="font-mono text-[13px] text-slate-600">
                      {asset.ip}
                    </Cell>

                    <Cell className="text-slate-700">{asset.os}</Cell>

                    <Cell>
                      <SeverityBadge severity={asset.risk} />
                    </Cell>

                    <Cell>
                      <StatusBadge status={asset.status} />
                    </Cell>

                    <Cell className="text-right text-xs text-slate-500">
                      {asset.lastHeartbeat}
                    </Cell>
                  </SpineRow>
                ))}
              </Table>
            </div>
          </Panel>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAssets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelectedAsset(asset)}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {asset.name}
                    </p>

                    <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                      {asset.ip}
                    </p>
                  </div>

                  <StatusBadge status={asset.status} />
                </div>

                <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
                  {asset.description}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
                  <span className="truncate text-xs text-slate-500">
                    {asset.type} · {asset.location}
                  </span>

                  <SeverityBadge severity={asset.risk} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <SidePanel
        open={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
        title={selectedAsset?.name}
        subtitle={selectedAsset?.hostname}
      >
        {selectedAsset && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selectedAsset.status} />

              <SeverityBadge severity={selectedAsset.risk} />

              <Badge tone="slate">{selectedAsset.type}</Badge>
            </div>

            <p className="text-sm leading-6 text-slate-700">
              {selectedAsset.description}
            </p>

            <div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Asset record
              </h3>

              <InfoRow label="Asset ID" value={selectedAsset.id} mono />

              <InfoRow label="Hostname" value={selectedAsset.hostname} mono />

              <InfoRow label="IP address" value={selectedAsset.ip} mono />

              <InfoRow label="Platform" value={selectedAsset.os} />

              <InfoRow label="Location" value={selectedAsset.location} />

              <InfoRow
                label="Last heartbeat"
                value={selectedAsset.lastHeartbeat}
              />
            </div>
          </div>
        )}
      </SidePanel>
    </AppShell>
  );
}