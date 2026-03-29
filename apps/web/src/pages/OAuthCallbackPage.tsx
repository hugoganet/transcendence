import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Card } from "../components/ui/Card.js";
import { Alert } from "../components/ui/Alert.js";
import { Button } from "../components/ui/Button.js";

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const errorParam = searchParams.get("error");
  const success = searchParams.get("success");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    if (success === "true") {
      handled.current = true;
      refreshUser().then(() => navigate("/home", { replace: true }));
    }
  }, [success, navigate, refreshUser]);

  if (errorParam) {
    return (
      <Card>
        <Alert variant="error">Authentication failed. Please try again.</Alert>
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => navigate("/login")}>
            Back to Sign In
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>
  );
}
