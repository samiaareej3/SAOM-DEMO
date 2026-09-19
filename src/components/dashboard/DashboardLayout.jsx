/* ============================================================================
   SAOM-AI — DASHBOARD LAYOUT

   Route-level alternative to wrapping each page in <AppShell>.

   Works with either router pattern:

     <Route element={<DashboardLayout />}>        // renders <Outlet />
       <Route path="/dashboard" element={<Dashboard />} />
     </Route>

     <DashboardLayout><Dashboard /></DashboardLayout>   // renders children

   If you adopt this, remove the <AppShell> wrapper from each page — otherwise
   the rail renders twice.

   Topbar is intentionally not mounted here: each redesigned page carries its
   own <PageHeader> with the title, live status and page actions, which is the
   more useful per-page chrome. If you want to keep the old Topbar as well,
   render it directly above {content} below.
============================================================================ */

import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";

export default function DashboardLayout({ children, connected = true }) {
  const content = children ?? <Outlet />;

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-slate-900 antialiased">
      <Sidebar connected={connected} />

      <div className="pt-14 lg:pl-16 lg:pt-0">{content}</div>
    </div>
  );
}