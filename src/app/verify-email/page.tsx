"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/services/firebase";
import { signOut } from "firebase/auth";
import FunnelFrame from "@/components/funnel/FunnelFrame";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

function VerifyEmailContent() {
  const { verifyEmail } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) return;

    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    if (mode === "verifyEmail" && oobCode) {
      hasExecutedRef.current = true;
      verifyEmail(oobCode).then(async (res) => {
        if (res.success) {
          await signOut(auth);
          setStatus("success");
          setTimeout(() => {
            const emailParam = res.email
              ? `&email=${encodeURIComponent(res.email)}`
              : "";
            router.replace(`/login?verified=true${emailParam}`);
          }, 1500);
        } else {
          setStatus("error");
          const rawErr = res.error || "";
          if (
            rawErr.includes("invalid-action-code") ||
            rawErr.includes("expired")
          ) {
            setErrorMessage(
              "This verification link has expired or has already been used. If you have already verified, please proceed to Log In.",
            );
          } else {
            setErrorMessage(rawErr || "Verification link is invalid or expired.");
          }
        }
      });
    } else {
      setStatus("error");
      setErrorMessage("No verification code found in this link.");
    }
  }, [searchParams, router, verifyEmail]);

  return (
    <FunnelFrame className="bg-[#f5f5f5]">
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f5f5f5] px-4 font-sans text-foreground">
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          {status === "loading" && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-slate-800" />
              <h2 className="text-xl font-bold text-slate-900">
                Verifying your email...
              </h2>
              <p className="text-sm text-slate-500">
                Please wait a moment while we verify your account.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Email Verified!
              </h2>
              <p className="text-sm text-slate-500">
                Redirecting you to Log In to enter your password...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <XCircle className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Verification Notice
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={() => router.replace("/login")}
                className="mt-2 h-12 w-full rounded-2xl bg-[#212121] text-base font-semibold text-white transition-colors hover:bg-neutral-800 shadow-sm"
              >
                Go to Log In
              </button>
            </div>
          )}
        </div>
      </div>
    </FunnelFrame>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f5f5f5]" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
