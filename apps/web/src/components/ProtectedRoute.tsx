/**
 * @file ProtectedRoute — route guards for authenticated and guest-only access.
 * FR: ProtectedRoute — gardes de routes pour l'accès authentifié et visiteur uniquement.
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.js";
import { LoadingSpinner } from "./ui/LoadingSpinner.js";

/**
 * Redirects unauthenticated users to /login; renders child routes otherwise.
 * FR: Redirige les utilisateurs non authentifiés vers /login ; affiche les routes enfants sinon.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/**
 * Redirects authenticated users to /home; renders child routes for guests.
 * FR: Redirige les utilisateurs authentifiés vers /home ; affiche les routes enfants pour les visiteurs.
 */
export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
