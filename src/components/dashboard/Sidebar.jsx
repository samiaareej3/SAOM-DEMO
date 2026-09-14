import { NavLink, useNavigate } from "react-router-dom";

const navigation = [
  { label: "Overview", path: "/dashboard" },
  { label: "Audit", path: "/audit" },
  { label: "Incidents", path: "/incidents" },
  { label: "Infrastructure", path: "/infrastructure" },
  { label: "Scanner", path: "/scanner" },
  { label: "Threat Intelligence", path: "/threat-intelligence" },
  { label: "Investigation", path: "/investigation" },
  { label: "Attack Graph", path: "/attack-graph" },
  { label: "Response & Automation", path: "/response" },
  { label: "Approvals", path: "/approvals" },
  { label: "AI Assistant", path: "/ai-assistant" },
];

export default function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("saom_token");
    localStorage.removeItem("saom_user");
    navigate("/signin", { replace: true });
  }

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-white/10 bg-[#080e15] text-slate-200">
      <div className="border-b border-white/10 p-5">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="text-left"
        >
          <div className="text-lg font-bold tracking-[0.2em] text-cyan-400">
            SAOM-AI
          </div>

          <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Security Operations
          </div>
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/dashboard"}
            className={({ isActive }) =>
              [
                "block rounded px-3 py-2 text-sm transition",
                isActive
                  ? "bg-cyan-400/10 text-cyan-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded px-3 py-2 text-left text-sm text-slate-400 transition hover:bg-red-400/10 hover:text-red-300"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}