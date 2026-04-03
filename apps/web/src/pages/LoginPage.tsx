/**
 * @file LoginPage — Login Page — user authentication form.
 * FR: Page Connexion — formulaire d'authentification.
 */
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { loginSchema } from "@transcendence/shared";
import { useAuth, ApiError } from "../contexts/AuthContext.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import { FormField } from "../components/ui/FormField.js";
import { Alert } from "../components/ui/Alert.js";

export function LoginPage() {
  const { t } = useTranslation();
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
            ? t("errors.invalidCredentials")
            : err.code === "RATE_LIMIT_EXCEEDED"
              ? t("errors.tooManyRequests")
              : t("errors.serverError"),
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
      setErrors({ code: t("auth.twoFactor.codeMustBe6Digits") });
      return;
    }

    setIsSubmitting(true);
    try {
      await verify2FA(totpCode);
      navigate("/home");
    } catch (err) {
      if (err instanceof ApiError) {
        setGlobalError(t("auth.twoFactor.invalidCode"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requires2FA) {
    return (
      <Card>
        <h1 className="mb-6 text-center text-xl font-bold text-gray-900 dark:text-warm-50 font-heading">
          {t("auth.twoFactor.title")}
        </h1>
        {globalError && (
          <Alert variant="error" className="mb-4">
            {globalError}
          </Alert>
        )}
        <form onSubmit={handle2FA} className="space-y-4">
          <FormField label={t("auth.twoFactor.codeLabel")} error={errors.code} htmlFor="totp-code">
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
            {t("auth.twoFactor.submitButton")}
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="mb-6 text-center text-xl font-bold text-gray-900 dark:text-warm-50 font-heading">
        {t("auth.login.title")}
      </h1>
      {globalError && (
        <Alert variant="error" className="mb-4">
          {globalError}
        </Alert>
      )}
      <form onSubmit={handleLogin} className="space-y-4">
        <FormField label={t("auth.login.emailLabel")} error={errors.email} htmlFor="email">
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
        <FormField label={t("auth.login.passwordLabel")} error={errors.password} htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder={t("auth.login.passwordLabel")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
        </FormField>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {t("auth.login.submitButton")}
        </Button>
      </form>
      <div className="mt-4 space-y-2 text-center text-sm">
        <p>
          <Link
            to="/forgot-password"
            className="text-primary hover:text-primary/80 dark:text-teal-400"
          >
            {t("auth.login.forgotPassword")}
          </Link>
        </p>
        <p className="text-gray-500 dark:text-warm-200">
          {t("auth.login.noAccount")}{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:text-primary/80 dark:text-teal-400"
          >
            {t("auth.login.signUpLink")}
          </Link>
        </p>
      </div>
    </Card>
  );
}
