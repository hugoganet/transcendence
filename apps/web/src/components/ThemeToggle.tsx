/**
 * @file ThemeToggle — button to switch between light and dark mode.
 * FR: ThemeToggle — bouton pour basculer entre le mode clair et le mode sombre.
 */
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext.js";

/**
 * Toggle button that switches the app between light and dark themes.
 * FR: Bouton bascule qui alterne l'application entre thème clair et sombre.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-warm-200 dark:hover:bg-warm-700 dark:hover:text-warm-200"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
