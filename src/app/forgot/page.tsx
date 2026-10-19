"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import FunnelFrame from "@/components/funnel/FunnelFrame";
import { auth, db } from "@/services/firebase";
import {
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
} from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim();
      const methods = await fetchSignInMethodsForEmail(auth, trimmedEmail);

      if (methods.length === 0) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", trimmedEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("No account found with this email address.");
          setIsSubmitting(false);
          return;
        }

        const currentUserDoc = querySnapshot.docs[0];
        const currentUser = currentUserDoc.data();
        if (!currentUser?.isVerify) {
          setError("Please verify your email address before resetting your password.");
          setIsSubmitting(false);
          return;
        }
      }

      await sendPasswordResetEmail(auth, trimmedEmail);
      setIsSuccess(true);
    } catch (err: any) {
      setError(
        err?.message?.replace(/^Firebase:\s*/i, "") ||
          "Could not send reset email. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
              href="/login"
              aria-label="Back to login"
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
              Forgot Password
            </h1>
          </div>

          <div className="mb-8 w-full max-w-md text-center">
            <p className="text-muted-foreground">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <div className="flex h-full w-full max-w-md flex-col">
            <Card className="w-full rounded-2xl shadow-sm border border-slate-100 bg-white">
              <CardContent className="pt-6 transition-all duration-300">
                {isSuccess ? (
                  <div className="space-y-4 text-center py-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="font-headline text-xl font-bold text-slate-900">
                        Check your inbox
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        We sent a password reset link to{" "}
                        <span className="font-semibold text-slate-900">{email}</span>.
                        Please check your inbox and spam folder.
                      </p>
                    </div>
                    <Button
                      asChild
                      className="w-full h-12 rounded-full bg-black text-white hover:bg-neutral-800 font-semibold text-base shadow-sm mt-4"
                    >
                      <Link href="/login">Back to Log In</Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    {error && (
                      <p
                        role="alert"
                        className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                      >
                        {error}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-full bg-black text-white hover:bg-neutral-800 font-semibold text-base shadow-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending reset link...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>

                    <div className="pt-2 text-center">
                      <Link
                        href="/login"
                        className="text-sm font-medium text-slate-600 hover:text-black hover:underline"
                      >
                        Remember your password? Log in
                      </Link>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
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
