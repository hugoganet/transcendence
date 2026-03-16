import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { PublicCertificate } from "@transcendence/shared";
import { certificatesApi } from "../api/certificates.js";
import { Card } from "../components/ui/Card.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";

export function PublicCertificatePage() {
  const { token } = useParams<{ token: string }>();
  const [cert, setCert] = useState<PublicCertificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Certificate — Transcendence";
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
          setError("Certificate not found");
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!token || error || !cert) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Alert variant="error">{error || "Certificate not found"}</Alert>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="space-y-6 py-6 text-center">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Certificate of Completion
              </p>
              <p className="text-xl font-bold text-primary font-heading">
                {cert.curriculumTitle}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Awarded to</p>
              <p className="text-lg font-semibold text-gray-900">
                {cert.displayName ?? "Learner"}
              </p>
            </div>

            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <div>
                <p className="font-medium text-gray-900">
                  {cert.totalMissions}
                </p>
                <p>Missions</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {cert.totalCategories}
                </p>
                <p>Categories</p>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Completed on{" "}
              {new Date(cert.completionDate).toLocaleDateString()}
            </p>

            <p className="text-xs text-gray-400">
              Verified on Transcendence
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
