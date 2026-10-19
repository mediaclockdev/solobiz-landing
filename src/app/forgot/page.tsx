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
            <Link
              href="/login"
              aria-label="Back to login"
              className="absolute left-0 top-1/2 -translate-y-1/2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100/80 hover:bg-slate-50 transition-colors">
                <ArrowLeft className="h-4 w-4 text-slate-700" />
              </div>
            </Link>
            <h1 className="text-center text-[30px] font-bold tracking-tight text-[#0f172a] dark:text-white">
              Forgot Password
            </h1>
          </div>

          <div className="mb-7 w-full max-w-md text-center">
            <p className="text-[15px] font-normal text-slate-500">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <Card className="w-full max-w-md rounded-3xl shadow-sm border border-slate-100 bg-white">
            <CardContent className="p-7">
              {isSuccess ? (
                <div className="space-y-4 text-center py-2">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      Check your inbox
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      We sent a password reset link to{" "}
                      <span className="font-semibold text-slate-900">{email}</span>.
                      Please check your inbox and spam folder.
                    </p>
                  </div>
                  <Button
                    asChild
                    className="h-12 w-full rounded-2xl bg-[#212121] text-white hover:bg-neutral-800 font-semibold text-base mt-4 shadow-sm"
                  >
                    <Link href="/login">Back to Log In</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-900 block">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="h-12 text-sm rounded-xl border border-[#e5e5e5] !bg-white focus-visible:ring-black placeholder:text-slate-400 font-normal"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
                    >
                      {error}
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
                        Sending reset link...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>

                  <div className="pt-2 text-center">
                    <Link
                      href="/login"
                      className="text-xs font-medium text-slate-600 hover:text-black underline underline-offset-2"
                    >
                      Remember your password? Log in
                    </Link>
                  </div>
                </form>
              )}
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
