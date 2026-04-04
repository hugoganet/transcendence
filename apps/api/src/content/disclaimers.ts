/**
 * @file Disclaimers — legal disclaimer content for investment-adjacent educational modules.
 * FR: Disclaimers — contenu des avertissements legaux pour les modules educatifs lies a l'investissement.
 */

const GENERAL_DISCLAIMER_TEXT = `This platform is designed for educational purposes only. The content provided does not constitute financial, investment, or legal advice. Cryptocurrency and blockchain investments carry significant risk, including the potential loss of all invested capital. Always consult a qualified financial advisor before making any investment decisions. Past performance of any cryptocurrency or blockchain project does not guarantee future results.`;

const MODULE_DISCLAIMER_TEXT = `The concepts covered in this module are for educational understanding only and should not be interpreted as investment recommendations or financial advice.`;

/**
 * Chapters covering investment-adjacent content requiring FR53 disclaimers:
 * - 2.3: "Crypto & Value" (price charts, why prices swing, investment disclaimer)
 * - 6.1: "DeFi: Banking Without Banks" (DeFi lending, DEXs, DeFi risks)
 * - 6.2: "The Bigger Picture" (real-world applications, institutional adoption)
 */
const INVESTMENT_MODULE_IDS: string[] = ["2.3", "6.1", "6.2"];

/**
 * Returns the platform-wide general disclaimer text.
 * FR: Renvoie le texte de l'avertissement general de la plateforme.
 */
export function getGeneralDisclaimer(): string {
  return GENERAL_DISCLAIMER_TEXT;
}

/**
 * Returns the module-specific disclaimer if the module covers investment topics, or null.
 * FR: Renvoie l'avertissement specifique au module s'il couvre des sujets d'investissement, sinon null.
 */
export function getModuleDisclaimer(moduleId: string): string | null {
  if (INVESTMENT_MODULE_IDS.includes(moduleId)) {
    return MODULE_DISCLAIMER_TEXT;
  }
  return null;
}
