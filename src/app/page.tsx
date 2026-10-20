"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import FunnelFrame from "@/components/funnel/FunnelFrame";
import { storeReferralCode } from "@/lib/funnel/referral";
import { auth } from "@/services/firebase";
import { signOut } from "firebase/auth";

function WelcomeLanding() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* Park ?ref= if present, handle clean logout if ?logout=true, or forward verify link */
  useEffect(() => {
    storeReferralCode(searchParams.get("ref"));
    if (searchParams.get("logout") === "true") {
      void signOut(auth);
    }
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");
    if (mode === "verifyEmail" && oobCode) {
      router.replace(`/verify-email?${searchParams.toString()}`);
    }
  }, [searchParams, router]);

  return (
    <FunnelFrame>
      <div className="flex min-h-dvh flex-col overflow-hidden text-foreground">
        <div className="h-2 bg-background" />
        <header className="flex h-10 items-center px-4 lg:px-6">
          <Link
            href="/"
            className="mx-auto flex items-center justify-center gap-2"
          >
            <span className="font-headline text-base font-bold text-black dark:text-white">
              solo
            </span>
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-start pt-1 text-center">
          <div className="w-full px-4 md:px-6">
            <div className="mx-auto mb-1 w-3/4 overflow-hidden">
              <Image
                alt="Solo Biz Cards - networking for solo owners"
                src="/solo-landing.png"
                width={768}
                height={870}
                className="h-full w-full object-contain"
                priority
              />
            </div>

            <div className="space-y-2">
              <h1 className="font-headline text-2xl font-bold tracking-tight mt-4 text-slate-900 dark:text-white">
                Networking for Solo Owners
              </h1>
              <p className="text-sm text-muted-foreground">
                Log in or Sign Up to start networking
              </p>
            </div>

            <div className="flex w-full flex-col items-center gap-3">
              <div className="flex w-full flex-col gap-3 sm:items-center">
                <div className="h-4" />
                <Button
                  size="lg"
                  asChild
                  className="w-full h-12 rounded-full bg-black text-white hover:bg-neutral-800 font-semibold text-base shadow-sm"
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="w-full h-12 rounded-full border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 font-semibold text-base shadow-sm"
                >
                  <Link href="/login">Log In</Link>
                </Button>
                <a
                  href="https://dash.solobizcards.com/?ref=ROBQZM2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-4 inline-flex animate-pulse items-center justify-center w-full text-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-xs font-bold tracking-wide text-amber-900 shadow-sm transition-all duration-300 hover:animate-none hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
                >
                  ✨ Create Your Free Card First
                </a>
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-auto flex w-full shrink-0 flex-col items-center gap-2 border-t py-2 sm:flex-row">
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

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <WelcomeLanding />
    </Suspense>
  );
}
