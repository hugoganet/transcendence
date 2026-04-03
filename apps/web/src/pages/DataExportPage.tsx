import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { gdprApi } from "../api/gdpr.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Alert } from "../components/ui/Alert.js";

export function DataExportPage() {
  const { t } = useTranslation();
  const [isRequesting, setIsRequesting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `${t("pages.dataExport.title")} — Unblock.chain`;
  }, []);

  const handleExport = async () => {
    setIsRequesting(true);
    setError("");
    setSuccess("");
    try {
      const result = await gdprApi.requestExport();
      setSuccess(result.message);
    } catch {
      setError(t("pages.dataExport.requestError"));
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 font-heading">
        {t("pages.dataExport.title")}
      </h1>

      <Card>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t("pages.dataExport.body1")}
          </p>
          <p className="text-sm text-gray-600">
            {t("pages.dataExport.body2")}
          </p>

          {success && <Alert variant="success">{success}</Alert>}
          {error && <Alert variant="error">{error}</Alert>}

          <Button onClick={handleExport} isLoading={isRequesting}>
            {t("pages.dataExport.requestButton")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
