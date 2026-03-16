import type { TokenBalance as TokenBalanceType } from "@transcendence/shared";
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
        <svg
          className="h-4 w-4 text-secondary"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a5.95 5.95 0 01-.4-.821h2.664a1 1 0 000-2H8.063a7.343 7.343 0 010-1h3.937a1 1 0 000-2H8.336c.112-.29.242-.563.4-.821z" />
        </svg>
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
          <svg
            className="h-5 w-5 text-secondary"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a5.95 5.95 0 01-.4-.821h2.664a1 1 0 000-2H8.063a7.343 7.343 0 010-1h3.937a1 1 0 000-2H8.336c.112-.29.242-.563.4-.821z" />
          </svg>
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
