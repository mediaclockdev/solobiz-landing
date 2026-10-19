"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { redirectToMainAppSSO, getMainAppUrl } from "./ssoRedirect";

export { getMainAppUrl };

export const POST_AUTH_DESTINATION =
  process.env.NEXT_PUBLIC_MAIN_APP_URL ||
  process.env.NEXT_PUBLIC_MAIN_URL ||
  "https://solobizcard-rho.vercel.app/";

/**
 * Formerly redirected signed-in visitors away from auth screens.
 * Auto-redirection on mount is disabled to prevent cross-domain redirect loops
 * when users log out on the main app or visit/hard-refresh the landing page.
 */
export function useRedirectIfSignedIn(redirectPath?: string) {
  const { user, isLoading } = useAuth();

  // Deliberate no-op: Automatic redirects across domains on mount trap users
  // and prevent visitors from viewing the landing page or logging in as another user.

  return { isCheckingSession: isLoading, isSignedIn: Boolean(user) };
}
