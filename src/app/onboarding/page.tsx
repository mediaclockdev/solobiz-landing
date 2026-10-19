"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { auth } from "@/services/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { completeSignupProfile } from "@/services/signupProfile";
import FunnelFrame from "@/components/funnel/FunnelFrame";
import { readReferralCode } from "@/lib/funnel/referral";
import { useRedirectIfSignedIn } from "@/lib/funnel/useRedirectIfSignedIn";

const BUSINESS_CATEGORIES = [
  "Retail",
  "Technology",
  "Healthcare",
  "Education",
  "Real Estate",
  "Professional Services",
  "Creative & Design",
  "Food & Beverage",
  "Finance & Insurance",
  "Other",
];

const PREFERENCES = [
  { value: "local", label: "Local Clients" },
  { value: "state", label: "State-wide Clients" },
  { value: "national", label: "National Clients" },
  { value: "global", label: "Global Clients" },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  // Bounces a converted account away.
  useRedirectIfSignedIn();

  const [authUser, setAuthUser] = useState<User | null>(() => auth.currentUser);
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setAuthUser(u));
  }, []);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    category: "",
    preference: "",
  });
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const email = authUser?.email || emailFromQuery;

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
        referralCode: readReferralCode(),
        wantsUpdates: searchParams.get("updates") !== "0",
        verifyContinueUrl: `${window.location.origin}/login`,
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
    <FunnelFrame>
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <header className="flex h-12 items-center justify-center border-b bg-white px-4 lg:px-6">
          <Link
            href="/"
            className="flex items-center justify-center gap-2"
          >
            <span className="font-headline text-base font-bold text-black dark:text-white">
              solo
            </span>
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center bg-accent px-4 pt-8">
          <div className="mb-8 w-full max-w-md">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (step > 1) setStep((s) => (s - 1) as 1 | 2);
                  else router.push("/signup");
                }}
                className="rounded-full bg-background hover:bg-background/80"
              >
                <ArrowLeft className="h-8 w-8" />
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                Step {step} of 3
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <div
                className={cn(
                  "h-2 flex-1 rounded-full bg-primary transition-all",
                  step >= 1 ? "bg-primary" : "bg-muted",
                )}
              />
              <div
                className={cn(
                  "h-2 flex-1 rounded-full transition-all",
                  step >= 2 ? "bg-primary" : "bg-muted",
                )}
              />
              <div
                className={cn(
                  "h-2 flex-1 rounded-full transition-all",
                  step >= 3 ? "bg-primary" : "bg-muted",
                )}
              />
            </div>
          </div>

          <div className="mb-8 w-full max-w-md text-center">
            <h1 className="font-headline text-3xl font-bold text-slate-900 dark:text-white">
              {step === 1 && "What's your name?"}
              {step === 2 && "Choose your category"}
              {step === 3 && "Who are your clients?"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === 1 && "This will appear on your Solo profile"}
              {step === 2 && "Select the category that best fits your business"}
              {step === 3 && "Tell us about your target audience"}
            </p>
          </div>

          <Card className="w-full max-w-md rounded-2xl shadow-sm border border-slate-100 bg-white">
            <CardContent className="pt-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="Jane"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((d) => ({
                          ...d,
                          firstName: e.target.value,
                        }))
                      }
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Smith"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((d) => ({
                          ...d,
                          lastName: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() =>
                        setIsCategoryDropdownOpen((v) => !v)
                      }
                    >
                      <span>
                        {formData.category || "Select a category"}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                    {isCategoryDropdownOpen && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                        {BUSINESS_CATEGORIES.map((cat) => (
                          <button
                            type="button"
                            key={cat}
                            className={cn(
                              "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                              formData.category === cat && "bg-accent",
                            )}
                            onClick={() => {
                              setFormData((d) => ({
                                ...d,
                                category: cat,
                              }));
                              setIsCategoryDropdownOpen(false);
                            }}
                          >
                            <span>{cat}</span>
                            {formData.category === cat && (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  {PREFERENCES.map((pref) => (
                    <button
                      type="button"
                      key={pref.value}
                      onClick={() =>
                        setFormData((d) => ({
                          ...d,
                          preference: pref.value,
                        }))
                      }
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all",
                        formData.preference === pref.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-slate-200 hover:border-slate-300",
                      )}
                    >
                      <span className="font-medium text-slate-900">
                        {pref.label}
                      </span>
                      {formData.preference === pref.value && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {saveError && (
                <p
                  role="alert"
                  className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {saveError}
                </p>
              )}

              <Button
                type="button"
                onClick={handleNext}
                disabled={isStepIncomplete || isSaving}
                className="mt-6 h-12 w-full rounded-full bg-black text-white hover:bg-neutral-800 font-semibold text-base shadow-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Completing registration...
                  </>
                ) : step === 3 ? (
                  "Finish"
                ) : (
                  "Continue"
                )}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="max-w-[400px] rounded-3xl p-6">
          <DialogTitle className="sr-only">Account Created</DialogTitle>
          <div className="flex flex-col items-center text-center space-y-4">
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
                onClick={() => router.replace("/login")}
                className="group flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800"
              >
                Continue to Log In
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </FunnelFrame>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-accent" />}>
      <OnboardingContent />
    </Suspense>
  );
}
