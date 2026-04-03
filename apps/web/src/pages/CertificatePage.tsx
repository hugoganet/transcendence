import { useEffect, useState } from "react";
import { GraduationCap, Copy, Check, ExternalLink } from "lucide-react";
import type { Certificate } from "@transcendence/shared";
import { usersApi } from "../api/users.js";
import { curriculumApi } from "../api/curriculum.js";

import { Card } from "../components/ui/Card.js";
import { CertificateCard } from "../components/CertificateCard.js";
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
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState(false);

  useEffect(() => {
    document.title = "Certificate — Transcendence";
    let cancelled = false;

    usersApi.getCertificate().then(
      (data) => {
        if (cancelled) return;
        if (data === null) {
          setNoCert(true);
          curriculumApi.getCurriculum().then(
            (curriculum) => {
              if (!cancelled) {
                setCompletionPct(curriculum.completionPercentage);
                setIsLoading(false);
              }
            },
            () => {
              if (!cancelled) setIsLoading(false);
            },
          );
        } else {
          setCert(data);
          setIsLoading(false);
          usersApi.getCertificateShareUrl().then(
            (share) => {
              if (!cancelled) setShareUrl(share.shareUrl);
            },
            () => {},
          );
        }
      },
      () => {
        if (!cancelled) setIsLoading(false);
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

  const handleCopyContract = () => {
    if (cert?.contractAddress) {
      navigator.clipboard.writeText(cert.contractAddress);
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    }
  };

  const handleCopyTokenId = () => {
    if (cert?.nftTokenId !== undefined) {
      navigator.clipboard.writeText(String(cert.nftTokenId));
      setCopiedTokenId(true);
      setTimeout(() => setCopiedTokenId(false), 2000);
    }
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
        <h1 className="text-2xl font-bold text-gray-900 font-heading">Certificate</h1>
        <Card>
          <div className="py-8 text-center">
            <GraduationCap className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Certificate Not Yet Earned</h2>
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
              <p className="mt-2 text-xs text-gray-400">{completionPct}% complete</p>
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
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 font-heading text-center mb-8">
        Certificate
      </h1>

      <div className="flex justify-center">
        <CertificateCard
          certificate={cert}
          userName={user?.displayName ?? user?.email ?? "Learner"}
          shareUrl={shareUrl}
        />
      </div>

      <div className="text-center mt-8">
        <Button variant="secondary" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy Share Link"}
        </Button>
      </div>

      {cert.nftTokenId !== undefined && cert.contractAddress && (
        <Card className="mt-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>Import NFT to Your Wallet</span>
            </h3>

            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 mb-6">
              <li>Open MetaMask (or your preferred wallet)</li>
              <li>
                Go to the <strong>NFTs</strong> tab
              </li>
              <li>
                Click <strong>Import NFT</strong>
              </li>
              <li>Enter the contract address and token ID below</li>
              <li>
                Make sure you're connected to the <strong>Avalanche C-Chain</strong> network
              </li>
            </ol>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-gray-500 mb-1">Contract Address</div>
                  <div className="text-sm font-mono text-gray-900 truncate">
                    {cert.contractAddress}
                  </div>
                </div>
                <button
                  onClick={handleCopyContract}
                  className="ml-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                  title="Copy contract address"
                >
                  {copiedContract ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-gray-500 mb-1">Token ID</div>
                  <div className="text-sm font-mono text-gray-900">{cert.nftTokenId}</div>
                </div>
                <button
                  onClick={handleCopyTokenId}
                  className="ml-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                  title="Copy token ID"
                >
                  {copiedTokenId ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {cert.nftTxHash && (
              <a
                href={`https://snowtrace.io/tx/${cert.nftTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View transaction on Snowtrace
              </a>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
