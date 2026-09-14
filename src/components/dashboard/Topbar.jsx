import { useLocation } from "react-router-dom";

const pageTitles = {
  "/dashboard": "Overview",
  "/audit": "Security Audit",
  "/incidents": "Incidents",
  "/infrastructure": "Infrastructure",
  "/threat-intelligence": "Threat Intelligence",
  "/investigation": "Investigation",
  "/attack-graph": "Attack Graph",
  "/response": "Response & Automation",
  "/approvals": "Approval Queue",
  "/ai-assistant": "AI Assistant",
};

export default function Topbar() {
  const location = useLocation();

  const title =
    pageTitles[location.pathname] ||
    location.pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, " ") ||
    "Dashboard";

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#080e15] px-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400">
          SAOM-AI Workspace
        </p>

        <h1 className="mt-1 text-lg font-semibold capitalize text-slate-100">
          {title}
        </h1>
      </div>

      <div className="text-xs text-slate-500">
        Security Operations Center
      </div>
    </header>
  );
}