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
 * Redirects someone who is already signed in away from auth screens
 * to the Main App via Cross-Domain SSO.
 */
export function useRedirectIfSignedIn(redirectPath?: string) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      void redirectToMainAppSSO({ redirectPath });
    }
  }, [isLoading, user, redirectPath]);

  return { isCheckingSession: isLoading, isSignedIn: Boolean(user) };
}
