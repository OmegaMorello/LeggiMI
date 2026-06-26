// All calls to the backend live here, so components never write URLs directly.

// Generic helper: does the fetch and parses the JSON response.
async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include", // send the session cookie
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// First test call: the health check.
export function getHealth() {
  return request("/api/health");
}
