import { Routes, Route } from "react-router-dom";
import { AuthLayout } from "./layouts/AuthLayout.js";
import { AppLayout } from "./layouts/AppLayout.js";
import { ProtectedRoute, GuestRoute } from "./components/ProtectedRoute.js";
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.js";
import { ResetPasswordPage } from "./pages/ResetPasswordPage.js";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage.js";
import { HomePage } from "./pages/HomePage.js";
import { CurriculumPage } from "./pages/CurriculumPage.js";
import { MissionPage } from "./pages/MissionPage.js";
import { ExercisePage } from "./pages/ExercisePage.js";
import { LeaderboardPage } from "./pages/LeaderboardPage.js";
import { AchievementsPage } from "./pages/AchievementsPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { FriendsPage } from "./pages/FriendsPage.js";
import { PublicProfilePage } from "./pages/PublicProfilePage.js";
import { NotificationsPage } from "./pages/NotificationsPage.js";
import { ProfilePage } from "./pages/ProfilePage.js";
import { NotificationPreferencesPage } from "./pages/NotificationPreferencesPage.js";
import { GlossaryPage } from "./pages/GlossaryPage.js";
import { CertificatePage } from "./pages/CertificatePage.js";
import { DataExportPage } from "./pages/DataExportPage.js";
import { DeleteAccountPage } from "./pages/DeleteAccountPage.js";
import { PublicCertificatePage } from "./pages/PublicCertificatePage.js";
import { PrivacyPolicy } from "./pages/PrivacyPolicy.js";
import { TermsOfService } from "./pages/TermsOfService.js";
import { Landing } from "./pages/Landing.js";
import { NotFound } from "./pages/NotFound.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";

export function App() {
  return (
    <ErrorBoundary>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/certificates/:token" element={<PublicCertificatePage />} />

      {/* Auth routes (redirect to home if already logged in) */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        </Route>
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/curriculum" element={<CurriculumPage />} />
          <Route path="/missions/:missionId" element={<MissionPage />} />
          <Route path="/missions/:missionId/exercise" element={<ExercisePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/users/:userId" element={<PublicProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings/notifications" element={<NotificationPreferencesPage />} />
          <Route path="/settings/data-export" element={<DataExportPage />} />
          <Route path="/settings/delete-account" element={<DeleteAccountPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/certificate" element={<CertificatePage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </ErrorBoundary>
  );
}
