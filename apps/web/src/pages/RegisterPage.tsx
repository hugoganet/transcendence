import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerSchema } from "@transcendence/shared";
import { useAuth, ApiError } from "../contexts/AuthContext.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import { FormField } from "../components/ui/FormField.js";
import { Alert } from "../components/ui/Alert.js";

export function RegisterPage() {
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
          setErrors({ email: "An account with this email already exists" });
        } else {
          setGlobalError("An error occurred. Please try again.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <h1 className="mb-6 text-center text-xl font-bold text-gray-900 font-heading">
        Create Account
      </h1>
      {globalError && (
        <Alert variant="error" className="mb-4">
          {globalError}
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" error={errors.email} htmlFor="reg-email">
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
          label="Password"
          error={errors.password}
          htmlFor="reg-password"
        >
          <Input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            placeholder="Min 8 chars, uppercase, lowercase, number"
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
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="age-confirm" className="text-sm text-gray-600">
            I confirm that I am at least 18 years old
          </label>
        </div>
        {errors.ageConfirmed && (
          <p className="text-sm text-red-600">{errors.ageConfirmed}</p>
        )}
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Create Account
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-primary hover:text-primary/80"
        >
          Sign In
        </Link>
      </p>
    </Card>
  );
}
