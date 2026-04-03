import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { passwordResetSchema } from "@transcendence/shared";
import { authApi } from "../api/auth.js";
import { ApiError } from "../api/client.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import { FormField } from "../components/ui/FormField.js";
import { Alert } from "../components/ui/Alert.js";

export function ResetPasswordPage() {
  const { t } = useTranslation();
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
            ? t("auth.resetPassword.expiredToken")
            : t("errors.serverError"),
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
          {t("auth.resetPassword.invalidLink")}
        </Alert>
        <p className="mt-4 text-center">
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:text-primary/80"
          >
            {t("auth.resetPassword.requestReset")}
          </Link>
        </p>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <h1 className="mb-4 text-center text-xl font-bold text-gray-900 dark:text-warm-50 font-heading">
          {t("auth.resetPassword.title")}
        </h1>
        <Alert variant="success">
          {t("auth.resetPassword.success")}
        </Alert>
        <p className="mt-4 text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            {t("auth.signup.loginLink")}
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="mb-6 text-center text-xl font-bold text-gray-900 dark:text-warm-50 font-heading">
        {t("auth.resetPassword.title")}
      </h1>
      {globalError && (
        <Alert variant="error" className="mb-4">
          {globalError}
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label={t("auth.resetPassword.newPasswordLabel")}
          error={errors.password}
          htmlFor="new-password"
        >
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder={t("auth.resetPassword.newPasswordLabel")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
        </FormField>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {t("auth.resetPassword.submitButton")}
        </Button>
      </form>
    </Card>
  );
}
