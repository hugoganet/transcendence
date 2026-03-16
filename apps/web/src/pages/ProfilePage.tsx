import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth, ApiError } from "../contexts/AuthContext.js";
import { usersApi } from "../api/users.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import { FormField } from "../components/ui/FormField.js";
import { Alert } from "../components/ui/Alert.js";

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    document.title = "Profile — Transcendence";
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess("");
    setIsSaving(true);

    try {
      await usersApi.updateProfile({
        displayName: displayName || undefined,
        bio: bio || undefined,
      });
      await refreshUser();
      setSuccess("Profile updated");
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
      } else {
        setErrors({ form: "Failed to update profile" });
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
      setSuccess("Avatar updated");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({
          avatar:
            err.code === "FILE_TOO_LARGE"
              ? "Avatar must be under 2MB"
              : err.code === "INVALID_FILE_TYPE"
                ? "Only JPEG, PNG, and WebP are accepted"
                : "Failed to upload avatar",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 font-heading">
        Profile
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
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-400">
              {(user?.displayName ?? user?.email ?? "?")[0].toUpperCase()}
            </div>
          )}
          <div>
            <label className="cursor-pointer">
              <span className="text-sm font-medium text-primary hover:text-primary/80">
                {isUploading ? "Uploading..." : "Change avatar"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
            </label>
            <p className="text-xs text-gray-400">JPEG, PNG, or WebP. Max 2MB.</p>
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
          <FormField label="Email" htmlFor="email">
            <Input id="email" value={user?.email ?? ""} disabled />
          </FormField>
          <FormField
            label="Display Name"
            error={errors.displayName}
            htmlFor="displayName"
          >
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="Your display name"
              error={errors.displayName}
            />
          </FormField>
          <FormField label="Bio" error={errors.bio} htmlFor="bio">
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Tell us about yourself"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm transition-colors placeholder:text-gray-400 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </FormField>
          <Button type="submit" isLoading={isSaving}>
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Account info */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Account</h2>
        <div className="space-y-2 text-sm text-gray-500">
          <p>
            2FA:{" "}
            <span
              className={
                user?.twoFactorEnabled ? "text-green-600" : "text-gray-400"
              }
            >
              {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
            </span>
          </p>
          <p>
            Member since:{" "}
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </Card>

      {/* Settings links */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Settings</h2>
        <div className="space-y-1">
          <Link
            to="/settings/notifications"
            className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Notification Preferences
          </Link>
          <Link
            to="/certificate"
            className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Certificate
          </Link>
          <Link
            to="/settings/data-export"
            className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Export My Data
          </Link>
          <Link
            to="/settings/delete-account"
            className="block rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Delete Account
          </Link>
        </div>
      </Card>
    </div>
  );
}
