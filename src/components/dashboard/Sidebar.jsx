 import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Bot,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileClock,
  GitBranch,
  Globe2,
  LayoutDashboard,
  Network,
  Radar,
  ScanSearch,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const RAIL_WIDTH = 64;
const EXPANDED_WIDTH = 256;

export const NAV_SECTIONS = [
  {
    label: "Monitor",
    items: [
      {
        label: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Incidents",
        to: "/incidents",
        icon: AlertTriangle,
      },
      {
        label: "Infrastructure",
        to: "/infrastructure",
        icon: Boxes,
      },
    ],
  },
  {
    label: "Analyse",
    items: [
      {
        label: "Investigation",
        to: "/investigation",
        icon: ScanSearch,
      },
      {
        label: "Attack Graph",
        to: "/attack-graph",
        icon: GitBranch,
      },
      {
        label: "Threat Intelligence",
        to: "/threat-intelligence",
        icon: Globe2,
      },
      {
        label: "Scanner",
        to: "/scanner",
        icon: Radar,
      },
    ],
  },
  {
    label: "Respond",
    items: [
      {
        label: "Automation",
        to: "/automation",
        icon: Workflow,
      },
      {
        label: "Approvals",
        to: "/approvals",
        icon: ClipboardCheck,
      },
      {
        label: "Audit",
        to: "/audit",
        icon: FileClock,
      },
    ],
  },
  {
    label: "Assist",
    items: [
      {
        label: "AI Assistant",
        to: "/ai-assistant",
        icon: Bot,
      },
    ],
  },
];

export default function Sidebar({ connected = true }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden border-r border-slate-200 bg-white lg:block"
        style={{
          width: expanded ? EXPANDED_WIDTH : RAIL_WIDTH,
          transition: "width 180ms ease",
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div
            className="flex h-16 items-center border-b border-slate-200 px-4"
            style={{
              justifyContent: expanded ? "flex-start" : "center",
            }}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#ED1C2E] text-[#ED1C2E]">
                <ShieldCheck size={16} strokeWidth={2} />
              </div>

              {expanded && (
                <span className="whitespace-nowrap text-sm font-bold tracking-[0.12em] text-slate-900">
                  SAOM<span className="text-[#ED1C2E]">AI</span>
                </span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 py-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label} className="mb-5">
                {expanded && (
                  <div className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    {section.label}
                  </div>
                )}

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          [
                            "group relative flex h-10 items-center gap-3 px-3 text-sm transition-colors",
                            expanded ? "justify-start" : "justify-center",
                            isActive
                              ? "bg-slate-50 text-slate-950"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                          ].join(" ")
                        }
                        title={!expanded ? item.label : undefined}
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-[#ED1C2E]" />
                            )}

                            <Icon
                              size={17}
                              strokeWidth={isActive ? 2.2 : 1.8}
                              className="shrink-0"
                            />

                            {expanded && (
                              <span className="whitespace-nowrap">
                                {item.label}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Connection status */}
          <div className="border-t border-slate-200 p-3">
            <div
              className={[
                "flex items-center gap-2",
                expanded ? "px-2" : "justify-center",
              ].join(" ")}
              title={!expanded ? "System connection" : undefined}
            >
              <span
                className={[
                  "h-2 w-2 rounded-full",
                  connected ? "bg-emerald-500" : "bg-red-500",
                ].join(" ")}
              />

              {expanded && (
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  {connected ? "Systems connected" : "Connection issue"}
                </span>
              )}
            </div>
          </div>

          {/* Expand indicator */}
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:text-slate-900 xl:flex"
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? (
              <ChevronLeft size={13} />
            ) : (
              <ChevronRight size={13} />
            )}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center border border-[#ED1C2E] text-[#ED1C2E]">
            <ShieldCheck size={16} />
          </div>

          <span className="text-sm font-bold tracking-[0.12em] text-slate-900">
            SAOM<span className="text-[#ED1C2E]">AI</span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={[
              "h-2 w-2 rounded-full",
              connected ? "bg-emerald-500" : "bg-red-500",
            ].join(" ")}
          />

          <Activity size={15} className="text-slate-400" />
        </div>
      </div>
    </>
  );
}