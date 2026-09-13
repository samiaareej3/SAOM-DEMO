import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { AnimatePresence, motion } from "framer-motion";

import Home from "./pages/Home";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import Forget from "./pages/Forget";
import Dashboard from "./pages/Dashboard";
import Audit from "./pages/Audit";

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
          <Route path="/" element={<Home />} />

          <Route path="/signin" element={<Signin />} />

          <Route path="/signup" element={<Signup />} />

          <Route path="/forgot-password" element={<Forget />} />

          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/audit" element={<Audit />} />

          {/* Temporary route placeholders */}
          <Route
            path="/incidents"
            element={
              <PagePlaceholder
                title="Incidents"
                description="Incident management workspace will be added next."
              />
            }
          />

          <Route
            path="/infrastructure"
            element={
              <PagePlaceholder
                title="Infrastructure"
                description="Infrastructure and asset monitoring will be added next."
              />
            }
          />

          <Route
            path="/threat-intelligence"
            element={
              <PagePlaceholder
                title="Threat Intelligence"
                description="Threat intelligence workspace will be added next."
              />
            }
          />

          <Route
            path="/investigation"
            element={
              <PagePlaceholder
                title="Investigation"
                description="Investigation workspace will be added next."
              />
            }
          />

          <Route
            path="/attack-graph"
            element={
              <PagePlaceholder
                title="Attack Graph"
                description="Attack graph visualization will be added next."
              />
            }
          />

          <Route
            path="/response"
            element={
              <PagePlaceholder
                title="Response & Automation"
                description="SOAR response workspace will be added next."
              />
            }
          />

          <Route
            path="/approvals"
            element={
              <PagePlaceholder
                title="Approval Queue"
                description="Approval workflow will be added next."
              />
            }
          />

          <Route
            path="/ai-assistant"
            element={
              <PagePlaceholder
                title="AI Assistant"
                description="SAOM-AI assistant integration will be added last."
              />
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
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

        {/* <button
          type="button"
          onClick={() => window.history.back()}
          className="mt-6 border border-cyan-400/30 px-4 py-2 text-xs text-cyan-300 transition hover:bg-cyan-400/[0.08]"
        >
          Go Back
        </button> */}
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