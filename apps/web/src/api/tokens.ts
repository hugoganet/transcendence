import type {
  TokenBalance,
  TokenTransaction,
  PaginationMeta,
} from "@transcendence/shared";
import { api, ApiError } from "./client.js";

export const tokensApi = {
  getBalance: async (): Promise<TokenBalance> => {
    return api.get<TokenBalance>("/api/v1/tokens/balance");
  },

  getHistory: async (
    page = 1,
    pageSize = 20,
  ): Promise<{ transactions: TokenTransaction[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    const BASE_URL = import.meta.env.VITE_API_URL ?? "";
    const res = await fetch(
      `${BASE_URL}/api/v1/tokens/history?${params}`,
      { credentials: "include" },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err?.error?.code ?? "UNKNOWN", err?.error?.message ?? "Request failed");
    }
    const json = await res.json();
    return { transactions: json.data ?? [], meta: json.meta };
  },
};
