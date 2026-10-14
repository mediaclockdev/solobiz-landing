"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { auth } from "@/services/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRedirectIfSignedIn } from "../useRedirectIfSignedIn";

export default function WelcomeSignupPage() {
  const router = useRouter();
  // A signed-in visitor has no business on a signup screen.
  useRedirectIfSignedIn();

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

  /**
   * Creates the auth account only. The Firestore user document, the referral
   * tree credit and the verification email all happen at the END of onboarding
   * (see /welcome/onboarding), because they need the name, category and
   * preference that onboarding collects.
   *
   * createUserWithEmailAndPassword signs the user in as a side effect, so the
   * next screen can read auth.currentUser.
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    /* Same as the login screen: Enter in the email field fires the form's
       submit, so on the email step this is "Continue", not "create the
       account". Without it, Enter jumped straight to the password-length
       complaint while the password field had not even been shown yet. */
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
      /* replace: the account exists now, so going back to this screen could
         only ever tell them the email is already taken. */
      router.replace(
        `/welcome/onboarding?email=${encodeURIComponent(email.trim())}` +
          `&updates=${wantsUpdates ? "1" : "0"}`,
      );
    } catch (error: any) {
      /* An email that already has an account is refused here, full stop.
         This used to redirect to onboarding when auth.currentUser had the same
         email, meant to rescue someone who abandoned onboarding half way. But
         being signed in is not the same as being half-registered: an existing,
         complete account matches that test too, so signing up again with your
         own email walked you into the wizard instead of telling you the account
         exists. Telling the truth is the useful behaviour; the half-finished
         case is rare and recovers by logging in. */
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
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-12 items-center justify-center border-b bg-white px-4 lg:px-6">
        <Link href="/welcome" className="flex items-center justify-center gap-2">
          <span className="font-headline text-base font-bold text-black dark:text-white">
            solo
          </span>
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center bg-accent px-4 pt-8">
        <div className="relative mb-4 w-full max-w-md">
          <Link
            href="/welcome"
            aria-label="Back to welcome"
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
            Sign Up
          </h1>
        </div>

        <div className="mb-8 w-full max-w-md text-center">
          <p className="text-lg text-muted-foreground">
            Create your account to start networking.
          </p>
        </div>

        <Card className="w-full max-w-md rounded-2xl shadow-sm border border-slate-100 bg-white">
          <CardContent className="pt-6 transition-all duration-300">
            <form onSubmit={handleSignUp} className="space-y-4">
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
                  /* -mx-3 px-3: this wrapper animates the password block in by
                     growing its max-height, which needs overflow-hidden - and
                     overflow-hidden clips BOTH axes. Its box was exactly the
                     width of the input inside it, so the focus ring (ring-2
                     plus ring-offset-2 = 4px outside the border) and the
                     browser's own focus outline were sliced off at the left and
                     right edges, which is why the password field looked cut
                     while the email field above it did not. The padding widens
                     the clip box and the negative margin puts the content back
                     where it was; there is no overflow-y-only in CSS. */
                className={cn(
                  "-mx-3 px-3 overflow-hidden transition-all duration-500 ease-in-out",
                  step === "email"
                    ? "max-h-0 opacity-0"
                    : "max-h-96 opacity-100",
                )}
              >
                {step === "password" && (
                  <>
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={isPasswordVisible ? "text" : "password"}
                          placeholder="password"
                          required
                          autoComplete="new-password"
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
                            isPasswordVisible ? "Hide password" : "Show password"
                          }
                        >
                          {isPasswordVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center space-x-2">
                      <Checkbox
                        id="updates"
                        checked={wantsUpdates}
                        onCheckedChange={(checked) =>
                          setWantsUpdates(checked === true)
                        }
                        className="data-[state=checked]:bg-black data-[state=checked]:border-black"
                      />
                      <label
                        htmlFor="updates"
                        className="text-sm font-medium leading-none text-muted-foreground"
                      >
                        Yes, send me the latest updates and news
                      </label>
                    </div>

                    {formError && (
                      <div
                        role="alert"
                        className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                      >
                        {formError}
                        {/* The one error with an obvious next step, so give
                            them the step rather than just the diagnosis. */}
                        {formError.includes("already has an account") && (
                          <Link
                            href="/welcome/login"
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
                      className="mt-4 h-12 w-full rounded-full bg-black text-white hover:bg-neutral-800 font-semibold text-base shadow-sm"
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
                  </>
                )}
              </div>

              {step === "email" && (
                <Button
                  type="button"
                  onClick={handleContinue}
                  className="w-full h-12 rounded-full bg-black text-white hover:bg-neutral-800 font-semibold text-base shadow-sm"
                >
                  Continue
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <div
          className={cn(
            "mt-auto w-full max-w-md pb-8 text-center text-sm text-muted-foreground transition-all duration-500 ease-in-out",
            step === "email"
              ? "-translate-y-10 opacity-0"
              : "translate-y-0 opacity-100",
          )}
        >
          {step === "password" && (
            <p>
              By clicking &quot;Sign Up&quot; you agree with our{" "}
              <a
                href="https://www.solobizcards.com/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline text-slate-900 hover:text-black"
              >
                Terms
              </a>{" "}
              &amp;{" "}
              <a
                href="https://www.solobizcards.com/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline text-slate-900 hover:text-black"
              >
                Privacy
              </a>
            </p>
          )}
        </div>
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
          <Link
            href="/pricing"
            className="text-[11px] text-muted-foreground underline-offset-4 no-underline hover:no-underline"
          >
            Subscription
          </Link>
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
  );
}
