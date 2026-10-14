"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { auth } from "@/services/firebase";
import { completeSignupProfile } from "@/services/signupProfile";
import { readReferralCode } from "../referral";
import { useRedirectIfSignedIn } from "../useRedirectIfSignedIn";

const CATEGORIES = [
  "Accounting / Bookkeeping / Tax Services",
  "Agriculture / Farming",
  "Architecture / Landscaping / Lawn Care",
  "Arts / Music / Writing",
  "Automotive Sales / Repair / Detailing",
  "Beauty / Salon / Barber / Spa",
  "Cafe / Coffee Shop",
  "Construction / Contractor",
  "Consulting / Coaching",
  "Creative / Design / Media / Video Production",
  "E-commerce / Online Store / Software",
  "Education / Training / Online Courses",
  "Financial Services / Investing / Insurance",
  "Health & Wellness (gyms, trainers, nutrition)",
  "Home Services (plumbing, HVAC, cleaning, repairs)",
  "Hospitality / Hotel / Travel / Tourism",
  "Legal Services",
  "Marketing / Advertising",
  "Medical / Dental / Healthcare Practice",
  "Other / Miscellaneous Business Type",
  "Personal Services (photography, events, pet care, etc.)",
  "Real Estate",
  "Restaurant / Food Service",
  "Retail",
  "Technology / Software / IT Services",
  "Transportation / Logistics / Delivery",
];

