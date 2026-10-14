"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function VerifyEmailPage() {
  const { verifyEmail } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Verifying your email...");
  const { showToast } = useToast();

  /**
   * Where to go once the address is confirmed.
   *
   * Firebase adds `continueUrl` to the action link when the sender asked for
   * one, and the action handler on "/" forwards the whole query string here.
   * Someone who signed up through the /welcome funnel gets sent back to
   * /welcome/login instead of the dashboard; everyone else keeps landing on
   * "/", exactly as before.
   *
   * Only the path is used, and only from a same-origin URL. A continueUrl is
   * attacker-supplied as far as this page is concerned - it arrives in the
   * query string - so handing it straight to router.replace would be an open
   * redirect.
   */
  const destinationAfterVerify = () => {
    const continueUrl = searchParams.get("continueUrl");
    if (!continueUrl) return "/";

    /* Must look like a destination before it is resolved: anything else
       ("not a url", a stray word) would resolve against the origin into a
       same-origin path that simply 404s. "//host" is protocol-relative, i.e.
       another site wearing a relative-looking disguise. */
    const isAbsolute = /^https?:\/\//i.test(continueUrl);
    const isRootRelative =
      continueUrl.startsWith("/") && !continueUrl.startsWith("//");
    if (!isAbsolute && !isRootRelative) return "/";

    try {
      const target = new URL(continueUrl, window.location.origin);
      if (target.origin !== window.location.origin) return "/";
      return `${target.pathname}${target.search}${target.hash}`;
    } catch {
      return "/";
    }
  };

  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    if (mode === "verifyEmail" && oobCode) {
      verifyEmail(oobCode).then((res) => {
        if (res.success) {
          setStatus("✅ Email verified successfully! Redirecting to login...");
          setTimeout(() => router.replace(destinationAfterVerify()), 1000);
        } else {
          setStatus("❌ Verification failed: " + res.error);
        }
      });
    }
  }, [searchParams]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>{status}</p>
    </div>
  );
}
