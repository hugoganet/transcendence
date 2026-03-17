import type {
  TokenBalance,
  TokenTransaction,
  PaginationMeta,
} from "@transcendence/shared";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export const tokensApi = {
  getBalance: async (): Promise<TokenBalance> => {
    const res = await fetch(`${BASE_URL}/api/v1/tokens/balance`, {
      credentials: "include",
    });
    const json = await res.json();
    return json.data;
  },

  getHistory: async (
    page = 1,
    pageSize = 20,
  ): Promise<{ transactions: TokenTransaction[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    const res = await fetch(
      `${BASE_URL}/api/v1/tokens/history?${params}`,
      { credentials: "include" },
    );
    const json = await res.json();
    return { transactions: json.data, meta: json.meta };
  },
};
