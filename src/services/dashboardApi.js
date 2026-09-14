import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
} from "./apiClient";

/* =========================================================
   DASHBOARD
========================================================= */

export function getDashboardStats() {
  return apiGet("/api/stats");
}

export function getAttackTimeline() {
  return apiGet("/api/timeline");
}

/* =========================================================
   ALERTS
========================================================= */

export function getAlerts(params = "") {
  const query = params ? `?${params}` : "";

  return apiGet(`/api/alerts${query}`);
}

export function getAlertById(alertId) {
  if (!alertId) {
    throw new Error("Alert ID is required.");
  }

  return apiGet(
    `/api/alerts/${encodeURIComponent(alertId)}`
  );
}

export function updateAlert(alertId, body = {}) {
  if (!alertId) {
    throw new Error("Alert ID is required.");
  }

  return apiPatch(
    `/api/alerts/${encodeURIComponent(alertId)}`,
    body
  );
}

export function deleteAlert(alertId) {
  if (!alertId) {
    throw new Error("Alert ID is required.");
  }

  return apiDelete(
    `/api/alerts/${encodeURIComponent(alertId)}`
  );
}

/* =========================================================
   ASSETS
========================================================= */

export function getAssets(params = "") {
  const query = params ? `?${params}` : "";

  return apiGet(`/api/assets${query}`);
}

export function getAssetById(assetId) {
  if (!assetId) {
    throw new Error("Asset ID is required.");
  }

  return apiGet(
    `/api/assets/${encodeURIComponent(assetId)}`
  );
}

/* =========================================================
   RISK
========================================================= */

export function getRiskScore() {
  return apiGet("/api/risk");
}

/* =========================================================
   SECURITY AUDIT
========================================================= */

export function runSecurityAudit(body = {}) {
  return apiPost("/api/audit/run", {
    trigger_type: body.trigger_type || "MANUAL",
    generated_by: body.generated_by || "SAOM-AI",
  });
}

export function getAuditTriggers() {
  return apiGet("/api/audit/triggers");
}

export function getAuditHistory(limit = 25) {
  return apiGet(`/api/audit/history?limit=${limit}`);
}

export function getAuditById(auditId) {
  if (!auditId) {
    throw new Error("Audit ID is required.");
  }

  return apiGet(
    `/api/audit/${encodeURIComponent(auditId)}`
  );
}

export function getAuditReport(auditId) {
  if (!auditId) {
    throw new Error("Audit ID is required.");
  }

  return apiGet(
    `/api/report/${encodeURIComponent(auditId)}`
  );
}

export function getAuditReportPDF(auditId) {
  if (!auditId) {
    throw new Error("Audit ID is required.");
  }

  return apiGet(
    `/api/report/${encodeURIComponent(auditId)}/pdf`
  );
}

/* =========================================================
   SOAR / AUTOMATION
========================================================= */

export function getSOARHealth() {
  return apiGet("/api/soar/health");
}

export function getSOARActions(params = "") {
  const query = params ? `?${params}` : "";

  return apiGet(`/api/soar/actions${query}`);
}

export function getSOARActionById(actionId) {
  if (!actionId) {
    throw new Error("SOAR action ID is required.");
  }

  return apiGet(
    `/api/soar/actions/${encodeURIComponent(actionId)}`
  );
}

export function createSOARPlaybook(alertId) {
  if (!alertId) {
    throw new Error("Alert ID is required.");
  }

  return apiPost(
    `/api/soar/actions/from-alert/${encodeURIComponent(alertId)}`
  );
}

export function approveSOARAction(
  actionId,
  body = {}
) {
  if (!actionId) {
    throw new Error("SOAR action ID is required.");
  }

  return apiPost(
    `/api/soar/actions/${encodeURIComponent(actionId)}/approve`,
    {
      approved_by: body.approved_by || "ANALYST",
      approval_note: body.approval_note || "",
    }
  );
}

export function rejectSOARAction(
  actionId,
  body = {}
) {
  if (!actionId) {
    throw new Error("SOAR action ID is required.");
  }

  return apiPost(
    `/api/soar/actions/${encodeURIComponent(actionId)}/reject`,
    {
      rejected_by: body.rejected_by || "ANALYST",
      approval_note: body.approval_note || "",
    }
  );
}

export function executeSOARAction(actionId) {
  if (!actionId) {
    throw new Error("SOAR action ID is required.");
  }

  return apiPost(
    `/api/soar/actions/${encodeURIComponent(actionId)}/execute`
  );
}

/* =========================================================
   INVESTIGATION
========================================================= */

export function investigateAttack(assetId) {
  if (!assetId) {
    throw new Error("Asset ID is required.");
  }

  return apiGet(
    `/api/investigation/asset/${encodeURIComponent(assetId)}`
  );
}

/*
 * The current backend does not expose a separate
 * /backtrack/:assetId route.
 *
 * The investigation endpoint already runs:
 * - Attack backtracking
 * - Geo intelligence
 * - Combined investigation engine
 */

export function backtrackAttack(assetId) {
  if (!assetId) {
    throw new Error("Asset ID is required.");
  }

  return apiGet(
    `/api/investigation/asset/${encodeURIComponent(assetId)}`
  );
}

/* =========================================================
   THREAT INTELLIGENCE
========================================================= */

export function simulateThreat(body = {}) {
  return apiPost("/api/threats/simulate", body);
}

export function lookupIP(ip) {
  if (!ip) {
    throw new Error("IP address is required.");
  }

  return apiGet(
    `/api/geo-threats/${encodeURIComponent(ip)}`
  );
}

/* =========================================================
   ENVIRONMENT SCANNER
========================================================= */

export function scanEnvironment(simulateThreats = true) {
  return apiPost("/api/scanner/environment", {
    simulateThreats,
  });
}

/* =========================================================
   ATTACK GRAPH
========================================================= */

export function getAttackGraph() {
  return apiGet("/api/graph");
}

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {
  getDashboardStats,
  getAttackTimeline,

  getAlerts,
  getAlertById,
  updateAlert,
  deleteAlert,

  getAssets,
  getAssetById,

  getRiskScore,

  runSecurityAudit,
  getAuditTriggers,
  getAuditHistory,
  getAuditById,
  getAuditReport,
  getAuditReportPDF,

  getSOARHealth,
  getSOARActions,
  getSOARActionById,
  createSOARPlaybook,
  approveSOARAction,
  rejectSOARAction,
  executeSOARAction,

  backtrackAttack,
  investigateAttack,

  simulateThreat,
  lookupIP,
  scanEnvironment,

  getAttackGraph,
};