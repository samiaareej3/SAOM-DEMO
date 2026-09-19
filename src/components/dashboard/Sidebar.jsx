/* ============================================================================
   SAOM-AI — NAVIGATION RAIL

   Behaviour
   ---------
   The rail is `position: fixed` and 64px wide. On pointer enter (or keyboard
   focus) it grows to 256px *over* the page. Page content is padded by the
   collapsed width only and never re-flows, so expanding the rail cannot make
   a table or a graph jump sideways.

   Width is animated with a CSS transition rather than Framer Motion: it is a
   single property on a single element, it runs on every route, and keeping it
   in CSS means it costs nothing at runtime.

   Below the `lg` breakpoint the rail is replaced by a top bar and a slide-in
   drawer, because a hover affordance does not exist on touch.
============================================================================ */

import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import {
  Activity,
  BadgeCheck,
  Boxes,
  Crosshair,
  FileSearch,
  Gauge,
  LayoutDashboard,
  Menu,
  Radar,
  ScrollText,
  ShieldAlert,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";

import { FOCUS } from "../ui/tokens";

/*
 * Routes mirror the paths the existing pages already navigate to.
 * If a path differs in your router, change it here only — every page reads
 * navigation from this one array.
 */
export const NAV_SECTIONS = [
  {
    label: "Monitor",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "Incidents", to: "/incidents", icon: ShieldAlert },
      { label: "Infrastructure", to: "/infrastructure", icon: Boxes },
    ],
  },
  {
    label: "Analyse",
    items: [
      { label: "Investigation", to: "/investigation", icon: FileSearch },
      { label: "Attack Graph", to: "/attack-graph", icon: Crosshair },
      { label: "Threat Intelligence", to: "/threat-intelligence", icon: Radar },
      { label: "Scanner", to: "/scanner", icon: Gauge },
    ],
  },
  {
    label: "Respond",
    items: [
      { label: "Automation", to: "/automation", icon: Workflow },
      { label: "Approvals", to: "/approvals", icon: BadgeCheck },
      { label: "Audit", to: "/audit", icon: ScrollText },
    ],
  },
  {
    label: "Assist",
    items: [{ label: "AI Assistant", to: "/ai-assistant", icon: Sparkles }],
  },
];

export const RAIL_WIDTH = 64;
export const RAIL_WIDTH_EXPANDED = 256;

function Mark({ expanded }) {
  return (
    <div className="flex h-16 items-center gap-3 px-[18px]">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900">
        <Activity size={15} className="text-white" strokeWidth={2.4} />
      </span>

      <span
        className={`whitespace-nowrap text-[15px] font-semibold tracking-tight text-slate-900 transition-opacity duration-200 motion-reduce:transition-none ${
          expanded ? "opacity-100 delay-75" : "opacity-0"
        }`}
      >
        SAOM<span className="text-indigo-600">·</span>AI
      </span>
    </div>
  );
}

function NavItem({ item, expanded, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={expanded ? undefined : item.label}
      className={({ isActive }) =>
        `group/item relative flex h-10 items-center gap-3 rounded-lg px-[14px] transition-colors duration-150 ${FOCUS} ${
          isActive
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-600"
              aria-hidden="true"
            />
          )}

          <Icon size={18} strokeWidth={isActive ? 2.2 : 1.9} className="shrink-0" />

          <span
            className={`whitespace-nowrap text-sm font-medium transition-opacity duration-200 ${
              expanded ? "opacity-100 delay-75" : "opacity-0"
            }`}
          >
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
}

function RailBody({ expanded, onNavigate, connected }) {
  return (
    <>
      <Mark expanded={expanded} />

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-1.5">
            <p
              className={`h-6 overflow-hidden px-[14px] text-[11px] font-medium leading-6 text-slate-400 transition-opacity duration-200 ${
                expanded ? "opacity-100 delay-75" : "opacity-0"
              }`}
              aria-hidden={!expanded}
            >
              {section.label}
            </p>

            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  expanded={expanded}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-[14px] py-3.5">
        <div className="flex items-center gap-3">
          <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
            SA
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                connected ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
          </span>

          <div
            className={`min-w-0 transition-opacity duration-200 ${
              expanded ? "opacity-100 delay-75" : "opacity-0"
            }`}
          >
            <p className="truncate whitespace-nowrap text-xs font-medium text-slate-900">
              Security analyst
            </p>

            <p className="truncate whitespace-nowrap text-[11px] text-slate-500">
              {connected ? "Backend connected" : "Backend unreachable"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Sidebar({ connected = true }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const expanded = hovered || focused;

  useEffect(() => {
    if (!drawerOpen) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") setDrawerOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <>
      {/* ---------------------------------------------- desktop hover rail */}

      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setFocused(false);
          }
        }}
        style={{ width: expanded ? RAIL_WIDTH_EXPANDED : RAIL_WIDTH }}
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-slate-200 bg-white transition-[width,box-shadow] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none lg:flex ${
          expanded ? "shadow-xl shadow-slate-900/5" : ""
        }`}
        aria-label="Primary"
      >
        <RailBody expanded={expanded} connected={connected} />
      </aside>

      {/* ------------------------------------------------ mobile / tablet */}

      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={`rounded-lg p-2 text-slate-600 hover:bg-slate-100 ${FOCUS}`}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
        >
          <Menu size={18} />
        </button>

        <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-slate-900">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900">
            <Activity size={13} className="text-white" strokeWidth={2.4} />
          </span>
          SAOM<span className="-ml-2 text-indigo-600">·</span>AI
        </span>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/25"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          <aside
            className="relative flex h-full w-[260px] flex-col border-r border-slate-200 bg-white shadow-2xl"
            aria-label="Primary"
          >
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className={`absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 ${FOCUS}`}
              aria-label="Close navigation"
            >
              <X size={16} />
            </button>

            <RailBody
              expanded
              connected={connected}
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}