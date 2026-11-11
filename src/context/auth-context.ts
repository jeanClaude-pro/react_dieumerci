import * as React from "react";
import type { AuthState, User } from "../types/auth";

export type AuthContextValue = AuthState & {
  setAuth: (v: { token: string | null; user: User | null }) => void;
  /** Clears this browser only. Prefer logout(), which also ends the session on the server. */
  clearAuth: () => void;
  /** Ends the session on the server, then clears this browser and goes to /login. */
  logout: () => Promise<void>;
};

export const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined
);
