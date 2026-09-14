export default function OverviewStats({
  activeIncidents = 0,
  criticalAlerts = 0,
  monitoredAssets = 0,
  securityScore = 0,
}) {
  const stats = [
    {
      label: "Security Score",
      value: `${securityScore}%`,
      description: "Overall security posture",
      tone: "cyan",
    },
    {
      label: "Active Incidents",
      value: activeIncidents,
      description: "Incidents requiring attention",
      tone: "orange",
    },
    {
      label: "Critical Alerts",
      value: criticalAlerts,
      description: "High-priority security alerts",
      tone: "red",
    },
    {
      label: "Monitored Assets",
      value: monitoredAssets,
      description: "Assets currently monitored",
      tone: "green",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="border border-white/10 bg-[#080e15] p-5"
        >
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            {stat.label}
          </p>

          <p className="mt-4 text-3xl font-semibold text-slate-100">
            {stat.value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {stat.description}
          </p>
        </article>
      ))}
    </section>
  );
}