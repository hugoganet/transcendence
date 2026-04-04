/**
 * @file RegisterPage — Register Page — new user registration form.
 * FR: Page Inscription — formulaire d'inscription.
 */
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { registerSchema } from "@transcendence/shared";
import { useAuth, ApiError } from "../contexts/AuthContext.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import { FormField } from "../components/ui/FormField.js";
import { Alert } from "../components/ui/Alert.js";
import { OAuthButtons } from "../components/OAuthButtons.js";

export function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    const result = registerSchema.safeParse({ email, password, ageConfirmed });
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
      await register(result.data);
      navigate("/home");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "EMAIL_ALREADY_EXISTS") {
          setErrors({ email: t("errors.emailAlreadyUsed") });
        } else {
          setGlobalError(t("errors.serverError"));
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <h1 className="mb-6 text-center text-xl font-bold text-gray-900 dark:text-warm-50 font-heading">
        {t("auth.signup.title")}
      </h1>
      {globalError && (
        <Alert variant="error" className="mb-4">
          {globalError}
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={t("auth.signup.emailLabel")} error={errors.email} htmlFor="reg-email">
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
        </FormField>
        <FormField
          label={t("auth.signup.passwordLabel")}
          error={errors.password}
          htmlFor="reg-password"
        >
          <Input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            placeholder={t("auth.signup.passwordLabel")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
        </FormField>
        <div className="flex items-start gap-2">
          <input
            id="age-confirm"
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-warm-600"
          />
          <label htmlFor="age-confirm" className="text-sm text-gray-600 dark:text-warm-200">
            {t("auth.signup.ageConfirm")}
          </label>
        </div>
        {errors.ageConfirmed && (
          <p className="text-sm text-red-600">{errors.ageConfirmed}</p>
        )}
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {t("auth.signup.submitButton")}
        </Button>
      </form>
      <OAuthButtons />
      <p className="mt-4 text-center text-sm text-gray-500 dark:text-warm-200">
        {t("auth.signup.hasAccount")}{" "}
        <Link
          to="/login"
          className="font-medium text-primary hover:text-primary/80 dark:text-teal-400"
        >
          {t("auth.signup.loginLink")}
        </Link>
      </p>
    </Card>
  );
}
