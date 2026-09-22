 import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";

export default function DashboardLayout({ children, connected = true }) {
  const location = useLocation();

  const content = children ?? <Outlet />;

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-slate-900 antialiased">
      {/* Persistent sidebar */}
      <Sidebar connected={connected} />

      {/* Dashboard content */}
      <div className="relative min-h-screen pt-14 lg:pl-16 lg:pt-0">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{
              duration: 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="min-h-screen"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}