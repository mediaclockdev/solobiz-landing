"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import FunnelFrame from "@/components/funnel/FunnelFrame";
import { auth } from "@/services/firebase";
import {
  POST_AUTH_DESTINATION,
  useRedirectIfSignedIn,
} from "@/lib/funnel/useRedirectIfSignedIn";
import {
  redirectToMainAppSSO,
  handleLoginSuccess,
} from "@/lib/funnel/ssoRedirect";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Already signed in? Redirect to destination.
  useRedirectIfSignedIn();

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

    setFormError(
      result.error?.replace(/^Firebase:\s*/i, "") ||
        "Could not sign you in. Please try again.",
    );
    setIsSubmitting(false);
  };

  return (
    <FunnelFrame>
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <header className="flex h-12 items-center justify-center border-b bg-white px-4 lg:px-6">
          <Link href="/" className="flex items-center justify-center gap-2">
            <span className="font-headline text-base font-bold text-black dark:text-white">
              solo
            </span>
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center bg-accent px-4 pt-8">
          <div className="relative mb-8 w-full max-w-md">
            <Link
              href="/"
              aria-label="Back to home"
              className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-background hover:bg-background/80"
              >
                <ArrowLeft className="h-8 w-8" />
              </Button>
            </Link>
            <h1 className="text-center font-headline text-3xl font-bold text-slate-900 dark:text-white">
              Log In
            </h1>
          </div>

          <div className="mb-8 w-full max-w-md text-center">
            <p className="text-muted-foreground">
              Login to your account to start networking.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="flex h-full w-full max-w-md flex-col"
          >
            <Card className="w-full rounded-2xl shadow-sm border border-slate-100 bg-white">
              <CardContent className="pt-6 transition-all duration-300">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={step === "password"}
                        className={cn(step === "password" && "pr-10")}
                      />
                      {step === "password" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Change email"
                          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                          onClick={handleEmailEdit}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                    {emailError && (
                      <p className="text-sm text-destructive">{emailError}</p>
                    )}
                  </div>

                  <div
                    className={cn(
                      "-mx-3 px-3 overflow-hidden transition-all duration-500 ease-in-out",
                      step === "email"
                        ? "max-h-0 opacity-0"
                        : "max-h-48 opacity-100",
                    )}
                  >
                    {step === "password" && (
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={isPasswordVisible ? "text" : "password"}
                            placeholder="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 z-10 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                          </Button>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <Link
                            href="/signup"
                            className="text-sm font-medium text-slate-800 hover:text-black hover:underline"
                          >
                            Sign Up
                          </Link>
                          <Link
                            href="/forgot"
                            className="text-sm font-medium text-slate-800 hover:text-black hover:underline"
                          >
                            Forgot Password? &rarr;
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {formError && (
                    <p
                      role="alert"
                      className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    >
                      {formError}
                    </p>
                  )}

                  {step === "email" && (
                    <Button
                      type="button"
                      onClick={handleContinue}
                      className="w-full h-12 rounded-full bg-black text-white hover:bg-neutral-800 font-semibold text-base shadow-sm"
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div
              className={cn(
                "mt-auto flex w-full flex-col items-center gap-4 pb-8 pt-8 transition-all duration-500 ease-in-out",
                step === "email"
                  ? "-translate-y-10 opacity-0"
                  : "translate-y-0 opacity-100",
              )}
            >
              {step === "password" && (
                <>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-full bg-black text-white hover:bg-neutral-800 font-semibold text-base shadow-sm"
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
                  <p className="text-xs text-muted-foreground">
                    SoloBizCards:{" "}
                    <a
                      href="https://solobizcards.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-slate-900 hover:underline"
                    >
                      Learn more &gt;&gt;
                    </a>
                  </p>
                </>
              )}
            </div>
          </form>
        </main>

        <footer className="mt-auto flex w-full shrink-0 flex-col items-center gap-2 border-t py-3 sm:flex-row bg-white">
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
