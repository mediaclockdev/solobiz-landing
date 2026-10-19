"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/services/firebase";
import { Loader2 } from "lucide-react";
import FunnelFrame from "@/components/funnel/FunnelFrame";

function SSOReceiver() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const redirectPath =
      searchParams.get("redirect") || "/dashboard/settings?tab=my-accessories";

    if (!token) {
      setError("No SSO authentication token provided.");
      setTimeout(() => router.replace("/login"), 2000);
      return;
    }

    signInWithCustomToken(auth, token)
      .then(() => {
        router.replace(redirectPath);
      })
      .catch((err) => {
        console.error("SSO sign-in error:", err);
        setError("Authentication failed. Redirecting to login...");
        setTimeout(() => router.replace("/login"), 2500);
      });
  }, [searchParams, router]);

  return (
    <FunnelFrame>
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
        {error ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <div className="space-y-1">
              <h2 className="font-headline text-lg font-bold text-slate-900">
                Signing you in...
              </h2>
              <p className="text-xs text-muted-foreground">
                Connecting your session to SoloBizCards
              </p>
            </div>
          </div>
        )}
      </div>
    </FunnelFrame>
  );
}

export default function SSOPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SSOReceiver />
    </Suspense>
  );
}
