import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { RevealStatus } from "@transcendence/shared";
import { api } from "../api/client.js";
import { useAuth } from "./AuthContext.js";

const defaultReveals: RevealStatus = {
  tokensRevealed: false,
  walletRevealed: false,
  gasRevealed: false,
  dashboardRevealed: false,
};

interface RevealContextValue extends RevealStatus {
  refresh: () => Promise<void>;
}

const RevealContext = createContext<RevealContextValue | null>(null);

export function RevealProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [reveals, setReveals] = useState<RevealStatus>(defaultReveals);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<RevealStatus>("/api/v1/users/me/reveals");
      setReveals(data);
    } catch {
      // Keep defaults if request fails
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    api.get<RevealStatus>("/api/v1/users/me/reveals").then(
      (data) => {
        if (!cancelled) setReveals(data);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <RevealContext.Provider value={{ ...reveals, refresh }}>
      {children}
    </RevealContext.Provider>
  );
}

export function useReveals(): RevealContextValue {
  const ctx = useContext(RevealContext);
  if (!ctx) throw new Error("useReveals must be used within RevealProvider");
  return ctx;
}
