import { Outlet, Link } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <Link to="/" className="mb-8 text-2xl font-bold text-primary font-heading">
        Transcendence
      </Link>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
