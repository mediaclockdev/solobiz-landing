"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/** Where the funnel sends people once they are in. */
export const POST_AUTH_DESTINATION = "/dashboard/accessories";

/**
 * Bounce someone who is already signed in off the funnel's auth screens.
 *
 * `user` from AuthContext is the right test rather than auth.currentUser:
 * it is only set for an account that has a Firestore profile AND is verified
 * AND is active. Someone who has just created an account on the signup screen
 * has a Firebase session but none of those, so they stay null and are left
 * alone to finish onboarding - which is exactly what the onboarding screen
 * needs.
 *
 * Nothing happens until isLoading clears, or the first render would bounce
 * every visitor before Firebase had restored the session.
 */
export function useRedirectIfSignedIn(destination = POST_AUTH_DESTINATION) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(destination);
    }
  }, [isLoading, user, router, destination]);

  /** True while we do not yet know, so a screen can hold off painting. */
  return { isCheckingSession: isLoading, isSignedIn: Boolean(user) };
}
