import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.js";

export function NotFound() {
  useEffect(() => {
    document.title = "Page Not Found — Transcendence";
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Page not found</h1>
      <p className="mb-6 text-gray-500">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/">
        <Button variant="ghost">Back to home</Button>
      </Link>
    </div>
  );
}
