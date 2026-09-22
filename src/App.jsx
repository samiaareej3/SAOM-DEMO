 import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { AnimatePresence, motion } from "framer-motion";

// ============================================================
// PUBLIC PAGES
// ============================================================

import Home from "./pages/Home";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import Forget from "./pages/Forget";

// ============================================================
// DASHBOARD LAYOUT
// ============================================================

import DashboardLayout from "./components/dashboard/DashboardLayout";

// ============================================================
// DASHBOARD PAGES
// ============================================================

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

// ============================================================
// PUBLIC ROUTES
// ============================================================

function PublicRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: -8,
        }}
        transition={{
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="min-h-screen"
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />

          <Route path="/signin" element={<Signin />} />

          <Route path="/signup" element={<Signup />} />

          <Route
            path="/forgot-password"
            element={<Forget />}
          />

          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// DASHBOARD ROUTES
// ============================================================
//
// IMPORTANT:
// DashboardLayout stays mounted while the page inside the
// Outlet changes. This keeps the Sidebar persistent.
//
// ============================================================

function DashboardRoutes() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>

        {/* -------------------------------------------------- */}
        {/* OVERVIEW */}
        {/* -------------------------------------------------- */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* -------------------------------------------------- */}
        {/* MONITOR */}
        {/* -------------------------------------------------- */}

        <Route
          path="/incidents"
          element={<Incidents />}
        />

        <Route
          path="/infrastructure"
          element={<Infrastructure />}
        />

        {/* -------------------------------------------------- */}
        {/* ANALYSE */}
        {/* -------------------------------------------------- */}

        <Route
          path="/investigation"
          element={<Investigation />}
        />

        <Route
          path="/attack-graph"
          element={<AttackGraph />}
        />

        {/* Backwards-compatible alias */}
        <Route
          path="/attackgraph"
          element={<AttackGraph />}
        />

        <Route
          path="/threat-intelligence"
          element={<ThreatIntelligence />}
        />

        <Route
          path="/scanner"
          element={<Scanner />}
        />

        {/* -------------------------------------------------- */}
        {/* RESPOND */}
        {/* -------------------------------------------------- */}

        <Route
          path="/automation"
          element={<Automation />}
        />

        {/* Existing aliases */}
        <Route
          path="/response"
          element={<Automation />}
        />

        <Route
          path="/soar"
          element={<Automation />}
        />

        <Route
          path="/approvals"
          element={<Approvals />}
        />

        <Route
          path="/audit"
          element={<Audit />}
        />

        {/* -------------------------------------------------- */}
        {/* ASSIST */}
        {/* -------------------------------------------------- */}

        <Route
          path="/ai-assistant"
          element={
            <PagePlaceholder
              title="AI Assistant"
              description="SAOM-AI assistant integration will be added last."
            />
          }
        />

        {/* -------------------------------------------------- */}
        {/* SETTINGS */}
        {/* -------------------------------------------------- */}

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
    </Routes>
  );
}

// ============================================================
// PLACEHOLDER
// ============================================================

function PagePlaceholder({
  title,
  description,
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6F7F9] px-6 text-slate-900">

      <section className="w-full max-w-xl border border-slate-200 bg-white p-8">

        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ED1C2E]">
          SAOM-AI / Workspace
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {description}
        </p>

      </section>

    </main>
  );
}

// ============================================================
// APP ROUTER
// ============================================================

function AppRoutes() {
  const location = useLocation();

  const dashboardPaths = [
    "/dashboard",
    "/audit",
    "/incidents",
    "/infrastructure",
    "/threat-intelligence",
    "/investigation",
    "/attack-graph",
    "/attackgraph",
    "/scanner",
    "/automation",
    "/response",
    "/soar",
    "/approvals",
    "/ai-assistant",
    "/settings",
  ];

  const isDashboardRoute =
    dashboardPaths.includes(location.pathname);

  return isDashboardRoute
    ? <DashboardRoutes />
    : <PublicRoutes />;
}

// ============================================================
// ROOT APP
// ============================================================

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}