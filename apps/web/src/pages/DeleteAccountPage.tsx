import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { gdprApi } from "../api/gdpr.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Alert } from "../components/ui/Alert.js";

export function DeleteAccountPage() {
  const { t } = useTranslation();
  const [isRequesting, setIsRequesting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    document.title = `${t("pages.deleteAccount.title")} — Transcendence`;
  }, []);

  const handleDelete = async () => {
    if (!confirmed) return;
    setIsRequesting(true);
    setError("");
    setSuccess("");
    try {
      const result = await gdprApi.requestDeletion();
      setSuccess(result.message);
    } catch {
      setError(t("pages.deleteAccount.requestError"));
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 font-heading">
        {t("pages.deleteAccount.title")}
      </h1>

      <Card>
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-800">
              {t("pages.deleteAccount.warningTitle")}
            </p>
            <p className="mt-1 text-sm text-red-700">
              {t("pages.deleteAccount.warningBody")}
            </p>
          </div>

          <p className="text-sm text-gray-600">
            {t("pages.deleteAccount.confirmationEmailNote")}
          </p>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">
              {t("pages.deleteAccount.checkboxLabel")}
            </span>
          </label>

          {success && <Alert variant="success">{success}</Alert>}
          {error && <Alert variant="error">{error}</Alert>}

          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={isRequesting}
            disabled={!confirmed}
          >
            {t("pages.deleteAccount.requestButton")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
