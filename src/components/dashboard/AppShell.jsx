/* ============================================================================
   SAOM-AI — APP SHELL

   Wraps a page with the navigation rail and the canvas background.

   Content is offset by the *collapsed* rail width only (lg:pl-16). The rail
   expands over the top of that padding, so nothing below it moves.

   Used per page, so no router change is needed. If your routes already nest
   pages inside DashboardLayout, use that instead and drop <AppShell> from the
   individual pages — see DashboardLayout.jsx in this folder.
============================================================================ */

import Sidebar from "./Sidebar";

export default function AppShell({ children, connected = true }) {
  return (
    <div className="min-h-screen bg-[#F6F7F9] text-slate-900 antialiased">
      <Sidebar connected={connected} />

      <div className="pt-14 lg:pl-16 lg:pt-0">{children}</div>
    </div>
  );
}