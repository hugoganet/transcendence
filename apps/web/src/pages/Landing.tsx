import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.js";

export function Landing() {
  useEffect(() => {
    document.title = "Transcendence — Learn Blockchain by Doing";
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg text-center">
        <h1 className="mb-4 text-4xl font-bold text-primary font-heading">
          Transcendence
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Learn blockchain from zero to confident — through interactive
          missions, not lectures.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to="/register">
            <Button>Get Started</Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
        </div>
      </div>
      <nav className="mt-12 flex gap-4 text-sm text-gray-400">
        <Link to="/privacy-policy" className="hover:text-primary">
          Privacy Policy
        </Link>
        <Link to="/terms-of-service" className="hover:text-primary">
          Terms of Service
        </Link>
      </nav>
    </div>
  );
}
