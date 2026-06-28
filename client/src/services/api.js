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

// ---- Books ---------------------------------------------------

// GET /api/books -> list catalog, with search & filters
// query params: ?q= (title/author), ?author= ?genre= ?year=
// ?available=true  (Level 1 search, Level 2 filters)
export function getBooks({ q, author, genre, year, available }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (author) params.set("author", author);
  if (genre) params.set("genre", genre);
  if (year) params.set("year", year);
  if (available) params.set("available", "true");
  return request(`/api/books?${params.toString()}`);
}

// GET /api/books/:id -> book detail + copies availability
export function getBook(id) {
  return request(`/api/books/${id}`);
}

// ---- Loans ---------------------------------------------------

// GET /api/loans/mine -> list current user's loans
export function getMyLoans() {
  return request("/api/loans/mine");
}

// POST /api/loans -> request a loan
export function requestLoan({ bookId }) {
  return request("/api/loans", {
    method: "POST",
    body: JSON.stringify({ bookId }),
  });
}

// POST /api/loans/:id/return -> return a loaned copy
export function returnLoan(id) {
  return request(`/api/loans/${id}/return`, {
    method: "POST",
  });
}

// GET /api/loans/all -> list all loans (admin)
export function getAllLoans() {
  return request("/api/loans/all");
}
