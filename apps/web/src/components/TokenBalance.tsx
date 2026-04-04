/**
 * @file TokenBalance — shows the user's token balance, total earned, and total spent.
 * FR: TokenBalance — affiche le solde de jetons de l'utilisateur, le total gagné et le total dépensé.
 */
import type { TokenBalance as TokenBalanceType } from "@transcendence/shared";
import { Coins } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useReveals } from "../contexts/RevealContext.js";
import { AnimatedCounter } from "./AnimatedCounter.js";

/** Props for TokenBalanceDisplay. / FR: Props pour TokenBalanceDisplay. */
interface TokenBalanceProps {
  balance: TokenBalanceType;
  compact?: boolean;
}

/**
 * Displays token balance with earned/spent breakdown; hidden until tokens are revealed.
 * FR: Affiche le solde de jetons avec le détail gagné/dépensé ; caché tant que les jetons ne sont pas révélés.
 */
export function TokenBalanceDisplay({
  balance,
  compact = false,
}: TokenBalanceProps) {
  const { t } = useTranslation();
  const { tokensRevealed } = useReveals();

  if (!tokensRevealed) return null;

  if (compact) {
    return (
      <div
        className="flex items-center gap-1 text-sm"
        title={t("gamification.tokens.tokenBalance")}
      >
        <Coins className="h-4 w-4 text-secondary" />
        <span className="font-medium text-gray-700 dark:text-warm-200">
          {balance.tokenBalance}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-warm-700 dark:bg-warm-800 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
          <Coins className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-warm-50">
            <AnimatedCounter target={balance.tokenBalance} />
          </p>
          <p className="text-xs text-gray-500 dark:text-warm-200">{t("gamification.tokens.tokenBalance")}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-4 border-t border-gray-100 dark:border-warm-700 pt-3 text-xs text-gray-400 dark:text-warm-200">
        <span>{t("labels.earned")} {balance.totalEarned}</span>
        <span>{t("labels.spent")} {balance.totalSpent}</span>
      </div>
    </div>
  );
}
