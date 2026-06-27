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

// ---- Auth ----------------------------------------------------
// These map 1:1 to the routes in server/src/routes/authRoutes.js.
// The AuthContext is the only place that should call them.

// POST /api/auth/register -> { User Created }
export function register({ name, email, password }) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

// POST /api/auth/login -> { id, name, role }
export function login({ email, password }) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// POST /api/auth/logout -> { ok: true }
export function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

// GET /api/auth/me -> { id, name, role } | null
export function getMe() {
  return request("/api/auth/me");
}
