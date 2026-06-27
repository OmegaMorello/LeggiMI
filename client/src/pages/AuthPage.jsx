// ============================================================
//  AuthPage.jsx
//  Login + Registration. Reads/writes the user through useAuth().
//  One component, two modes ("login" | "register") switched by a tab.
// ============================================================

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

export default function AuthPage() {
  const { login, register } = useAuth();

  // Which form is showing: "login" or "register".
  const [mode, setMode] = useState("login");

  // One state object for all fields keeps the handlers short.
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  // Last error message to show the user (null = no error).
  const [error, setError] = useState(null);

  // True while a request is in flight: disables the button so the
  // user can't submit twice (double account / double login).
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === "login";

  // Generic change handler: updates the field matching input "name".
  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  // Switch tab: reset the error and the password so it isn't carried over.
  function switchMode(next) {
    setMode(next);
    setError(null);
    setForm((f) => ({ ...f, password: "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password });
      } else {
        // register() auto-logs-in on success (see AuthProvider).
        await register(form);
      }
      // On success there is nothing else to do here: `user` in the
      // context changed, so App re-renders and shows the app.
    } catch (err) {
      setError(err.message); // e.g. "Invalid credentials"
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo" aria-hidden="true">
            📖
          </div>
          <h1 className="auth-title">LeggiMI</h1>
          <p className="auth-tagline">La tua biblioteca, a portata di click</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            aria-pressed={isLogin}
            className={`auth-tab ${isLogin ? "is-active" : ""}`}
            onClick={() => switchMode("login")}
          >
            Accedi
          </button>
          <button
            type="button"
            aria-pressed={!isLogin}
            className={`auth-tab ${!isLogin ? "is-active" : ""}`}
            onClick={() => switchMode("register")}
          >
            Registrati
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Name only matters when registering */}
          {!isLogin && (
            <label className="auth-field">
              <span>Nome</span>
              <input
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Mario Rossi"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="mario@esempio.it"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              minLength={isLogin ? undefined : 8}
              required
            />
            {!isLogin && (
              <small className="auth-hint">Almeno 8 caratteri.</small>
            )}
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting
              ? "Attendere…"
              : isLogin
                ? "Accedi"
                : "Crea account"}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Non hai un account? " : "Hai già un account? "}
          <button
            type="button"
            className="auth-link"
            onClick={() => switchMode(isLogin ? "register" : "login")}
          >
            {isLogin ? "Registrati" : "Accedi"}
          </button>
        </p>
      </div>
    </div>
  );
}
