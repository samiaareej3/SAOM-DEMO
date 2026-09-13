const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function getToken() {
  return (
    localStorage.getItem("saom_token") ||
    sessionStorage.getItem("saom_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),

    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const responseText = await response.text();

  let data;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = responseText;
  }

  if (!response.ok) {
    console.error("SAOM API REQUEST FAILED", {
      method: options.method || "GET",
      url,
      status: response.status,
      hasToken: Boolean(token),
      response: data,
    });

    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

export function apiGet(endpoint, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: "GET",
  });
}

export function apiPost(endpoint, body = {}, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPatch(endpoint, body = {}, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function apiPut(endpoint, body = {}, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function apiDelete(endpoint, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: "DELETE",
  });
}

export default apiRequest;