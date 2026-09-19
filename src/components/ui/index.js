/* ============================================================================
   SAOM-AI — DESIGN SYSTEM ENTRY POINT

   Pages import everything visual from here:

     import { AppShell, PageHeader, StatCard } from "../components/ui";
============================================================================ */

export * from "./tokens";
export * from "./primitives";
export * from "./charts";

export { default as AppShell } from "../dashboard/AppShell";
export { default as Sidebar, NAV_SECTIONS } from "../dashboard/Sidebar";