const PREFERENCES = ["Local Clients", "Non-Local Clients", "Both"];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  /* Only bounces a FULLY set-up account. Someone who just created their
     login has a Firebase session but no profile yet, so they are left here to
     finish - which is the whole point of this screen. */
  useRedirectIfSignedIn();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPopup, setShowPopup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  /* Signup signed this user in a moment ago, but on a refresh currentUser is
     null until Firebase rehydrates - so wait for the first auth callback
     rather than reading auth.currentUser directly. */
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    category: "",
    preference: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setIsAuthResolved(true);
    });
    return () => unsubscribe();
  }, []);

  const email = authUser?.email || emailFromQuery || "your email";

  /** Writes the profile, credits the referrer, sends the verification email. */
  const handleFinish = async () => {
    if (isSaving) return;

    if (!authUser) {
      setSaveError(
        "Your session has expired. Please sign up again to continue.",
      );
      return;
    }

    setSaveError("");
    setIsSaving(true);

    try {
      await completeSignupProfile({
        user: authUser,
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        email: authUser.email || emailFromQuery,
        businessCategory: formData.category,
        clientsPreference: formData.preference,
        // Captured on /welcome when the ad landed, several screens ago.
        referralCode: readReferralCode(),
        // Carried over from the checkbox on the signup screen.
        wantsUpdates: searchParams.get("updates") !== "0",
        /* Come back into the funnel after verifying, not the dashboard. The
           origin has to be the one they are actually on - the link is minted
           here, so localhost in development and the deployed host in
           production, with no hard-coded domain to drift. */
        verifyContinueUrl: `${window.location.origin}/welcome/login`,
      });
      setShowPopup(true);
    } catch (error: any) {
      setSaveError(
        String(error?.message || "")
          .replace(/^Firebase:\s*/i, "")
          .trim() || "Could not save your profile. Please try again.",
      );
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (formData.firstName && formData.lastName) setStep(2);
    } else if (step === 2) {
      if (formData.category) setStep(3);
    } else if (formData.preference) {
      void handleFinish();
    }
  };

  const isStepIncomplete =
    step === 1
      ? !formData.firstName || !formData.lastName
      : step === 2
        ? !formData.category
        : !formData.preference;

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-12 items-center justify-center border-b bg-white px-4 lg:px-6">
        <Link
          href="/welcome"
          className="flex items-center justify-center gap-2"
        >
          <span className="font-headline text-base font-bold text-black dark:text-white">
            solo
          </span>
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center bg-accent px-4 pt-8">
        <div className="mb-8 w-full max-w-md">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={3}
          >
            <div
              className="h-full bg-black transition-all duration-500 ease-in-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-4 w-full max-w-md text-center">
          <h1 className="font-headline text-2xl font-bold text-slate-900 dark:text-white">
            {step === 1
              ? "Your Name"
              : step === 2
                ? "Your Business Category"
                : "Clients/Leads Preference"}
          </h1>
          {step === 2 && (
            <p className="mt-1 text-sm text-slate-500">
              Select the category that best describe your business.
            </p>
          )}
          {step === 3 && (
            <p className="mt-1 text-sm text-slate-500">Select Preference</p>
          )}
        </div>

        <Card
          className={cn(
            "w-full max-w-md rounded-2xl shadow-sm border border-slate-100 bg-white",
            (step === 2 || step === 3) &&
              "border-none bg-transparent shadow-none",
          )}
        >
          <CardContent
            className={cn(
              /* Step 1 is a real card with form fields in it, so it needs the
                 card's own gutter - px-0 ran the inputs flush into the white
                 edge with the labels hard against the corner. Steps 2 and 3
                 are a transparent chip grid where edge-to-edge is wanted, so
                 they keep px-0 and get the full width for the chips. */
              step === 1 ? "px-6 py-6" : "px-0 py-2 pt-3",
            )}
          >
            {step === 1 ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-base font-bold text-slate-900">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="first name"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className="h-12 text-base rounded-xl border border-slate-200 focus-visible:ring-black"
                  />
                </div>
                <div className="space-y-2 border-t pt-5">
                  <Label htmlFor="lastName" className="text-base font-bold text-slate-900">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="last name"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    className="h-12 text-base rounded-xl border border-slate-200 focus-visible:ring-black"
                  />
                </div>
              </div>
            ) : step === 2 ? (
              <div className="flex flex-wrap justify-center gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={formData.category === cat}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, category: cat }))
                    }
                    className={cn(
                      "rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200",
                      formData.category === cat
                        ? "border-black bg-black text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                {PREFERENCES.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    aria-pressed={formData.preference === pref}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, preference: pref }))
                    }
                    className={cn(
                      "rounded-full border px-6 py-2.5 text-xs font-semibold transition-all duration-200",
                      formData.preference === pref
                        ? "border-black bg-black text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50",
                    )}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {saveError && (
          <p
            role="alert"
            className="mt-6 w-full max-w-md rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
          >
            {saveError}
          </p>
        )}

        <div className="mt-auto w-full max-w-md pb-4 pt-4">
          <Button
            onClick={handleNext}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-semibold transition-all shadow-sm",
              isStepIncomplete
                ? "bg-neutral-400 text-white cursor-not-allowed hover:bg-neutral-400"
                : "bg-black text-white hover:bg-neutral-800",
            )}
            disabled={isStepIncomplete || isSaving || !isAuthResolved}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
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

      <Dialog open={showPopup} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-[400px] overflow-hidden rounded-xl border-none bg-white p-0 shadow-2xl [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Account created</DialogTitle>
          <div className="flex flex-col items-center space-y-5 p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 shadow-sm">
              <Mail className="h-8 w-8 stroke-[1.5px] text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Success!
              </h2>
              <div className="text-[14px] leading-relaxed text-slate-500">
                Your account was successfully created.
                <br />
                We&apos;ve sent confirmation instruction to
                <br />
                <span className="mt-0.5 block font-bold text-slate-900">
                  {email}
                </span>
              </div>
            </div>
            <div className="w-full rounded-lg border border-emerald-100 bg-[#f0fff9] p-4 text-[13px] font-medium leading-relaxed text-emerald-700">
              Please check your spam box too for the email. It may take a few
              minutes to arrive.
            </div>
            <div className="flex w-full justify-center pt-2">
              <button
                type="button"
                onClick={() => router.replace("/welcome/login")}
                className="group flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800"
              >
                Continue to Log In
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WelcomeOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-accent" />}>
      <OnboardingContent />
    </Suspense>
  );
}
