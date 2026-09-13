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

/* =========================================================
   SOAR
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
    throw new Error("No alert ID was provided.");
  }

  return apiPost(
    `/api/soar/actions/from-alert/${encodeURIComponent(alertId)}`
  );
}

export function approveSOARAction(actionId, body = {}) {
  if (!actionId) {
    throw new Error("SOAR action ID is required.");
  }

  return apiPost(
    `/api/soar/actions/${encodeURIComponent(actionId)}/approve`,
    body
  );
}

export function rejectSOARAction(actionId, body = {}) {
  if (!actionId) {
    throw new Error("SOAR action ID is required.");
  }

  return apiPost(
    `/api/soar/actions/${encodeURIComponent(actionId)}/reject`,
    body
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

export function backtrackAttack(targetAssetId) {
  if (!targetAssetId) {
    throw new Error("Target asset ID is required.");
  }

  return apiPost(
    `/api/investigation/backtrack/${encodeURIComponent(
      targetAssetId
    )}`
  );
}

export function investigateAttack(targetAssetId) {
  if (!targetAssetId) {
    throw new Error("Target asset ID is required.");
  }

  return apiPost(
    `/api/investigation/${encodeURIComponent(targetAssetId)}`
  );
}

/* =========================================================
   THREAT SIMULATION
   ========================================================= */

export function simulateThreat(body = {}) {
  return apiPost("/api/threats/simulate", body);
}

/* =========================================================
   ENVIRONMENT SCANNER
   ========================================================= */

export function scanEnvironment(simulateThreats = true) {
  return apiPost("/api/scanner/scan", {
    simulateThreats,
  });
}

/* =========================================================
   GEO INTELLIGENCE
   ========================================================= */

export function lookupIP(ip) {
  if (!ip) {
    throw new Error("IP address is required.");
  }

  return apiGet(
    `/api/geo-threats/${encodeURIComponent(ip)}`
  );
}