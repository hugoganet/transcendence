/**
 * @file PublicCertificatePage — Public Certificate — shareable certificate verification.
 * FR: Certificat Public — verification partageable de certificat.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import type { PublicCertificate } from "@transcendence/shared";
import { certificatesApi } from "../api/certificates.js";
import { Card } from "../components/ui/Card.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";

export function PublicCertificatePage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [cert, setCert] = useState<PublicCertificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `${t("pages.certificate.title")} — Unblock.chain`;
    if (!token) return;
    let cancelled = false;
    certificatesApi.getPublicCertificate(token).then(
      (data) => {
        if (!cancelled) {
          setCert(data);
          setIsLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setError(t("pages.certificate.notFound"));
          setIsLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!token || error || !cert) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
        <Alert variant="error">{error || t("pages.certificate.notFound")}</Alert>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="space-y-6 py-6 text-center">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                {t("pages.certificate.certificateOfCompletion")}
              </p>
              <p className="text-xl font-bold text-primary font-heading">
                {cert.curriculumTitle}
              </p>
            </div>

            <div>
              <p className="text-sm text-[var(--color-text-muted)]">{t("pages.certificate.awardedTo")}</p>
              <p className="text-lg font-semibold text-[var(--color-text)]">
                {cert.displayName ?? t("pages.publicProfile.defaultUser")}
              </p>
            </div>

            <div className="flex justify-center gap-8 text-sm text-[var(--color-text-muted)]">
              <div>
                <p className="font-medium text-[var(--color-text)]">
                  {cert.totalMissions}
                </p>
                <p>{t("labels.missions")}</p>
              </div>
              <div>
                <p className="font-medium text-[var(--color-text)]">
                  {cert.totalCategories}
                </p>
                <p>{t("labels.category")}</p>
              </div>
            </div>

            <p className="text-sm text-[var(--color-text-muted)]">
              {t("certificate.completedOn")}{" "}
              {new Date(cert.completionDate).toLocaleDateString()}
            </p>

            <p className="text-xs text-[var(--color-text-muted)]">
              {t("pages.certificate.verifiedOn")}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
