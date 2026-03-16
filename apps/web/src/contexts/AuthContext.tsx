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
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
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
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
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
    setState({
      user: result as UserProfile,
      isLoading: false,
      isAuthenticated: true,
      requires2FA: false,
    });
  }, []);

  const register = useCallback(async (data: RegisterInput) => {
    const user = await authApi.register(data);
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
