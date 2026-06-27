// ============================================================
//  AuthProvider.jsx   (exports ONLY the component)
//  Global "box" holding the logged-in user, readable anywhere.
//  - On startup: ask the server (GET /me) if a session is open.
//  - login / register / logout update the user value.
//  Components read it through useAuth() (see AuthContext.js).
// ============================================================

import { useEffect, useState } from "react";
import * as api from "../services/api";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  // null  = not logged in
  // object = { id, name, role }
  const [user, setUser] = useState(null);

  // true while the first /me call is still running, so the UI
  // doesn't flash the login page before we know who the user is.
  const [loading, setLoading] = useState(true);

  // --- Bootstrap: restore an existing session on first load ----
  useEffect(() => {
    api
      .getMe()
      .then((u) => setUser(u)) // u is the user object or null
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // --- Actions exposed to the rest of the app -----------------
  // Each one talks to the API, then updates local state.

  async function login(credentials) {
    const u = await api.login(credentials); // throws on 401
    setUser(u);
    return u;
  }

  async function register(data) {
    // Create the account, then log in automatically with the same
    // credentials. The server opens the session and returns the user,
    // which login() puts into state -> the app re-renders as logged in.
    await api.register(data);
    return login({ email: data.email, password: data.password });
  }

  async function logout() {
    await api.logout();
    setUser(null);
  }

  const value = { user, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
