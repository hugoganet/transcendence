import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { passwordResetSchema } from "@transcendence/shared";
import { authApi } from "../api/auth.js";
import { ApiError } from "../api/client.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import { FormField } from "../components/ui/FormField.js";
import { Alert } from "../components/ui/Alert.js";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    const result = passwordResetSchema.safeParse({ token, password });
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
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setGlobalError(
          err.code === "INVALID_OR_EXPIRED_TOKEN"
            ? "This reset link has expired. Please request a new one."
            : "An error occurred. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Card>
        <Alert variant="error">
          Invalid reset link. Please request a new password reset.
        </Alert>
        <p className="mt-4 text-center">
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:text-primary/80"
          >
            Request Reset
          </Link>
        </p>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <h1 className="mb-4 text-center text-xl font-bold text-gray-900 font-heading">
          Password Reset
        </h1>
        <Alert variant="success">
          Your password has been reset successfully.
        </Alert>
        <p className="mt-4 text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Sign In
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="mb-6 text-center text-xl font-bold text-gray-900 font-heading">
        Set New Password
      </h1>
      {globalError && (
        <Alert variant="error" className="mb-4">
          {globalError}
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="New Password"
          error={errors.password}
          htmlFor="new-password"
        >
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="Min 8 chars, uppercase, lowercase, number"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
        </FormField>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Reset Password
        </Button>
      </form>
    </Card>
  );
}
