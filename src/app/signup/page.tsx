"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { auth } from "@/services/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import FunnelFrame from "@/components/funnel/FunnelFrame";

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [wantsUpdates, setWantsUpdates] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleContinue = () => {
    if (validateEmail(email.trim())) {
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (step === "email") {
      handleContinue();
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      router.replace(
        `/onboarding?email=${encodeURIComponent(email.trim())}` +
          `&updates=${wantsUpdates ? "1" : "0"}`,
      );
    } catch (error: any) {
      setFormError(
        error?.code === "auth/email-already-in-use"
          ? "That email already has an account. Try logging in instead."
          : String(error?.message || "")
              .replace(/^Firebase:\s*/i, "")
              .trim() || "Could not create your account. Please try again.",
      );
      setIsSubmitting(false);
    }
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
              Sign Up
            </h1>
          </div>

          <div className="mb-7 w-full max-w-md text-center">
            <p className="text-base font-normal text-slate-500">
              Create your account to start networking.
            </p>
          </div>

          <Card className="w-full max-w-md rounded-3xl shadow-sm border border-slate-100 bg-white">
            <CardContent className="p-7">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-900 block">
                    Email
                  </Label>
                  {step === "password" ? (
                    <div
                      onClick={handleEmailEdit}
                      className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200/70 bg-[#f4f7fe] px-3.5 text-sm text-slate-600 cursor-pointer transition-colors hover:border-slate-300"
                    >
                      <span className="truncate select-none font-normal">{email}</span>
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
                          autoComplete="new-password"
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

                    <div
                      onClick={() => setWantsUpdates(!wantsUpdates)}
                      className="flex items-center space-x-2.5 pt-0.5 cursor-pointer select-none group"
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors",
                          wantsUpdates
                            ? "bg-[#18181b] text-white"
                            : "border border-slate-300 bg-white group-hover:border-slate-400",
                        )}
                      >
                        {wantsUpdates && (
                          <Check className="h-2.5 w-2.5 stroke-[3] text-white" />
                        )}
                      </div>
                      <span className="text-sm text-[#475569] font-normal">
                        Yes, send me the latest updates and news
                      </span>
                    </div>

                    {formError && (
                      <div
                        role="alert"
                        className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
                      >
                        {formError}
                        {formError.includes("already has an account") && (
                          <Link
                            href="/login"
                            className="ml-1 font-bold underline underline-offset-2 text-slate-900"
                          >
                            Log in
                          </Link>
                        )}
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
                          Creating account...
                        </>
                      ) : (
                        "Sign Up"
                      )}
                    </Button>
                  </div>
                )}

                {step === "email" && (
                  <Button
                    type="button"
                    onClick={handleContinue}
                    className="h-12 w-full rounded-2xl bg-[#212121] text-white hover:bg-neutral-800 font-semibold text-base mt-2 shadow-sm"
                  >
                    Continue
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {step === "password" && (
            <div className="mt-8 mb-6 w-full max-w-md text-center text-sm text-[#64748b]">
              <p>
                By clicking &quot;Sign Up&quot; you agree with our{" "}
                <a
                  href="https://www.solobizcards.com/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2 text-[#334155] hover:text-black"
                >
                  Terms
                </a>{" "}
                &amp;{" "}
                <a
                  href="https://www.solobizcards.com/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2 text-[#334155] hover:text-black"
                >
                  Privacy
                </a>
              </p>
            </div>
          )}
        </main>

        <footer className="mt-auto flex w-full shrink-0 flex-col items-center gap-2 border-t border-[#e5e5e5] py-3 sm:flex-row bg-[#f5f5f5]">
          <nav className="flex w-full justify-between px-4 md:px-6">
            <a
              href="https://www.solobizcards.com/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground underline-offset-4 no-underline hover:no-underline"
            >
              Terms
            </a>
            <a
              href="https://www.solobizcards.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground underline-offset-4 no-underline hover:no-underline"
            >
              Privacy
            </a>
            <a
              href="https://www.solobizcards.com/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground underline-offset-4 no-underline hover:no-underline"
            >
              Subscription
            </a>
            <a
              href="https://www.solobizcards.com/support"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground underline-offset-4 no-underline hover:no-underline"
            >
              Help
            </a>
            <a
              href="https://www.solobizcards.com/accessories"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground underline-offset-4 no-underline hover:no-underline"
            >
              Shop
            </a>
          </nav>
        </footer>
      </div>
    </FunnelFrame>
  );
}
