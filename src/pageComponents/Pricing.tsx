"use client";

import { useState, useEffect } from "react";
import {
  Check,
  Palette,
  Share2,
  Radio,
  Smartphone,
  QrCode,
  UserPlus,
  Globe,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"; // Make sure you have Dialog component
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  // For AlertDialog
  const [showAddonDialog, setShowAddonDialog] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  const [discount, setDiscount] = useState(0);
  const [freeTrialPeriod, setFreeTrialPeriod] = useState(0);
  const router = useRouter();
  const [proUpgradeMonthly, setProUpgradeMonthly] = useState(0);
  const [proUpgradeMonthlyEquivalent, setProUpgradeMonthlyEquivalent] =
    useState(0);

  const [addOneCardMonthlyEquivalent, setAddOneCardMonthlyEquivalent] =
    useState(0);
  const [addOneCardMonthly, setAddOneCardMonthly] = useState(0);

  const [addFiveCardsMonthlyEquivalent, setAddFiveCardsMonthlyEquivalent] =
    useState(0);
  const [addFiveCardsMonthly, setAddFiveCardsMonthly] = useState(0);

  const { user, isLoading: authLoading } = useAuth();
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // === NEW: Dialog state ===
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const pricingRequirementSettings = async () => {
      try {
        const userRef = doc(db, "settings", "PricingRequirement");
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;
        const userData = userSnap.data();

        setDiscount(userData.discount);
        setFreeTrialPeriod(userData.freeTrialPeriod);

        // if (user) {
        //   const userRef = doc(db, "users", user?.uid);
        //   const userSnap = await getDoc(userRef);
        //   if (!userSnap.exists()) throw new Error("User not found");
        //   const userData = userSnap.data() as any;
        //   if (userData) {
        //     const period = Number(userData.freeTrialPeriod);
        //     setFreeTrialPeriod(!isNaN(period) ? period : 0);
        //   } else {
        //     setFreeTrialPeriod(userData.freeTrialPeriod);
        //   }
        // } else {
        //   setFreeTrialPeriod(userData.freeTrialPeriod);
        // }

        setProUpgradeMonthlyEquivalent(userData.proUpgradeMonthlyEquivalent);
        setProUpgradeMonthly(userData.proUpgradeMonthly);

        setAddOneCardMonthlyEquivalent(
          userData.addOneCardMonthlyEquivalent.toFixed(2)
        );
        setAddOneCardMonthly(userData.addOneCardMonthly);

        setAddFiveCardsMonthlyEquivalent(
          userData.addFiveCardsMonthlyEquivalent.toFixed(2)
        );
        setAddFiveCardsMonthly(userData.addFiveCardsMonthly);
      } catch (err) {
        console.error("Error fetching referral settings:", err);
      }
    };

    async function fetchPlan() {
      const res = await fetch("/api/create-subscription", {
        method: "POST",
        body: JSON.stringify({ userId: user?.uid, action: "get" }),
      });
      const data = await res.json();
      setPlan(data);
    }

    if (user) {
      setIsLoading(true);
      pricingRequirementSettings();
      setIsLoading(false);
    } else {
      setIsLoading(true);
      pricingRequirementSettings();
      setIsLoading(false);
    }
  }, [user]);

  const plans = [
    {
      name: "Free",
      price: { monthly: 0, annual: 0 },
      description: "2-Free cards, perfect for getting started",
      features: [
        "Professional digital business card",
        "Basic contact sharing",
        "QR code generation",
        "Mobile responsive design",
        "Email support",
        "Basic analytics",
        "Basic branding & colors",
        "Social media integration",
        "Free QR code & card image download",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro Upgrade",
      price: {
        monthly: proUpgradeMonthly,
        annual: proUpgradeMonthlyEquivalent,
      },
      description: `2-Paid Pro cards, everything you need to \n grow. Everyone gets ${freeTrialPeriod}-days Free! Pro \n Trial`,
      features: [
        "Everything in free",
        "Custom CTA url link",
        "Custom about me form",
        "Custom ads uploads to cards",
        "Free marketplace posts",
        "Custom branding & colors",
        "Advanced analytics",
        "Lead capture forms",
        "Contact list export",
        "Priority support",
        "Unlimited sharing",
      ],
      cta: "Start Pro Upgrade Trial",
      popular: true,
    },
    {
      name: "Add 1 Pro Card",
      price: {
        monthly: addOneCardMonthly,
        annual: addOneCardMonthlyEquivalent,
      },
      description: "Additional professional card",
      features: [
        "All Pro features",
        "Additional team member",
        "Shared team analytics",
        "Bulk contact export",
      ],
      cta: "Add Card",
      popular: false,
    },
    {
      name: "Add 5 Pro Cards",
      price: {
        monthly: addFiveCardsMonthly,
        annual: addFiveCardsMonthlyEquivalent,
      },
      description: "Best for growing teams",
      features: [
        "All Pro features",
        "5 additional team members",
        "Advanced team analytics",
        "Bulk operations",
      ],
      cta: "Scale Team",
      popular: false,
    },
  ];

  const benefits = [
    {
      title: "You control the design",
      description:
        "A user-friendly editing panel is provided for personalizing and branding a digital business card.",
      icon: "Palette",
    },
    {
      title: "Unlimited sharing",
      description:
        "There is no limit to how many times a digital business card can be shared.",
      icon: "Share2",
    },
    {
      title: "Up to date",
      description:
        "Any changes made to a digital business card will be updated in real time to all shared links.",
      icon: "Radio",
    },
    {
      title: "Completely app free",
      description:
        "No app is required to create, send or to receive a digital business card.",
      icon: "Smartphone",
    },
    {
      title: "Quick scanning",
      description: "Receive a QR Code for scanning with a smartphone's camera.",
      icon: "QrCode",
    },
    {
      title: "Save to contacts",
      description: "Your information can be directly 'saved to contacts.'",
      icon: "UserPlus",
    },
    {
      title: "Dedicated link",
      description: "Receive a dedicated sharable link to your business card.",
      icon: "Globe",
    },
    {
      title: "Personal support",
      description: "We are always here to help you, whenever you need us.",
      icon: "Users",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose the best plan for your business
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Everyone gets{" "}
            <span className="text-primary font-semibold">
              {freeTrialPeriod}-days Free! Pro Trial
            </span>
            . Start free and upgrade as you grow.
          </p>
          {/* Money-back guarantee + icon in one line */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <p className="text-xl text-muted-foreground">
              30-day money back guarantee
            </p>
            <img
              src="/lovable-uploads/30-money back.png"
              alt="SoloBizCards Logo"
              className="h-14 w-14 object-contain"
            />
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span
              className={`text-sm ${
                !isAnnual ? "font-medium" : "text-muted-foreground"
              }`}
            >
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span
              className={`text-sm ${
                isAnnual ? "font-medium" : "text-muted-foreground"
              }`}
            >
              Annual
            </span>
            {isAnnual && (
              <Badge
                variant="secondary"
                className="ml-2 bg-green-100 text-green-800"
              >
                Save {discount}%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((planItem) => {
            const isProActive =
              user?.planName === "Pro Upgrade" &&
              user?.canceledAtPeriodEnd === false;

            let isDisabled = false;
            let tooltipText = "";

            if (isProActive && planItem.name === "Pro Upgrade") {
              isDisabled = true;
              tooltipText = "Pro Plan is already activated.";
            }

            return (
              <Card
                key={planItem.name}
                className={`relative hover:shadow-lg transition-shadow ${
                  planItem.popular ? "border-primary shadow-lg scale-105" : ""
                }`}
              >
                {planItem.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{planItem.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {planItem.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      $
                      {isAnnual
                        ? Number(planItem?.price?.annual).toFixed(2)
                        : Number(planItem?.price?.monthly).toFixed(2)}
                    </span>

                    <span className="text-muted-foreground">/month</span>
                    {planItem.price.monthly === 0 ? (
                      <div className="text-sm text-muted-foreground mt-1">
                        No credit card required
                        <div>No bill</div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm text-muted-foreground mt-1">
                          ($
                          {isAnnual
                            ? (planItem.price.annual * 12).toFixed(2)
                            : (planItem.price.monthly * 12).toFixed(2)}
                          /year)
                          {isAnnual && (
                            <span className="text-green-600 ml-1">
                              [Save $
                              {(
                                planItem.price.monthly * 12 -
                                planItem.price.annual * 12
                              ).toFixed(2)}
                              ]
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {isAnnual ? "Billed annually" : "Billed monthly"}
                        </div>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            className={`w-full mb-6 ${
                              planItem.popular
                                ? "bg-primary hover:bg-primary/90"
                                : "bg-primary hover:bg-primary/90"
                            }`}
                            onClick={() => {
                              if (!user) {
                                // window.open(
                                //   process.env.NEXT_PUBLIC_API_LIVE_URL,
                                //   "_blank",
                                //   "noopener,noreferrer"
                                // );
                                // return;
                                setShowLoginAlert(true);
                                return;
                              }
                              // === ONLY SHOW ALERT IF user does NOT have Pro and clicks an Add-on ===
                              const isAddon = planItem.name.startsWith("Add");
                              const userHasPro =
                                user?.planName === "Pro Upgrade";

                              if (isAddon && !userHasPro) {
                                setShowAddonDialog(true); // show alert dialog
                                return;
                              }

                              // Free plan handling
                              if (planItem.name === "Free" && !user) {
                                window.open(
                                  process.env.NEXT_PUBLIC_API_LIVE_URL,
                                  "_blank",
                                  "noopener,noreferrer"
                                );
                                return;
                              }

                              // Build checkout URL
                              const checkoutUrl = `/checkout?plan=${encodeURIComponent(
                                planItem.name
                              )}&price=${
                                isAnnual
                                  ? planItem.price.annual
                                  : planItem.price.monthly
                              }&billing=${isAnnual ? "annual" : "monthly"}`;

                              // Always open in a new tab/window
                              window.open(
                                checkoutUrl,
                                "_blank",
                                "noopener,noreferrer"
                              );
                            }}
                            // Disable only if Pro Upgrade or Free plan is already active
                            disabled={
                              (planItem.name === "Pro Upgrade" &&
                                isProActive) ||
                              (planItem.name === "Free" && !!user)
                            }
                          >
                            {planItem.cta}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {tooltipText && (
                        <TooltipContent>
                          <p>{tooltipText}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                  <ul className="space-y-3">
                    {planItem.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* === NEW: Dialog === */}
        {showAddonDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* === Background Overlay (dark + blur) === */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* === Modal Box === */}
            <div className="relative bg-white backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8 z-50 w-full max-w-md text-center transition-all duration-300">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-7 h-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Pro Plan Required
              </h2>

              {/* Message */}
              <p className="text-gray-700 mb-8 leading-relaxed">
                Activate the{" "}
                <span className="font-medium text-gray-900">Pro Plan</span>{" "}
                first before purchasing add-ons.
              </p>

              {/* Actions */}
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowAddonDialog(false)}
                  className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {showLoginAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* === Background Overlay (dark + blur) === */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* === Modal Box === */}
            <div className="relative bg-white backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8 z-50 w-full max-w-md text-center transition-all duration-300">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-7 h-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                2-Card Free Plan Required
              </h2>

              {/* Message */}
              <p className="text-gray-700 mb-8 leading-relaxed">
                Create a{" "}
                <span className="font-medium text-gray-900">Free Plan</span>{" "}
                first before purchasing or upgrading to the Pro Plan.
              </p>

              {/* Actions */}
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowLoginAlert(false)}
                  className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowLoginAlert(false);
                    setTimeout(() => router.replace("/?signIn=true"), 200);
                    // Optional: redirect or open sign-up page
                    // window.open(process.env.NEXT_PUBLIC_API_LIVE_URL, "_blank", "noopener,noreferrer");
                  }}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Why choose our digital business cards?
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Modern networking made simple and professional
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const IconComponent = {
                Palette,
                Share2,
                Radio,
                Smartphone,
                QrCode,
                UserPlus,
                Globe,
                Users,
              }[benefit.icon];

              return (
                <Card
                  key={index}
                  className="text-center p-6 bg-card hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-0">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-primary/5 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">
            Ready to make your business card earn income?
          </h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of professionals already using digital business cards
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90"
            onClick={() => (window.location.href = "/opportunities")}
          >
            Earnings Opportunities
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
