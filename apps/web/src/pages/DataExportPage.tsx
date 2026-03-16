import { useEffect, useState } from "react";
import { gdprApi } from "../api/gdpr.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Alert } from "../components/ui/Alert.js";

export function DataExportPage() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Export My Data — Transcendence";
  }, []);

  const handleExport = async () => {
    setIsRequesting(true);
    setError("");
    setSuccess("");
    try {
      const result = await gdprApi.requestExport();
      setSuccess(result.message);
    } catch {
      setError("Failed to request data export. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 font-heading">
        Export My Data
      </h1>

      <Card>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You can request a full export of your personal data. This includes
            your profile, progress, token history, achievements, friends, and
            exercise attempts.
          </p>
          <p className="text-sm text-gray-600">
            Once requested, you'll receive an email with a download link. The
            export is provided in JSON format.
          </p>

          {success && <Alert variant="success">{success}</Alert>}
          {error && <Alert variant="error">{error}</Alert>}

          <Button onClick={handleExport} isLoading={isRequesting}>
            Request Data Export
          </Button>
        </div>
      </Card>
    </div>
  );
}
