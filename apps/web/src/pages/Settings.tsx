/**
 * @file Settings — Settings Page — user account and security settings.
 * FR: Page Parametres — parametres de compte et securite.
 */
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, ShieldOff } from "lucide-react";
import { LanguageSwitcher } from "../components/LanguageSwitcher.js";
import { Modal } from "../components/ui/Modal.js";
import { Button } from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import { FormField } from "../components/ui/FormField.js";
import { Alert } from "../components/ui/Alert.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { useAuth } from "../contexts/AuthContext.js";
import { authApi } from "../api/auth.js";
import { ApiError } from "../api/client.js";

type ModalState =
  | "closed"
  | "enable-loading"
  | "enable-setup"
  | "enable-success"
  | "disable";

interface SetupData {
  qrCodeDataUri: string;
  manualKey: string;
}

export function Settings() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();

  const [modal, setModal] = useState<ModalState>("closed");
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = `${t("settings.title")} — Unblock.chain`;
  }, [t]);

  const resetModal = useCallback(() => {
    setModal("closed");
    setSetupData(null);
    setCode("");
    setError("");
    setIsSubmitting(false);
    setCopied(false);
  }, []);

  // Fetch QR code when enable modal opens
  useEffect(() => {
    if (modal !== "enable-loading") return;
    let cancelled = false;
    authApi.setup2FA().then(
      (data) => {
        if (!cancelled) {
          setSetupData({ qrCodeDataUri: data.qrCodeDataUri, manualKey: data.manualKey });
          setModal("enable-setup");
        }
      },
      () => {
        if (!cancelled) {
          setError(t("errors.serverError"));
          setModal("enable-setup");
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [modal, t]);

  const handleOpenEnable = () => {
    setError("");
    setCode("");
    setModal("enable-loading");
  };

  const handleVerifyEnable = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError(t("auth.twoFactor.codeMustBe6Digits"));
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await authApi.verifyAndEnable2FA(code);
      setModal("enable-success");
    } catch (err) {
      if (err instanceof ApiError && err.code === "RATE_LIMIT_EXCEEDED") {
        setError(t("settings.twoFactor.rateLimited"));
      } else {
        setError(t("settings.twoFactor.invalidCode"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = async () => {
    resetModal();
    await refreshUser();
  };

  const handleDisable = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError(t("auth.twoFactor.codeMustBe6Digits"));
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await authApi.disable2FA(code);
      resetModal();
      await refreshUser();
    } catch (err) {
      if (err instanceof ApiError && err.code === "RATE_LIMIT_EXCEEDED") {
        setError(t("settings.twoFactor.rateLimited"));
      } else {
        setError(t("settings.twoFactor.invalidCode"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.manualKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const is2FAEnabled = user?.twoFactorEnabled ?? false;

  return (
    <div className="mx-auto max-w-xl px-4 py-8 font-[var(--font-body)]">
      <h1 className="mb-8 font-[var(--font-heading)] text-2xl font-bold text-[var(--color-text)]">
        {t("settings.title")}
      </h1>

      {/* Language */}
      <section aria-labelledby="language-section-heading" className="mb-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2
            id="language-section-heading"
            className="mb-1 font-[var(--font-heading)] text-base font-semibold text-[var(--color-text)]"
          >
            {t("settings.language")}
          </h2>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            {t("settings.languageDescription")}
          </p>
          <LanguageSwitcher variant="menu-item" />
        </div>
      </section>

      {/* Two-Factor Authentication */}
      <section aria-labelledby="2fa-section-heading">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2
            id="2fa-section-heading"
            className="mb-1 font-[var(--font-heading)] text-base font-semibold text-[var(--color-text)]"
          >
            {t("settings.twoFactor.title")}
          </h2>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            {t("settings.twoFactor.description")}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-text-muted)]">
                {t("settings.twoFactor.status")}:
              </span>
              {is2FAEnabled ? (
                <span className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  {t("settings.twoFactor.enabled")}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm font-medium text-[var(--color-text-muted)]">
                  <ShieldOff className="h-4 w-4" />
                  {t("settings.twoFactor.disabled")}
                </span>
              )}
            </div>
            {is2FAEnabled ? (
              <Button
                variant="danger"
                onClick={() => {
                  setCode("");
                  setError("");
                  setModal("disable");
                }}
              >
                {t("settings.twoFactor.disableButton")}
              </Button>
            ) : (
              <Button variant="primary" onClick={handleOpenEnable}>
                {t("settings.twoFactor.enableButton")}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Enable 2FA modal */}
      <Modal
        isOpen={modal === "enable-loading" || modal === "enable-setup" || modal === "enable-success"}
        onClose={modal === "enable-success" ? handleCloseSuccess : resetModal}
        title={t(
          modal === "enable-success"
            ? "settings.twoFactor.setup.successTitle"
            : "settings.twoFactor.setup.modalTitle"
        )}
      >
        {modal === "enable-loading" && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {modal === "enable-setup" && (
          <div className="space-y-5">
            {error && <Alert variant="error">{error}</Alert>}

            {setupData && (
              <>
                {/* Step 1: QR code */}
                <div>
                  <p className="mb-3 text-sm font-medium text-[var(--color-text)]">
                    1. {t("settings.twoFactor.setup.step1")}
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={setupData.qrCodeDataUri}
                      alt="2FA QR Code"
                      className="h-40 w-40 rounded-lg border border-[var(--color-border)]"
                    />
                  </div>
                </div>

                {/* Step 2: Manual key */}
                <div>
                  <p className="mb-2 text-sm font-medium text-[var(--color-text)]">
                    2. {t("settings.twoFactor.setup.step2")}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg border border-[var(--color-border)] bg-gray-50 px-3 py-2 font-mono text-sm text-[var(--color-text)] dark:bg-warm-800">
                      {setupData.manualKey}
                    </code>
                    <Button variant="ghost" onClick={handleCopy} className="shrink-0">
                      {copied
                        ? t("settings.twoFactor.setup.copied")
                        : t("settings.twoFactor.setup.copyButton")}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Verify code */}
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--color-text)]">
                {setupData ? `3. ${t("settings.twoFactor.setup.step3")}` : t("settings.twoFactor.setup.step3")}
              </p>
              <FormField
                label={t("settings.twoFactor.codeLabel")}
                htmlFor="2fa-setup-code"
              >
                <Input
                  id="2fa-setup-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button variant="ghost" onClick={resetModal}>
                {t("labels.cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleVerifyEnable}
                isLoading={isSubmitting}
                disabled={code.length !== 6}
              >
                {t("settings.twoFactor.setup.verifyButton")}
              </Button>
            </div>
          </div>
        )}

        {modal === "enable-success" && (
          <div className="space-y-4">
            <Alert variant="success">
              {t("settings.twoFactor.setup.successMessage")}
            </Alert>
            <div className="flex justify-end">
              <Button variant="primary" onClick={handleCloseSuccess}>
                {t("labels.close")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Disable 2FA modal */}
      <Modal
        isOpen={modal === "disable"}
        onClose={resetModal}
        title={t("settings.twoFactor.disable.modalTitle")}
      >
        <div className="space-y-5">
          <p className="text-sm text-[var(--color-text-muted)]">
            {t("settings.twoFactor.disable.description")}
          </p>

          {error && <Alert variant="error">{error}</Alert>}

          <FormField
            label={t("settings.twoFactor.codeLabel")}
            htmlFor="2fa-disable-code"
          >
            <Input
              id="2fa-disable-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={resetModal}>
              {t("labels.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={handleDisable}
              isLoading={isSubmitting}
              disabled={code.length !== 6}
            >
              {t("settings.twoFactor.disable.confirmButton")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
