/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  authService,
  tokenManager,
  User,
  LoginCredentials,
  RegisterData,
} from "@/services/apiAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

// Query keys for caching
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
};

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useRouter();

  // Query: Get current user
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: authKeys.user(),
    queryFn: () => authService.getMe(),
    // Don't retry on 401/403
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.status === 403) return false;
      return failureCount < 3;
    },
    // Only run if we have an access token
    enabled: !!tokenManager.getAccessToken(),
    staleTime: Infinity, // it should never go stale
  });

  const currentUser = user ?? tokenManager.getUser();
  // Freshness normally means the server just confirmed who this is, via
  // the getMe query above. Offline that confirmation is impossible by
  // definition, and treating it as mandatory locks a signed in officer
  // out of the app entirely, stuck on the loading screen, which makes
  // offline capture impossible. So when the browser is offline, a stored
  // user with a token counts as fresh enough for LOCAL purposes: it only
  // unlocks the interface and the on-device queue. The server still
  // validates the token itself when the queue syncs, and rejects it
  // there if it has expired.
  const isOffline =
    typeof navigator !== "undefined" && !navigator.onLine;
  const isUserDataFresh = !!user || (isOffline && !!currentUser);

  // Mutation: Login
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: (response) => {
      const { accessToken, refreshToken, user } = response;

      tokenManager.setAccessToken(accessToken);
      tokenManager.setRefreshToken(refreshToken);
      tokenManager.setUser(user ?? null);

      if (user) {
        queryClient.setQueryData(authKeys.user(), user);
        refetchUser();
      }

      // // Check if user needs onboarding
      // const isCitizenOrBusiness =
      //   user?.role === "citizen" || user?.role === "business_owner";
      // const needsOnboarding = isCitizenOrBusiness && !user?.onboardingCompleted;

      // if (needsOnboarding) {
      //   // Redirect to onboarding page
      //   navigate.push("/onboarding");
      //   toast.info("Please complete your profile to continue.");
      // } else {
        // Redirect to dashboard
        navigate.push("/dashboard");
      // }
    },
    onError: (error) => {
      console.error("❌ LOGIN FAILED:", error);
      // Handle error (already handled by toast in the component)
    },
  });

  // Mutation: Register
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (userData) => {
      // After registration, you might want to automatically login
      // Or redirect to login page
      //   navigate({ to: "/dashboard" });

      navigate.push(
        `/login?registered=true&email=${encodeURIComponent(userData.user.email)}`,
      );
    },
  });

  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState<Error | null>(null);

  const verifyEmailMutation = useMutation({
    mutationFn: async ({ token }: { token: string }) =>
      authService.verifyEmail(token),
  });

  const resendVerification = useMutation({
    mutationFn: async ({ email }: { email: string }) =>
      authService.resendEmail(email),
    onSuccess: (data) => {
      setResendSuccess(data.message || "Verification email sent successfully!");
      setResendError(null);
      // Clear success message after 5 seconds
      setTimeout(() => setResendSuccess(null), 5000);
    },
    onError: (error: Error) => {
      setResendError(error);
      setResendSuccess(null);
    },
  });

  // Mutation: Update Profile
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<User>) => authService.updateUserProfile(data),
    onSuccess: (updatedUser) => {
      tokenManager.setUser(updatedUser);
      queryClient.setQueryData(authKeys.user(), updatedUser);
    },
    onError: (error) => {
      console.error("❌ UPDATE PROFILE FAILED:", error);
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (data: { email: string }) => authService.forgotPassword(data),
    onSuccess: () => {
      toast.success("Password reset link sent to your email");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send reset link");
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (data: {
      token: string;
      newPassword: string;
      confirmPassword: string;
    }) => authService.resetPassword(data),
    onSuccess: () => {
      toast.success("Password reset successfully. You can now log in.");
      navigate.push("/login");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reset password");
    },
  });

  // Change Password Mutation (authenticated)
  const changePasswordMutation = useMutation({
    mutationFn: (data: {
      oldPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => authService.changePassword(data),
    onSuccess: (response) => {
      if (response?.accessToken) {
        tokenManager.setAccessToken(response.accessToken);
      }
      toast.success("Password changed successfully");
      // Optionally logout or stay logged in
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to change password");
    },
  });

  // Mutation: Logout
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onMutate: () => {
      // 🔥 Clear IMMEDIATELY on logout click (optimistic update)
      tokenManager.clearAllTokens();
      queryClient.clear();
      // Redirect instantly
      navigate.push("/login");
    },
    onSettled: () => {
      // This runs after the API call (even if it fails)
      // But we already cleared and redirected above
    },
  });

  // Manual refresh token function (can be called when needed)
  const refreshAccessToken = async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await authService.refreshToken(refreshToken);
    tokenManager.setAccessToken(response.accessToken);
    return response.accessToken;
  };

  return {
    // State
    user: currentUser,
    isAuthenticated: !!currentUser,
    isLoadingUser,
    isUserDataFresh,
    userError,
    userWard: currentUser?.ward?.name,

    // Actions
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    updateProfileError: updateProfileMutation.error,

    forgotPassword: forgotPasswordMutation.mutate,
    forgotPasswordAsync: forgotPasswordMutation.mutateAsync,
    isForgotPasswordLoading: forgotPasswordMutation.isPending,
    forgotPasswordError: forgotPasswordMutation.error,

    // Reset Password
    resetPassword: resetPasswordMutation.mutate,
    resetPasswordAsync: resetPasswordMutation.mutateAsync,
    isResetPasswordLoading: resetPasswordMutation.isPending,
    resetPasswordError: resetPasswordMutation.error,

    // Change Password
    changePassword: changePasswordMutation.mutate,
    changePasswordAsync: changePasswordMutation.mutateAsync,
    isChangePasswordLoading: changePasswordMutation.isPending,
    changePasswordError: changePasswordMutation.error,

    // googleLogin: googleLoginMutation.mutate,
    // googleLoginAsync: googleLoginMutation.mutateAsync,
    // isGoogleLoggingIn: googleLoginMutation.isPending,

    verifyEmail: verifyEmailMutation.mutateAsync,
    isVerifying: verifyEmailMutation.isPending,
    verifyError: verifyEmailMutation.error,
    resendVerification: resendVerification.mutateAsync,
    isResending: resendVerification.isPending,
    resendError,
    resendSuccess,

    logout: logoutMutation.mutate,
    logoutAsync: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,

    refetchUser,
    refreshAccessToken,
  };
}

// Optional: Hook to check if user has specific role
export function useHasRole(allowedRoles: string[]) {
  const { user } = useAuth();

  if (!user) return false;
  return allowedRoles.includes(user.role);
}

// Optional: Hook for protected routes
export function useRequireAuth(redirectTo = "/login") {
  const { isAuthenticated, isLoadingUser } = useAuth();
  const navigate = useRouter();

  if (!isLoadingUser && !isAuthenticated) {
    navigate.push(`${redirectTo}`);
  }

  return { isAuthenticated, isLoadingUser };
}
