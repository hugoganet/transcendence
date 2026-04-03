import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { passwordResetRequestSchema } from "@transcendence/shared";
import { authApi } from "../api/auth.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import { FormField } from "../components/ui/FormField.js";
import { Alert } from "../components/ui/Alert.js";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const result = passwordResetRequestSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Card>
        <h1 className="mb-4 text-center text-xl font-bold text-gray-900 font-heading">
          {t("auth.forgotPassword.emailSent")}
        </h1>
        <Alert variant="info">
          {t("auth.forgotPassword.emailSentSubtitle")}
        </Alert>
        <p className="mt-4 text-center">
          <Link
            to="/login"
            className="text-sm text-primary hover:text-primary/80"
          >
            {t("auth.forgotPassword.backToLogin")}
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="mb-2 text-center text-xl font-bold text-gray-900 font-heading">
        {t("auth.forgotPassword.title")}
      </h1>
      <p className="mb-6 text-center text-sm text-gray-500">
        {t("auth.forgotPassword.subtitle")}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={t("auth.forgotPassword.emailLabel")} error={error} htmlFor="forgot-email">
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
        </FormField>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {t("auth.forgotPassword.submitButton")}
        </Button>
      </form>
      <p className="mt-4 text-center">
        <Link
          to="/login"
          className="text-sm text-primary hover:text-primary/80"
        >
          {t("auth.forgotPassword.backToLogin")}
        </Link>
      </p>
    </Card>
  );
}
