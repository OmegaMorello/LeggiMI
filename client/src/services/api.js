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

// POST /api/books -> create a book (admin)
export function createBook(data) {
  return request("/api/books", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// PUT /api/books/:id -> update a book (admin)
export function updateBook(id, data) {
  return request(`/api/books/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// DELETE /api/books/:id -> delete a book (admin)
export function deleteBook(id) {
  return request(`/api/books/${id}`, { method: "DELETE" });
}

// GET /api/books/lookup/:isbn -> lookup book by ISBN on Open Library
export function lookupIsbn(isbn) {
  return request(`/api/books/lookup/${isbn}`);
}

// POST /api/books/:id/cover -> upload cover image (admin, multipart)
export function uploadCover(bookId, file) {
  const formData = new FormData();
  formData.append("cover", file);
  return fetch(`/api/books/${bookId}/cover`, {
    method: "POST",
    credentials: "include",
    body: formData,
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Upload failed: ${res.status}`);
    }
    return res.json();
  });
}

// POST /api/books/:id/copies -> add one or more copies (admin)
export function addCopy(bookId, quantity = 1) {
  return request(`/api/books/${bookId}/copies`, {
    method: "POST",
    body: JSON.stringify({ quantity }),
  });
}

// DELETE /api/books/:id/copies/:copyId -> remove a copy (admin)
export function removeCopy(bookId, copyId) {
  return request(`/api/books/${bookId}/copies/${copyId}`, { method: "DELETE" });
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

// ---- Reservations --------------------------------------------

export function createReservation({ bookId }) {
  return request("/api/reservations", {
    method: "POST",
    body: JSON.stringify({ bookId }),
  });
}

export function getMyReservations() {
  return request("/api/reservations/mine");
}

export function cancelReservation(id) {
  return request(`/api/reservations/${id}`, { method: "DELETE" });
}

export function getAllReservations() {
  return request("/api/reservations/all");
}

// ---- Stats ---------------------------------------------------

export function getMostRequested(limit) {
  const params = limit ? `?limit=${limit}` : "";
  return request(`/api/stats/most-requested${params}`);
}

// ---- Reminders -----------------------------------------------

export function sendReminders() {
  return request("/api/reminders/send", { method: "POST" });
}

// ---- Import / Export -----------------------------------------

export async function exportBooksCsv() {
  const res = await fetch("/api/books/export/csv", { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Export failed: ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "catalogo.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importBooksCsv(file, { dryRun = false, duplicateStrategy = "skip" } = {}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("dryRun", String(dryRun));
  formData.append("duplicateStrategy", duplicateStrategy);
  return fetch("/api/books/import/csv", {
    method: "POST",
    credentials: "include",
    body: formData,
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Import failed: ${res.status}`);
    }
    return res.json();
  });
}
