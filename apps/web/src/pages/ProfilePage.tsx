/**
 * @file ProfilePage — Profile Page — view and edit user profile.
 * FR: Page Profil — consultation et edition du profil.
 */
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, ApiError } from "../contexts/AuthContext.js";
import { usersApi } from "../api/users.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import { FormField } from "../components/ui/FormField.js";
import { Alert } from "../components/ui/Alert.js";

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

  useEffect(() => {
    document.title = `${t("labels.profile")} — Unblock.chain`;
  }, []);

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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-warm-50 font-heading">
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
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-warm-700 text-xl font-bold text-gray-400 dark:text-warm-200">
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
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm transition-colors placeholder:text-gray-400 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
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
            {t("pages.profile.twoFa")}:{" "}
            <span
              className={
                user?.twoFactorEnabled ? "text-green-600" : "text-gray-400"
              }
            >
              {user?.twoFactorEnabled ? t("pages.profile.twoFaEnabled") : t("pages.profile.twoFaDisabled")}
            </span>
          </p>
          <p>
            {t("pages.profile.memberSince")}:{" "}
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : "—"}
          </p>
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
    </div>
  );
}
