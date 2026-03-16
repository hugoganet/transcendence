import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema } from "@transcendence/shared";
import { useAuth, ApiError } from "../contexts/AuthContext.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import { FormField } from "../components/ui/FormField.js";
import { Alert } from "../components/ui/Alert.js";

export function LoginPage() {
  const { login, verify2FA, requires2FA } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(result.data);
      navigate("/home");
    } catch (err) {
      if (err instanceof ApiError) {
        setGlobalError(
          err.code === "INVALID_CREDENTIALS"
            ? "Invalid email or password"
            : err.code === "RATE_LIMIT_EXCEEDED"
              ? "Too many attempts. Please try again later."
              : "An error occurred. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FA = async (e: FormEvent) => {
    e.preventDefault();
    setGlobalError("");

    if (!/^\d{6}$/.test(totpCode)) {
      setErrors({ code: "Code must be 6 digits" });
      return;
    }

    setIsSubmitting(true);
    try {
      await verify2FA(totpCode);
      navigate("/home");
    } catch (err) {
      if (err instanceof ApiError) {
        setGlobalError("Invalid code. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requires2FA) {
    return (
      <Card>
        <h1 className="mb-6 text-center text-xl font-bold text-gray-900 font-heading">
          Two-Factor Authentication
        </h1>
        {globalError && (
          <Alert variant="error" className="mb-4">
            {globalError}
          </Alert>
        )}
        <form onSubmit={handle2FA} className="space-y-4">
          <FormField label="Authentication Code" error={errors.code} htmlFor="totp-code">
            <Input
              id="totp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              error={errors.code}
            />
          </FormField>
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Verify
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="mb-6 text-center text-xl font-bold text-gray-900 font-heading">
        Sign In
      </h1>
      {globalError && (
        <Alert variant="error" className="mb-4">
          {globalError}
        </Alert>
      )}
      <form onSubmit={handleLogin} className="space-y-4">
        <FormField label="Email" error={errors.email} htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
        </FormField>
        <FormField label="Password" error={errors.password} htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
        </FormField>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Sign In
        </Button>
      </form>
      <div className="mt-4 space-y-2 text-center text-sm">
        <p>
          <Link
            to="/forgot-password"
            className="text-primary hover:text-primary/80"
          >
            Forgot your password?
          </Link>
        </p>
        <p className="text-gray-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:text-primary/80"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </Card>
  );
}
