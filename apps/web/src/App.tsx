import { useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfService } from "./pages/TermsOfService";

function Landing() {
  useEffect(() => {
    document.title = "Transcendence";
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="mb-8 text-3xl font-bold text-primary">Transcendence</h1>
      <nav className="flex gap-4">
        <Link to="/privacy-policy" className="text-primary underline hover:text-primary/70">
          Privacy Policy
        </Link>
        <Link to="/terms-of-service" className="text-primary underline hover:text-primary/70">
          Terms of Service
        </Link>
      </nav>
    </div>
  );
}

function NotFound() {
  useEffect(() => {
    document.title = "Page Not Found — Transcendence";
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="mb-4 text-3xl font-bold">Page not found</h1>
      <Link to="/" className="text-primary underline hover:text-primary/70">
        Back to home
      </Link>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
