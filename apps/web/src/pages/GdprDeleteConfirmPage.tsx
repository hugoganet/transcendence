import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gdprApi } from "../api/gdpr.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Alert } from "../components/ui/Alert.js";

export function GdprDeleteConfirmPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Confirm Account Deletion — Transcendence";
  }, []);

  const handleConfirm = async () => {
    if (!token) return;
    setStatus("loading");
    setError("");
    try {
      await gdprApi.confirmDeletion(token);
      setStatus("success");
    } catch {
      setError("This confirmation link is invalid or has already been used.");
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900 font-heading">
        Confirm Account Deletion
      </h1>

      <Card>
        <div className="space-y-4">
          {status === "success" ? (
            <Alert variant="success">
              Your account and all personal data have been permanently deleted.
            </Alert>
          ) : (
            <>
              <div className="rounded-lg bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-800">
                  This action is permanent and cannot be undone.
                </p>
                <p className="mt-1 text-sm text-red-700">
                  All your data, progress, and history will be deleted immediately.
                </p>
              </div>

              {status === "error" && <Alert variant="error">{error}</Alert>}

              <div className="flex gap-3">
                <Button
                  variant="danger"
                  onClick={handleConfirm}
                  isLoading={status === "loading"}
                >
                  Yes, delete my account
                </Button>
                <Button variant="secondary" onClick={() => navigate("/")}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
