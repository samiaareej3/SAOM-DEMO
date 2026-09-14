
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { AnimatePresence, motion } from "framer-motion";

// Public pages
import Home from "./pages/Home";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import Forget from "./pages/Forget";

// Dashboard layout
import DashboardLayout from "./components/dashboard/DashboardLayout";

// Dashboard pages
import Dashboard from "./pages/Dashboard";
import Approvals from "./pages/Approvals";
import Audit from "./pages/Audit";
import Incidents from "./pages/Incidents";
import Infrastructure from "./pages/Infrastructure";
import ThreatIntelligence from "./pages/ThreatIntelligence";
import Investigation from "./pages/Investigation";
import AttackGraph from "./pages/AttackGraph";
import Automation from "./pages/Automation";
import Scanner from "./pages/Scanner";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 48 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -48 }}
        transition={{
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="min-h-screen"
      >
        <Routes location={location}>
          {/* =========================
              PUBLIC PAGES
          ========================== */}
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<Forget />} />

          {/* =========================
              DASHBOARD LAYOUT
              Sidebar + Topbar
          ========================== */}
          <Route element={<DashboardLayout />}>
            {/* Overview */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Security modules */}
            <Route path="/audit" element={<Audit />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route
              path="/infrastructure"
              element={<Infrastructure />}
            />
            <Route
              path="/threat-intelligence"
              element={<ThreatIntelligence />}
            />
            <Route
              path="/investigation"
              element={<Investigation />}
            />
            <Route
              path="/attack-graph"
              element={<AttackGraph />}
            />

            {/* Optional Attack Graph alias */}
            <Route
              path="/attackgraph"
              element={<AttackGraph />}
            />

            {/* Scanner */}
            <Route path="/scanner" element={<Scanner />} />

            {/* SOAR / Automation */}
            <Route path="/automation" element={<Automation />} />
            <Route path="/response" element={<Automation />} />
            <Route path="/soar" element={<Automation />} />

            {/* Approvals */}
            <Route path="/approvals" element={<Approvals />} />

            {/* AI Assistant */}
            <Route
              path="/ai-assistant"
              element={
                <PagePlaceholder
                  title="AI Assistant"
                  description="SAOM-AI assistant integration will be added last."
                />
              }
            />

            {/* Settings */}
            <Route
              path="/settings"
              element={
                <PagePlaceholder
                  title="Settings"
                  description="Settings and profile management will be added next."
                />
              }
            />
          </Route>

          {/* =========================
              FALLBACK
          ========================== */}
          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function PagePlaceholder({ title, description }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05080d] px-6 text-slate-200">
      <section className="w-full max-w-xl border border-white/[0.08] bg-[#080e15] p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400">
          SAOM-AI / Workspace
        </p>

        <h1 className="mt-4 text-3xl font-semibold text-slate-100">
          {title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}