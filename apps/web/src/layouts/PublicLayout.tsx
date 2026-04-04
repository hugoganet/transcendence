/**
 * @file PublicLayout — Public Layout — minimal layout for public-facing pages.
 * FR: Layout Public — layout minimal pour les pages publiques.
 */
import { Outlet } from "react-router-dom";
import { LanguageSwitcher } from "../components/LanguageSwitcher.js";

export function PublicLayout() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute right-4 top-4 z-50">
        <LanguageSwitcher variant="pill" />
      </div>
      <Outlet />
    </div>
  );
}
