const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";


/**
 * Get JWT token from browser storage
 */
function getToken() {
    return (
        localStorage.getItem("saom_token") ||
        sessionStorage.getItem("saom_token")
    );
}


/**
 * Generic API request helper
 */
async function apiRequest(endpoint, options = {}) {

    const token = getToken();

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",

                ...(token
                    ? {
                        Authorization: `Bearer ${token}`,
                    }
                    : {}),

                ...(options.headers || {}),
            },
        }
    );

    let data;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {

        throw new Error(
            data?.message ||
            `Request failed with status ${response.status}`
        );

    }

    return data;
}


/**
 * Dashboard statistics
 */
export async function getDashboardStats() {

    return apiRequest(
        "/api/stats"
    );

}


/**
 * Alerts
 */
export async function getAlerts() {

    return apiRequest(
        "/api/alerts"
    );

}


/**
 * Assets
 */
export async function getAssets() {

    return apiRequest(
        "/api/assets"
    );

}


/**
 * Timeline
 */
export async function getTimeline() {

    return apiRequest(
        "/api/timeline"
    );

}


/**
 * Geo threat intelligence
 */
export async function getGeoThreats() {

    return apiRequest(
        "/api/geo-threats"
    );

}


/**
 * Attack graph
 */
export async function getAttackGraph() {

    return apiRequest(
        "/api/graph"
    );

}


/**
 * Investigation
 */
export async function getInvestigation(
    alertId
) {

    return apiRequest(
        `/api/investigation/${alertId}`
    );

}


/**
 * Audit information
 */
export async function getAudit() {

    return apiRequest(
        "/api/audit"
    );

}


/**
 * SOAR health/status
 */
export async function getSOARStatus() {

    return apiRequest(
        "/api/soar"
    );

}


/**
 * SOAR actions
 */
export async function getSOARActions() {

    return apiRequest(
        "/api/soar/actions"
    );

}


/**
 * Approve SOAR action
 */
export async function approveSOARAction(
    actionId,
    approvalNote = ""
) {

    return apiRequest(
        `/api/soar/actions/${actionId}/approve`,
        {
            method: "POST",

            body: JSON.stringify({
                approved_by: "ANALYST",
                approval_note: approvalNote
            })
        }
    );

}


/**
 * Reject SOAR action
 */
export async function rejectSOARAction(
    actionId,
    approvalNote = ""
) {

    return apiRequest(
        `/api/soar/actions/${actionId}/reject`,
        {
            method: "POST",

            body: JSON.stringify({
                rejected_by: "ANALYST",
                approval_note: approvalNote
            })
        }
    );

}


/**
 * Execute approved SOAR action
 */
export async function executeSOARAction(
    actionId
) {

    return apiRequest(
        `/api/soar/actions/${actionId}/execute`,
        {
            method: "POST"
        }
    );

}


/**
 * Export helper
 */
export default {

    getDashboardStats,

    getAlerts,

    getAssets,

    getTimeline,

    getGeoThreats,

    getAttackGraph,

    getInvestigation,

    getAudit,

    getSOARStatus,

    getSOARActions,

    approveSOARAction,

    rejectSOARAction,

    executeSOARAction

};