import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  ShieldAlert,
  XCircle,
  Search,
  Filter,
  UserRound,
  Server,
  Network,
  Ban,
} from "lucide-react";

const INITIAL_APPROVALS = [
  {
    id: "APR-001",
    title: "Isolate compromised endpoint",
    description:
      "Endpoint WS-045 shows suspicious PowerShell activity and outbound connections.",
    type: "Endpoint Isolation",
    severity: "Critical",
    requester: "SAOM-AI Detection Engine",
    target: "WS-045",
    time: "2 minutes ago",
    status: "Pending",
  },
  {
    id: "APR-002",
    title: "Block malicious IP address",
    description:
      "Threat intelligence identified a high-confidence malicious source IP.",
    type: "Firewall Block",
    severity: "High",
    requester: "Threat Intelligence",
    target: "185.220.101.24",
    time: "8 minutes ago",
    status: "Pending",
  },
  {
    id: "APR-003",
    title: "Disable suspicious user account",
    description:
      "Multiple impossible-travel login events were detected for this account.",
    type: "Account Disable",
    severity: "High",
    requester: "Identity Monitoring",
    target: "john.doe@company.com",
    time: "14 minutes ago",
    status: "Pending",
  },
  {
    id: "APR-004",
    title: "Run malware containment playbook",
    description:
      "Execute the approved containment workflow against the affected asset group.",
    type: "SOAR Playbook",
    severity: "Medium",
    requester: "Incident Response",
    target: "Finance Workstations",
    time: "21 minutes ago",
    status: "Pending",
  },
];

const severityStyles = {
  Critical: "border-red-400/20 bg-red-400/10 text-red-300",
  High: "border-orange-400/20 bg-orange-400/10 text-orange-300",
  Medium: "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
  Low: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
};

function getTypeIcon(type) {
  if (type === "Endpoint Isolation") return Server;
  if (type === "Firewall Block") return Network;
  if (type === "Account Disable") return Ban;
  return ShieldAlert;
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="border border-white/[0.08] bg-[#080e15] p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          {label}
        </span>

        <Icon size={17} className={accent} />
      </div>

      <p className="mt-3 text-3xl font-semibold text-slate-100">
        {value}
      </p>
    </div>
  );
}

function ApprovalCard({ approval, onApprove, onReject }) {
  const TypeIcon = getTypeIcon(approval.type);

  return (
    <article className="border border-white/[0.08] bg-[#080e15] p-5 transition hover:border-cyan-400/30">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <TypeIcon size={21} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.16em] text-cyan-400">
                {approval.id}
              </span>

              <span
                className={`border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
                  severityStyles[approval.severity]
                }`}
              >
                {approval.severity}
              </span>

              <span className="border border-white/[0.08] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {approval.status}
              </span>
            </div>

            <h3 className="mt-3 text-base font-semibold text-slate-100">
              {approval.title}
            </h3>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              {approval.description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => onReject(approval.id)}
            className="inline-flex items-center justify-center gap-2 border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/20"
          >
            <XCircle size={15} />
            Reject
          </button>

          <button
            onClick={() => onApprove(approval.id)}
            className="inline-flex items-center justify-center gap-2 border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
          >
            <CheckCircle2 size={15} />
            Approve
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 border-t border-white/[0.06] pt-4 text-xs sm:grid-cols-3">
        <div>
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">
            Action Type
          </p>
          <p className="text-slate-300">{approval.type}</p>
        </div>

        <div>
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">
            Target
          </p>
          <p className="break-all text-slate-300">{approval.target}</p>
        </div>

        <div>
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">
            Requested By
          </p>
          <p className="text-slate-300">{approval.requester}</p>
          <p className="mt-1 text-slate-600">{approval.time}</p>
        </div>
      </div>
    </article>
  );
}

export default function Approvals() {
  const [approvals, setApprovals] = useState(INITIAL_APPROVALS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredApprovals = useMemo(() => {
    return approvals.filter((approval) => {
      const matchesSearch =
        approval.title.toLowerCase().includes(search.toLowerCase()) ||
        approval.description.toLowerCase().includes(search.toLowerCase()) ||
        approval.target.toLowerCase().includes(search.toLowerCase()) ||
        approval.id.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" || approval.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [approvals, search, filter]);

  const approveRequest = (id) => {
    setApprovals((current) =>
      current.map((approval) =>
        approval.id === id
          ? { ...approval, status: "Approved" }
          : approval
      )
    );
  };

  const rejectRequest = (id) => {
    setApprovals((current) =>
      current.map((approval) =>
        approval.id === id
          ? { ...approval, status: "Rejected" }
          : approval
      )
    );
  };

  const pendingCount = approvals.filter(
    (approval) => approval.status === "Pending"
  ).length;

  const approvedCount = approvals.filter(
    (approval) => approval.status === "Approved"
  ).length;

  const rejectedCount = approvals.filter(
    (approval) => approval.status === "Rejected"
  ).length;

  return (
    <main className="min-h-screen bg-[#05080d] px-5 py-8 text-slate-200 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">

        {/* Header */}
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400">
              SAOM-AI / Governance
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl">
              Approval Queue
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Review and authorize security actions before they are executed
              by the automation engine.
            </p>
          </div>

          <div className="flex items-center gap-2 border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs font-semibold text-emerald-300">
            <ShieldAlert size={16} />
            Human-in-the-loop protection active
          </div>
        </header>


        {/* Stats */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Requests"
            value={approvals.length}
            icon={Clock3}
            accent="text-cyan-300"
          />

          <StatCard
            label="Pending Review"
            value={pendingCount}
            icon={Clock3}
            accent="text-yellow-300"
          />

          <StatCard
            label="Approved"
            value={approvedCount}
            icon={CheckCircle2}
            accent="text-emerald-300"
          />

          <StatCard
            label="Rejected"
            value={rejectedCount}
            icon={XCircle}
            accent="text-red-300"
          />
        </section>


        {/* Controls */}
        <section className="mb-6 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search approval requests..."
              className="w-full border border-white/[0.08] bg-[#080e15] py-3 pl-11 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-400/40"
            />
          </div>

          <div className="relative">
            <Filter
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="w-full appearance-none border border-white/[0.08] bg-[#080e15] py-3 pl-11 pr-10 text-sm text-slate-300 outline-none focus:border-cyan-400/40 md:w-48"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </section>


        {/* Requests */}
        <section className="space-y-4">
          {filteredApprovals.length > 0 ? (
            filteredApprovals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onApprove={approveRequest}
                onReject={rejectRequest}
              />
            ))
          ) : (
            <div className="border border-dashed border-white/[0.1] bg-[#080e15] px-6 py-16 text-center">
              <UserRound
                size={30}
                className="mx-auto text-slate-600"
              />

              <h3 className="mt-4 text-lg font-semibold text-slate-300">
                No approval requests found
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Try changing your search or status filter.
              </p>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}