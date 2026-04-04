/**
 * @file ProfilePage — Profile Page — view and edit user profile.
 * FR: Page Profil — consultation et edition du profil.
 */
import { useEffect, useState, useCallback, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle, ShieldOff } from "lucide-react";
import { useAuth, ApiError } from "../contexts/AuthContext.js";
import { usersApi } from "../api/users.js";
import { authApi } from "../api/auth.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import { FormField } from "../components/ui/FormField.js";
import { Alert } from "../components/ui/Alert.js";
import { Modal } from "../components/ui/Modal.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { LanguageSwitcher } from "../components/LanguageSwitcher.js";

type TwoFaModalState =
  | "closed"
  | "enable-loading"
  | "enable-setup"
  | "enable-success"
  | "disable";

interface SetupData {
  qrCodeDataUri: string;
  manualKey: string;
}

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [ethereumWallet, setEthereumWallet] = useState(user?.ethereumWallet ?? "",);
  const [bio, setBio] = useState(user?.bio ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 2FA state
  const [twoFaModal, setTwoFaModal] = useState<TwoFaModalState>("closed");
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaError, setTwoFaError] = useState("");
  const [isTwoFaSubmitting, setIsTwoFaSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const resetTwoFaModal = useCallback(() => {
    setTwoFaModal("closed");
    setSetupData(null);
    setTwoFaCode("");
    setTwoFaError("");
    setIsTwoFaSubmitting(false);
    setCopied(false);
  }, []);

  // Fetch QR code when enable modal opens
  useEffect(() => {
    if (twoFaModal !== "enable-loading") return;
    let cancelled = false;
    authApi.setup2FA().then(
      (data) => {
        if (!cancelled) {
          setSetupData({ qrCodeDataUri: data.qrCodeDataUri, manualKey: data.manualKey });
          setTwoFaModal("enable-setup");
        }
      },
      () => {
        if (!cancelled) {
          setTwoFaError(t("errors.serverError"));
          setTwoFaModal("enable-setup");
        }
      }
    );
    return () => { cancelled = true; };
  }, [twoFaModal, t]);

  const handleOpenEnable2FA = () => {
    setTwoFaError("");
    setTwoFaCode("");
    setTwoFaModal("enable-loading");
  };

  const handleVerifyEnable2FA = async () => {
    if (!/^\d{6}$/.test(twoFaCode)) {
      setTwoFaError(t("auth.twoFactor.codeMustBe6Digits"));
      return;
    }
    setIsTwoFaSubmitting(true);
    setTwoFaError("");
    try {
      await authApi.verifyAndEnable2FA(twoFaCode);
      setTwoFaModal("enable-success");
    } catch (err) {
      if (err instanceof ApiError && err.code === "RATE_LIMIT_EXCEEDED") {
        setTwoFaError(t("settings.twoFactor.rateLimited"));
      } else {
        setTwoFaError(t("settings.twoFactor.invalidCode"));
      }
    } finally {
      setIsTwoFaSubmitting(false);
    }
  };

  const handleCloseSuccess2FA = async () => {
    resetTwoFaModal();
    await refreshUser();
  };

  const handleDisable2FA = async () => {
    if (!/^\d{6}$/.test(twoFaCode)) {
      setTwoFaError(t("auth.twoFactor.codeMustBe6Digits"));
      return;
    }
    setIsTwoFaSubmitting(true);
    setTwoFaError("");
    try {
      await authApi.disable2FA(twoFaCode);
      resetTwoFaModal();
      await refreshUser();
    } catch (err) {
      if (err instanceof ApiError && err.code === "RATE_LIMIT_EXCEEDED") {
        setTwoFaError(t("settings.twoFactor.rateLimited"));
      } else {
        setTwoFaError(t("settings.twoFactor.invalidCode"));
      }
    } finally {
      setIsTwoFaSubmitting(false);
    }
  };

  const handleCopyManualKey = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.manualKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const is2FAEnabled = user?.twoFactorEnabled ?? false;

  useEffect(() => {
    document.title = `${t("labels.profile")} — Unblock.chain`;
  }, []);

  useEffect(() => {
    setEthereumWallet(user?.ethereumWallet ?? "");
  }, [user?.ethereumWallet]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess("");
    setIsSaving(true);

    try {
      const trimmedWallet = ethereumWallet.trim();
      await usersApi.updateProfile({
        displayName: displayName || undefined,
        bio: bio || undefined,
        ethereumWallet:
          trimmedWallet === "" ? null : trimmedWallet,
      });
      await refreshUser();
      setSuccess(t("pages.profile.updateSuccess"));
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
      } else {
        setErrors({ form: t("pages.profile.updateError") });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await usersApi.uploadAvatar(file);
      await refreshUser();
      setSuccess(t("pages.profile.avatarUpdated"));
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({
          avatar:
            err.code === "FILE_TOO_LARGE"
              ? t("pages.profile.avatarTooLarge")
              : err.code === "INVALID_FILE_TYPE"
                ? t("pages.profile.avatarInvalidType")
                : t("pages.profile.avatarUploadError"),
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)] font-heading">
        {t("labels.profile")}
      </h1>

      {/* Avatar */}
      <Card>
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-border)] text-xl font-bold text-gray-400 dark:text-warm-200">
              {(user?.displayName ?? user?.email ?? "?")[0].toUpperCase()}
            </div>
          )}
          <div>
            <label className="cursor-pointer">
              <span className="text-sm font-medium text-primary hover:text-primary/80">
                {isUploading ? t("pages.profile.uploading") : t("pages.profile.changeAvatar")}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
            </label>
            <p className="text-xs text-gray-400">{t("pages.profile.avatarHint")}</p>
            {errors.avatar && (
              <p className="text-xs text-red-600">{errors.avatar}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Profile form */}
      <Card>
        {success && (
          <Alert variant="success" className="mb-4">
            {success}
          </Alert>
        )}
        {errors.form && (
          <Alert variant="error" className="mb-4">
            {errors.form}
          </Alert>
        )}
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label={t("pages.profile.emailLabel")} htmlFor="email">
            <Input id="email" value={user?.email ?? ""} disabled />
          </FormField>
          <FormField
            label={t("pages.profile.displayNameLabel")}
            error={errors.displayName}
            htmlFor="displayName"
          >
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder={t("pages.profile.displayNamePlaceholder")}
              error={errors.displayName}
            />
          </FormField>
          <FormField
            label={t("pages.profile.walletLabel")}
            error={errors.ethereumWallet}
            htmlFor="ethereumWallet"
          >
            <Input
              id="ethereumWallet"
              value={ethereumWallet}
              onChange={(e) => setEthereumWallet(e.target.value)}
              maxLength={42}
              placeholder="0x"
              error={errors.ethereumWallet}
            />
          </FormField>
          <FormField label={t("pages.profile.bioLabel")} error={errors.bio} htmlFor="bio">
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder={t("pages.profile.bioPlaceholder")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-muted)] hover:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </FormField>
          <Button type="submit" isLoading={isSaving}>
            {t("pages.profile.saveChanges")}
          </Button>
        </form>
      </Card>

      {/* Account info */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">{t("pages.profile.accountSection")}</h2>
        <div className="space-y-2 text-sm text-gray-500">
          <p>
            {t("pages.profile.memberSince")}:{" "}
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </Card>

      {/* Language */}
      <Card>
        <h2 className="mb-1 text-sm font-semibold text-gray-900">
          {t("settings.language")}
        </h2>
        <p className="mb-4 text-xs text-gray-500">
          {t("settings.languageDescription")}
        </p>
        <LanguageSwitcher variant="menu-item" />
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <h2 className="mb-1 text-sm font-semibold text-gray-900">
          {t("settings.twoFactor.title")}
        </h2>
        <p className="mb-4 text-xs text-gray-500">
          {t("settings.twoFactor.description")}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {t("settings.twoFactor.status")}:
            </span>
            {is2FAEnabled ? (
              <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                <CheckCircle className="h-4 w-4" />
                {t("settings.twoFactor.enabled")}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm font-medium text-gray-400">
                <ShieldOff className="h-4 w-4" />
                {t("settings.twoFactor.disabled")}
              </span>
            )}
          </div>
          {is2FAEnabled ? (
            <Button
              variant="danger"
              onClick={() => {
                setTwoFaCode("");
                setTwoFaError("");
                setTwoFaModal("disable");
              }}
            >
              {t("settings.twoFactor.disableButton")}
            </Button>
          ) : (
            <Button variant="primary" onClick={handleOpenEnable2FA}>
              {t("settings.twoFactor.enableButton")}
            </Button>
          )}
        </div>
      </Card>

      {/* Settings links */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">{t("labels.settings")}</h2>
        <div className="space-y-1">
          <Link
            to="/settings/notifications"
            className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            {t("pages.profile.notificationPreferences")}
          </Link>
          <Link
            to="/certificate"
            className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            {t("pages.profile.certificate")}
          </Link>
          <Link
            to="/settings/data-export"
            className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            {t("pages.profile.exportData")}
          </Link>
          <Link
            to="/settings/delete-account"
            className="block rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            {t("pages.profile.deleteAccount")}
          </Link>
        </div>
      </Card>

      {/* Enable 2FA modal */}
      <Modal
        isOpen={twoFaModal === "enable-loading" || twoFaModal === "enable-setup" || twoFaModal === "enable-success"}
        onClose={twoFaModal === "enable-success" ? handleCloseSuccess2FA : resetTwoFaModal}
        title={t(
          twoFaModal === "enable-success"
            ? "settings.twoFactor.setup.successTitle"
            : "settings.twoFactor.setup.modalTitle"
        )}
      >
        {twoFaModal === "enable-loading" && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {twoFaModal === "enable-setup" && (
          <div className="space-y-5">
            {twoFaError && <Alert variant="error">{twoFaError}</Alert>}

            {setupData && (
              <>
                <div>
                  <p className="mb-3 text-sm font-medium text-gray-900">
                    1. {t("settings.twoFactor.setup.step1")}
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={setupData.qrCodeDataUri}
                      alt="2FA QR Code"
                      className="h-40 w-40 rounded-lg border border-gray-200"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-gray-900">
                    2. {t("settings.twoFactor.setup.step2")}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm">
                      {setupData.manualKey}
                    </code>
                    <Button variant="ghost" onClick={handleCopyManualKey} className="shrink-0">
                      {copied
                        ? t("settings.twoFactor.setup.copied")
                        : t("settings.twoFactor.setup.copyButton")}
                    </Button>
                  </div>
                </div>
              </>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-gray-900">
                {setupData ? `3. ${t("settings.twoFactor.setup.step3")}` : t("settings.twoFactor.setup.step3")}
              </p>
              <FormField
                label={t("settings.twoFactor.codeLabel")}
                htmlFor="2fa-setup-code"
              >
                <Input
                  id="2fa-setup-code"
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button variant="ghost" onClick={resetTwoFaModal}>
                {t("labels.cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleVerifyEnable2FA}
                isLoading={isTwoFaSubmitting}
                disabled={twoFaCode.length !== 6}
              >
                {t("settings.twoFactor.setup.verifyButton")}
              </Button>
            </div>
          </div>
        )}

        {twoFaModal === "enable-success" && (
          <div className="space-y-4">
            <Alert variant="success">
              {t("settings.twoFactor.setup.successMessage")}
            </Alert>
            <div className="flex justify-end">
              <Button variant="primary" onClick={handleCloseSuccess2FA}>
                {t("labels.close")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Disable 2FA modal */}
      <Modal
        isOpen={twoFaModal === "disable"}
        onClose={resetTwoFaModal}
        title={t("settings.twoFactor.disable.modalTitle")}
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-500">
            {t("settings.twoFactor.disable.description")}
          </p>

          {twoFaError && <Alert variant="error">{twoFaError}</Alert>}

          <FormField
            label={t("settings.twoFactor.codeLabel")}
            htmlFor="2fa-disable-code"
          >
            <Input
              id="2fa-disable-code"
              value={twoFaCode}
              onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={resetTwoFaModal}>
              {t("labels.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={handleDisable2FA}
              isLoading={isTwoFaSubmitting}
              disabled={twoFaCode.length !== 6}
            >
              {t("settings.twoFactor.disable.confirmButton")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
