"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bell,
  Eye,
  EyeOff,
  Save,
  Shield,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect,useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { generateAvatarUrl } from "@/lib/utils";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store";

const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      resetProfile({
        displayName: user.displayName,
        email: user.email,
        bio: user.bio || "",
      });
    }
  }, [isAuthenticated, user, router, resetProfile]);

  const onSubmitProfile = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPassword = async (data: PasswordForm) => {
    setIsLoading(true);
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      resetPassword();
      toast.success("Password changed successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const updatedUser = await authService.uploadAvatar(formData);
      setUser(updatedUser);
      toast.success("Avatar updated successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      return;
    }

    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmation !== "DELETE") {
      toast.error("Account deletion cancelled");
      return;
    }

    setIsLoading(true);
    try {
      await authService.deleteAccount();
      toast.success("Account deleted successfully");
      // The auth service should handle logout
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and security settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={user.avatar || generateAvatarUrl(user.username)}
                    alt={user.displayName}
                    className="w-24 h-24 rounded-full mx-auto mb-4"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>

                <h3 className="font-medium text-lg">{user.displayName}</h3>
                <p className="text-muted-foreground">@{user.username}</p>

                <div className="flex justify-center mt-4">
                  {user.isStreamer && (
                    <Badge className="bg-purple-500 text-white">Streamer</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmitProfile(onSubmitProfile)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Display Name
                  </label>
                  <Input
                    {...registerProfile("displayName")}
                    placeholder="Your display name"
                  />
                  {profileErrors.displayName && (
                    <p className="text-red-500 text-sm mt-1">
                      {profileErrors.displayName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <Input
                    {...registerProfile("email")}
                    type="email"
                    placeholder="your.email@example.com"
                  />
                  {profileErrors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {profileErrors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    {...registerProfile("bio")}
                    className="w-full px-3 py-2 border border-input rounded-md"
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                  {profileErrors.bio && (
                    <p className="text-red-500 text-sm mt-1">
                      {profileErrors.bio.message}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmitPassword(onSubmitPassword)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      {...registerPassword("currentPassword")}
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter your current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      {...registerPassword("newPassword")}
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      {...registerPassword("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={isLoading}>
                  <Shield className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about your account
                    </p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Stream Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when channels you follow go live
                    </p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Comment Replies</p>
                    <p className="text-sm text-muted-foreground">
                      Notifications when someone replies to your comments
                    </p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <Trash2 className="w-5 h-5 mr-2" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-red-600 mb-2">
                    Delete Account
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
