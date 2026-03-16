import { useEffect, useState } from "react";
import type { Certificate } from "@transcendence/shared";
import { usersApi } from "../api/users.js";
import { curriculumApi } from "../api/curriculum.js";
import { ApiError } from "../api/client.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";
import { useAuth } from "../contexts/AuthContext.js";

export function CertificatePage() {
  const { user } = useAuth();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [completionPct, setCompletionPct] = useState(0);
  const [shareUrl, setShareUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [noCert, setNoCert] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = "Certificate — Transcendence";
    let cancelled = false;

    usersApi.getCertificate().then(
      (data) => {
        if (cancelled) return;
        setCert(data);
        setIsLoading(false);
        // Also fetch share URL
        usersApi.getCertificateShareUrl().then(
          (share) => {
            if (!cancelled) setShareUrl(share.shareUrl);
          },
          () => {},
        );
      },
      (err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNoCert(true);
          // Fetch completion percentage for progress display
          curriculumApi.getCurriculum().then(
            (data) => {
              if (!cancelled) {
                setCompletionPct(data.completionPercentage);
                setIsLoading(false);
              }
            },
            () => {
              if (!cancelled) setIsLoading(false);
            },
          );
        } else {
          setIsLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (noCert) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 font-heading">
          Certificate
        </h1>
        <Card>
          <div className="py-8 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-gray-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"
              />
            </svg>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              Certificate Not Yet Earned
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Complete all missions to earn your certificate of completion.
            </p>
            <div className="mx-auto max-w-xs">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {completionPct}% complete
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!cert) {
    return <Alert variant="error">Failed to load certificate</Alert>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 font-heading">
        Certificate
      </h1>

      <Card>
        <div className="space-y-6 py-4 text-center">
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
              {user?.displayName ?? user?.email ?? "Learner"}
            </p>
          </div>

          <div className="flex justify-center gap-8 text-sm text-gray-500">
            <div>
              <p className="font-medium text-gray-900">{cert.totalMissions}</p>
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

          {shareUrl && (
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy Share Link"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
