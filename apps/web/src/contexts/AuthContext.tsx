/**
 * @file AuthContext — Auth Context — provides authentication state and actions.
 * FR: Contexte Auth — fournit l'etat d'authentification et les actions.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  UserProfile,
  RegisterInput,
  LoginInput,
} from "@transcendence/shared";
import { authApi } from "../api/auth.js";
import { ApiError } from "../api/client.js";
import { usersApi } from "../api/users.js";
import i18n from "../i18n.js";

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requires2FA: boolean;
}

interface AuthContextValue extends AuthState {
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Locales accepted by the API (ar is frontend-only, not persisted server-side)
const API_LOCALES: ReadonlySet<string> = new Set(["en", "fr", "es"]);

/**
 * After login, prefer the user's local language choice (localStorage) over the
 * server locale. If they differ, keep the local language and sync it to the
 * server. If they match (or there is no valid local preference), apply the
 * server locale as before.
 */
function syncLocaleOnLogin(serverLocale: string | undefined): void {
  const localLocale = i18n.language;

  if (API_LOCALES.has(localLocale) && localLocale !== serverLocale) {
    // User chose a language while logged out — persist it to the server.
    usersApi.updateProfile({ locale: localLocale as "en" | "fr" | "es" }).catch(() => {
      // Fire-and-forget: localStorage is source of truth if this fails.
    });
    // i18next already has localLocale active — no need to call changeLanguage.
  } else if (serverLocale && API_LOCALES.has(serverLocale)) {
    i18n.changeLanguage(serverLocale);
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    requires2FA: false,
  });

  const refreshUser = useCallback(async () => {
    try {
      const user = await authApi.getMe();
      if (user) syncLocaleOnLogin(user.locale);
      setState({
        user: user ?? null,
        isLoading: false,
        isAuthenticated: !!user,
        requires2FA: false,
      });
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        requires2FA: false,
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    authApi.getMe().then(
      (user) => {
        if (!cancelled) {
          syncLocaleOnLogin(user?.locale);
          setState({
            user: user ?? null,
            isLoading: false,
            isAuthenticated: !!user,
            requires2FA: false,
          });
        }
      },
      () => {
        if (!cancelled) {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            requires2FA: false,
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (data: LoginInput) => {
    const result = await authApi.login(data);
    if ("requires2FA" in result && result.requires2FA) {
      setState((prev) => ({ ...prev, requires2FA: true }));
      return;
    }
    const profile = result as UserProfile;
    syncLocaleOnLogin(profile.locale);
    setState({
      user: profile,
      isLoading: false,
      isAuthenticated: true,
      requires2FA: false,
    });
  }, []);

  const register = useCallback(async (data: RegisterInput) => {
    const user = await authApi.register(data);
    syncLocaleOnLogin(user.locale);
    setState({
      user,
      isLoading: false,
      isAuthenticated: true,
      requires2FA: false,
    });
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      requires2FA: false,
    });
  }, []);

  const verify2FA = useCallback(async (code: string) => {
    const user = await authApi.verify2FA(code);
    syncLocaleOnLogin(user?.locale);
    setState({
      user,
      isLoading: false,
      isAuthenticated: true,
      requires2FA: false,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, verify2FA, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
