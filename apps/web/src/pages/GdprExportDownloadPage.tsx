import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { gdprApi } from "../api/gdpr.js";
import { Card } from "../components/ui/Card.js";
import { Alert } from "../components/ui/Alert.js";

export function GdprExportDownloadPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Download My Data — Transcendence";
  }, []);

  useEffect(() => {
    if (!token) {
      setError("Invalid download link.");
      setStatus("error");
      return;
    }

    gdprApi
      .downloadExport(token)
      .then((data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "my-data-export.json";
        a.click();
        URL.revokeObjectURL(url);
        setStatus("success");
      })
      .catch(() => {
        setError("This download link is invalid or has already been used.");
        setStatus("error");
      });
  }, [token]);

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900 font-heading">
        Download My Data
      </h1>
      <Card>
        <div className="space-y-4">
          {status === "loading" && (
            <p className="text-sm text-gray-600">Preparing your download…</p>
          )}
          {status === "success" && (
            <Alert variant="success">
              Your data export has been downloaded successfully.
            </Alert>
          )}
          {status === "error" && (
            <Alert variant="error">{error}</Alert>
          )}
        </div>
      </Card>
    </div>
  );
}
