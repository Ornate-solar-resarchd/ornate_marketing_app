"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const TOKEN_KEY = "marketing_token";
const USER_KEY = "marketing_user";

// Shape that mimics Clerk's user — keeps existing call sites working without rewriting.
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  emailAddresses: Array<{ emailAddress: string }>;
  publicMetadata: { role: string };
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken: () => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function buildUser(raw: {
  id: string;
  email: string;
  fullName: string;
  role: string;
}): AuthUser {
  const parts = (raw.fullName || "").split(" ");
  return {
    id: raw.id,
    email: raw.email,
    fullName: raw.fullName,
    firstName: parts[0] || raw.fullName,
    lastName: parts.slice(1).join(" "),
    imageUrl: "",
    emailAddresses: [{ emailAddress: raw.email }],
    publicMetadata: { role: raw.role },
  };
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}
function clearCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      // Ignore corrupt localStorage
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Login failed (${res.status})`);
    }
    const data = (await res.json()) as {
      token: string;
      user: { id: string; email: string; fullName: string; role: string };
    };
    const next = buildUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    setCookie(TOKEN_KEY, data.token, 7);
    setUser(next);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    clearCookie(TOKEN_KEY);
    setUser(null);
    if (typeof window !== "undefined") window.location.href = "/sign-in";
  }, []);

  const getToken = useCallback(async () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoaded, isSignedIn: !!user, getToken, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

// Drop-in replacements for Clerk's useUser / useAuth
export function useUser() {
  const { user, isLoaded, isSignedIn } = useAuthContext();
  return { user, isLoaded, isSignedIn };
}

export function useAuth() {
  const { getToken, isLoaded, isSignedIn, signOut } = useAuthContext();
  return { getToken, isLoaded, isSignedIn, signOut };
}

// Used by the custom sign-in page only.
export function useSignIn() {
  const { signIn } = useAuthContext();
  return { signIn };
}

// Replacement for Clerk's <UserButton/> — minimal click-to-sign-out
export function UserButton() {
  const { user, signOut } = useAuthContext();
  if (!user) return null;
  return (
    <button
      type="button"
      onClick={signOut}
      title={`Sign out ${user.fullName}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 9999,
        border: "1px solid #E5E7EB",
        background: "white",
        cursor: "pointer",
        fontSize: 13,
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "#E8611A",
          color: "white",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {(user.firstName || user.email)[0]?.toUpperCase()}
      </span>
      <span>Sign out</span>
    </button>
  );
}
