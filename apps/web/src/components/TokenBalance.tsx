import type { TokenBalance as TokenBalanceType } from "@transcendence/shared";
import { Coins } from "lucide-react";
import { useReveals } from "../contexts/RevealContext.js";

interface TokenBalanceProps {
  balance: TokenBalanceType;
  compact?: boolean;
}

export function TokenBalanceDisplay({
  balance,
  compact = false,
}: TokenBalanceProps) {
  const { tokensRevealed } = useReveals();

  if (!tokensRevealed) return null;

  if (compact) {
    return (
      <div
        className="flex items-center gap-1 text-sm"
        title="Knowledge Tokens"
      >
        <Coins className="h-4 w-4 text-secondary" />
        <span className="font-medium text-gray-700">
          {balance.tokenBalance}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
          <Coins className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {balance.tokenBalance}
          </p>
          <p className="text-xs text-gray-500">Knowledge Tokens</p>
        </div>
      </div>
      <div className="mt-3 flex gap-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
        <span>Earned: {balance.totalEarned}</span>
        <span>Spent: {balance.totalSpent}</span>
      </div>
    </div>
  );
}
