// ============================================================
//  AuthContext.js   (no JSX -> not a component file)
//  Holds the context object and the useAuth() hook.
//  Kept separate from the provider so each file exports only
//  one "kind" of thing (Fast Refresh is happy).
// ============================================================

import { createContext, useContext } from "react";

// The context object. Default null = "no provider above me yet".
export const AuthContext = createContext(null);

// Hook so components write `const { user } = useAuth()` instead
// of importing the context object everywhere.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
