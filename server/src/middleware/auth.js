// ============================================================
//  auth.js  —  Authentication / authorization middleware
//  Use these to protect routes that require a logged-in user
//  or an admin (librarian).
// ============================================================

// Allow the request only if a user is logged in (session set).
export function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// Allow the request only if the logged-in user is an admin.
export function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}
