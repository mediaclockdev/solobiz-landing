"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Edit, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import FunnelFrame from "@/components/funnel/FunnelFrame";
import { auth } from "@/services/firebase";
import { signOut } from "firebase/auth";
import {
  redirectToMainAppSSO,
  handleLoginSuccess,
} from "@/lib/funnel/ssoRedirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, verifyEmail } = useAuth();

  const [isVerified, setIsVerified] = useState(
    () => searchParams.get("verified") === "true",
  );

  // If redirected with ?logout=true or ?verified=true, clear any lingering session
  useEffect(() => {
    if (
      searchParams.get("logout") === "true" ||
      searchParams.get("verified") === "true"
    ) {
      void signOut(auth);
    }
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");
    if (mode === "verifyEmail" && oobCode) {
      void (async () => {
        try {
          const res = await verifyEmail(oobCode);
          await signOut(auth);
          if (res.success) {
            setIsVerified(true);
          }
        } catch (e) {
          console.error("Verification error on login:", e);
        }
      })();
    }
  }, [searchParams, verifyEmail]);

  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleContinue = () => {
    if (validateEmail(email)) {
      setStep("password");
      setEmailError("");
    } else {
      setEmailError("Please enter a valid email address.");
    }
  };

  const handleEmailEdit = () => {
    setStep("email");
    setPassword("");
    setFormError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (step === "email") {
      handleContinue();
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    const result = await login(email.trim(), password);

    if (result.success) {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await handleLoginSuccess(uid, "/dashboard/settings?tab=my-accessories");
      } else {
        await redirectToMainAppSSO({
          redirectPath: "/dashboard/settings?tab=my-accessories",
        });
      }
      return;
    }

    let friendlyError =
      result.error?.replace(/^Firebase:\s*/i, "") ||
      "Could not sign you in. Please try again.";
    if (
      friendlyError.includes("auth/invalid-credential") ||
      friendlyError.includes("auth/wrong-password") ||
      friendlyError.includes("auth/user-not-found") ||
      friendlyError.includes("auth/invalid-login-credentials")
    ) {
      friendlyError = "Invalid email or password. Please try again.";
    }
    setFormError(friendlyError);
    setIsSubmitting(false);
  };

  return (
    <FunnelFrame className="bg-[#f5f5f5]">
      <div className="flex min-h-dvh flex-col bg-[#f5f5f5] text-foreground font-sans">
        <header className="flex h-12 items-center justify-center border-b border-[#e5e5e5] bg-[#f5f5f5] px-4 lg:px-6">
          <Link href="/" className="flex items-center justify-center gap-2">
            <span className="font-headline text-base font-bold text-black dark:text-white">
              solo
            </span>
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center bg-[#f5f5f5] px-4 pt-8">
          <div className="relative mb-3 w-full max-w-md flex items-center justify-center">
            {step === "password" ? (
              <button
                type="button"
                onClick={handleEmailEdit}
                aria-label="Back to email step"
                className="absolute left-0 top-1/2 -translate-y-1/2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100/80 hover:bg-slate-50 transition-colors">
                  <ArrowLeft className="h-4 w-4 text-slate-700" />
                </div>
              </button>
            ) : (
              <Link
                href="/"
                aria-label="Back to home"
                className="absolute left-0 top-1/2 -translate-y-1/2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100/80 hover:bg-slate-50 transition-colors">
                  <ArrowLeft className="h-4 w-4 text-slate-700" />
                </div>
              </Link>
            )}
            <h1 className="text-center text-[30px] font-bold tracking-tight text-[#0f172a] dark:text-white">
              Log In
            </h1>
          </div>

          <div className="mb-7 w-full max-w-md text-center">
            <p className="text-[15px] font-normal text-slate-500">
              Login to your account to start networking.
            </p>
          </div>

          {isVerified && (
            <div className="mb-5 w-full max-w-md rounded-2xl border border-emerald-200 bg-[#f0fff9] p-3.5 text-center text-xs font-medium text-emerald-800 shadow-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Email verified successfully! Please log in to your account.</span>
            </div>
          )}

          <Card className="w-full max-w-md rounded-3xl shadow-sm border border-slate-100 bg-white">
            <CardContent className="p-7">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-900 block">
                    Email
                  </Label>
                  {step === "password" ? (
                    <div
                      onClick={handleEmailEdit}
                      className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200/70 bg-[#f4f7fe] px-3.5 text-sm text-slate-600 cursor-pointer transition-colors hover:border-slate-300"
                    >
                      <span className="truncate select-none font-normal text-slate-600">{email}</span>
                      <button
                        type="button"
                        aria-label="Change email"
                        className="text-slate-500 hover:text-slate-800"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 text-sm rounded-xl border border-[#e5e5e5] !bg-white focus-visible:ring-black placeholder:text-slate-400 font-normal"
                        autoFocus
                      />
                      {emailError && (
                        <p className="text-xs text-destructive mt-1.5">{emailError}</p>
                      )}
                    </div>
                  )}
                </div>

                {step === "password" && (
                  <div className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-sm font-semibold text-slate-900 block">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={isPasswordVisible ? "text" : "password"}
                          placeholder="password"
                          required
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 text-sm rounded-xl border border-[#e5e5e5] !bg-white pr-10 focus-visible:ring-black placeholder:text-slate-400 font-normal"
                          autoFocus
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          onClick={() => setIsPasswordVisible((v) => !v)}
                          aria-label={
                            isPasswordVisible
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {isPasswordVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-0.5 text-xs text-slate-600">
                      <Link
                        href="/signup"
                        className="hover:text-black font-medium"
                      >
                        Don&apos;t have an account?{" "}
                        <span className="font-semibold underline underline-offset-2 text-slate-800">
                          Sign Up
                        </span>
                      </Link>
                      <Link
                        href="/forgot"
                        className="font-medium text-slate-600 hover:text-black hover:underline underline-offset-2"
                      >
                        Forgot Password?
                      </Link>
                    </div>

                    {formError && (
                      <div
                        role="alert"
                        className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
                      >
                        {formError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-12 w-full rounded-2xl bg-[#212121] text-white hover:bg-neutral-800 font-semibold text-base mt-2 shadow-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Log In"
                      )}
                    </Button>
                  </div>
                )}

                {step === "email" && (
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-2xl bg-[#212121] text-white hover:bg-neutral-800 font-semibold text-base mt-2 shadow-sm"
                  >
                    Continue
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </main>

        <footer className="mt-auto flex w-full shrink-0 flex-col items-center gap-2 border-t border-[#e5e5e5] py-3 sm:flex-row bg-[#f5f5f5]">
          <nav className="flex w-full justify-between px-4 md:px-6">
            <a
              href="https://www.solobizcards.com/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted-foreground underline-offset-4 no-underline hover:no-underline"
            >
              Terms
            </a>
            <a
              href="https://www.solobizcards.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted-foreground underline-offset-4 no-underline hover:no-underline"
            >
              Privacy
            </a>
            <a
              href="https://www.solobizcards.com/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted-foreground underline-offset-4 no-underline hover:no-underline"
            >
              Subscription
            </a>
            <a
              href="https://www.solobizcards.com/support"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted-foreground underline-offset-4 no-underline hover:no-underline"
            >
              Help
            </a>
            <a
              href="https://www.solobizcards.com/accessories"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted-foreground underline-offset-4 no-underline hover:no-underline"
            >
              Shop
            </a>
          </nav>
        </footer>
      </div>
    </FunnelFrame>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
