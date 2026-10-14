"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { loadStripe } from "@stripe/stripe-js";
import { onAuthStateChanged } from "firebase/auth";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/services/firebase";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { FaStripe, FaPaypal } from "react-icons/fa";
import { Balance } from "@mui/icons-material";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

const CheckoutForm = ({ plan, price, billing, userId, setIsLoading }: any) => {
  const { showToast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({
    email: "",
    fullName: "",
    country: "India",
    address: "",
    agreeTerms: false,
  });

  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">(
    "stripe"
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    const checked = (target as HTMLInputElement).checked;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handlePaymentMethodChange = (method: "stripe" | "paypal") => {
    setPaymentMethod(method);
  };

  const savePurchaseHistory = async (paymentResult: any) => {
    try {
      await addDoc(collection(db, "purchases"), {
        userId,
        plan,
        type: plan === "Pro Upgrade" ? "Pro Upgrade" : "addon",
        price: parseFloat(price),
        billing,
        paymentMethod: "stripe",
        paymentIntentId: paymentResult.paymentIntent.id,
        status: "succeeded",
        timestamp: serverTimestamp(),

        // lineage data for easy fetch later
        referredBy: user?.referredBy || null,
        parentUid: user?.parentUid || null,
        grandParentUid: user?.grandParentUid || null,

        // for dashboard recent activity
        userName: form.fullName,
        userEmail: form.email,
      });

      console.log("Purchase history saved!", paymentResult);
    } catch (err) {
      console.error("Failed to save purchase history:", err);
    }
  };

  const handleReferralsEarning = async () => {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const referralCode = userData?.referredBy;
      let parentUid: string | null = null;
      let grandParentUid: string | null = null;

      if (referralCode) {
        const refeQuery = query(
          collection(db, "referrals"),
          where("referralCode", "==", referralCode)
        );
        const refeSnap = await getDocs(refeQuery);

        if (!refeSnap.empty) {
          const parentRefDoc = refeSnap.docs[0];
          const parentRefData = parentRefDoc.data();
          parentUid = parentRefData.uid;
          let startDate = new Date();

          let childEarnings = 0;
          let grandchildEarnings = 0;
          let operatingCostRate = 0;
          let addonsPlans = {};
          addonsPlans[plan] = Number(price);
          const settingsRef = doc(db, "users", parentUid);

          const pricingRequirement = doc(db, "settings", "PricingRequirement");
          const snapPricingRequirement = await getDoc(pricingRequirement);
          if (snapPricingRequirement.exists()) {
            operatingCostRate =
              snapPricingRequirement.data().proUpgradeYearlyWithDiscount;
          }

          const snap1 = await getDoc(settingsRef);

          if (snap1.exists()) {
            childEarnings = snap1.data().userChildEarning;
            grandchildEarnings = snap1.data().userGrandChildEarning;
            addonsPlans[plan] = Number(price);
          }

          console.log("addonsPlans", addonsPlans);
          let childBalanceEarnings = parentRefData.childBalanceEarnings || {};
          let balanceEarnings = parentRefData.balanceEarnings || {};
          let earningsCost = parentRefData.earningsCost || {};

          const earningAmount =
            (Number(addonsPlans[plan]) * Number(childEarnings)) / 100;

          // Create a clean object to avoid prototype pollution or undefined keys
          // childBalanceEarnings = {
          //   ...childBalanceEarnings,
          //   [user.uid]: (childBalanceEarnings[user.uid] || 0) + earningAmount,
          // };
          childBalanceEarnings = {
            ...childBalanceEarnings,
            [user.uid]: {
              ...(childBalanceEarnings[user.uid] || {}),

              [plan]:
                (childBalanceEarnings[user.uid]?.[plan] || 0) + earningAmount,
            },
          };

          // balanceEarnings = {
          //   ...balanceEarnings,
          //   [user.uid]: (balanceEarnings[user.uid] || 0) + earningAmount,
          // };
          balanceEarnings = {
            ...balanceEarnings,
            [user.uid]: {
              ...(balanceEarnings[user.uid] || {}),
              [plan]: (balanceEarnings[user.uid]?.[plan] || 0) + earningAmount,
            },
          };

          earningsCost = {
            ...earningsCost,
            [user.uid]: childEarnings,
          };
          await updateDoc(parentRefDoc.ref, {
            balanceEarnings,
          });

          if (parentRefData.parentUid) {
            grandParentUid = parentRefData.parentUid;
            const gpRef = doc(db, "referrals", grandParentUid);
            const gpSnap = await getDoc(gpRef);

            if (gpSnap.exists()) {
              const gpData = gpSnap.data();
              let balanceEarnings = gpData.balanceEarnings || {};

              let earningsCost = gpData.earningsCost || {};

              let parentBalanceEarnings = gpData.parentBalanceEarnings || {};

              const earningAmount =
                (Number(addonsPlans[plan]) * Number(grandchildEarnings)) / 100;

              // Create a clean object to avoid prototype pollution or undefined keys
              // parentBalanceEarnings = {
              //   ...parentBalanceEarnings,
              //   [user.uid]:
              //     (childBalanceEarnings[user.uid] || 0) + earningAmount,
              // };

              parentBalanceEarnings = {
                ...parentBalanceEarnings,
                [user.uid]: {
                  ...(childBalanceEarnings[user.uid] || {}),

                  [plan]:
                    (childBalanceEarnings[user.uid]?.[plan] || 0) +
                    earningAmount,
                },
              };

              // balanceEarnings = {
              //   ...balanceEarnings,
              //   [user.uid]: (balanceEarnings[user.uid] || 0) + earningAmount,
              // };

              balanceEarnings = {
                ...balanceEarnings,
                [user.uid]: {
                  ...(balanceEarnings[user.uid] || {}),
                  [plan]:
                    (balanceEarnings[user.uid]?.[plan] || 0) + earningAmount,
                },
              };

              earningsCost = {
                ...earningsCost,
                [user.uid]: grandchildEarnings,
              };

              await updateDoc(gpRef, {
                balanceEarnings,
              });
            }
          }
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;
    if (!userId) {
      showToast("User not logged in", "error");
      return;
    }

    setLoading(true);

    try {
      /* -------------------------------
       * STEP 1: Create SetupIntent
       * ------------------------------- */
      const setupRes = await fetch("/api/create-setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const { setupClientSecret } = await setupRes.json();
      if (!setupClientSecret) throw new Error("Failed to create SetupIntent");

      /* -------------------------------
       * STEP 2: Confirm SetupIntent
       * ------------------------------- */
      const setupResult = await stripe.confirmCardSetup(setupClientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: form.fullName,
            email: form.email,
            address: { line1: form.address },
          },
        },
      });

      if (setupResult.error) throw new Error(setupResult.error.message);

      const paymentMethodId = setupResult.setupIntent?.payment_method as string;

      if (!paymentMethodId) {
        throw new Error("Payment method not created");
      }

      /* -------------------------------
       * STEP 3: Create Subscription
       * ------------------------------- */
      const subRes = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          plan,
          price: parseFloat(price),
          billing,
          action: "create",
          paymentMethodId, // 🔑 REQUIRED
        }),
      });

      const data = await subRes.json();
      if (!subRes.ok) throw new Error(data.error || "Subscription failed");

      /* -------------------------------
       * STEP 4: Confirm PaymentIntent (NO CARD ELEMENT)
       * ------------------------------- */
      // STEP 4: Handle payment if required
      if (data.clientSecret) {
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret
        );

        if (error) throw new Error(error.message);

        if (paymentIntent?.status === "succeeded") {
          console.log("paymentIntent", paymentIntent);
          showToast("Subscription activated successfully!", "success");
          router.push("/dashboard/settings?tab=subscriptions");
        }
      } else if (data.status === "active") {
        // 🔑 Auto-confirmed by Stripe
        showToast("Subscription activated successfully!", "success");
        router.push("/dashboard/settings?tab=subscriptions");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Payment failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!form.agreeTerms) {
  //     showToast("Please agree to the Terms and Conditions!", "error");
  //     return;
  //   }

  //   if (!userId) {
  //     showToast("User not logged in", "error");
  //     return;
  //   }

  //   if (paymentMethod === "stripe") {
  //     if (!stripe || !elements) return;
  //     setLoading(true);

  //     try {
  //       const res = await fetch("/api/create-subscription", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           userId,
  //           plan,
  //           price: parseFloat(price),
  //           billing,
  //           action: "create",
  //         }),
  //       });

  //       const { clientSecret, error, startDate } = await res.json();
  //       if (error) throw new Error(error);
  //       if (!clientSecret) throw new Error("Failed to get client secret");

  //       const cardElement = elements.getElement(CardElement);
  //       if (!cardElement) return;

  //       const paymentResult = await stripe.confirmCardPayment(clientSecret, {
  //         payment_method: {
  //           card: cardElement,
  //           billing_details: {
  //             name: form.fullName,
  //             email: form.email,
  //             address: { line1: form.address },
  //           },
  //         },
  //       });
  //       let firstPaidInitial = new Date();

  //       if (paymentResult.error) {
  //         showToast(paymentResult.error.message || "Payment failed", "error");
  //         return;
  //       }

  //       if (paymentResult.paymentIntent?.status === "succeeded") {
  //         await savePurchaseHistory(paymentResult);
  //         //       const userchildRef = doc(db, "users", userId);
  //         // const userchildSnap = await getDoc(userchildRef);
  //         // if (userchildSnap.exists()) {
  //         //   const userchildData = userchildSnap.data();

  //         // }
  //         handleReferralsEarning();
  //         setIsLoading(false);
  //         showToast("Subscription activated successfully!", "success");
  //         router.push("/dashboard");
  //       }
  //     } catch (err: any) {
  //       console.error(err);
  //       showToast(err.message || "Subscription failed", "error");
  //     } finally {
  //       setLoading(false);
  //     }
  //   } else {
  //     showToast("PayPal payment will be implemented later.", "info");
  //   }
  // };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg w-full lg:w-2/2 border border-gray-100">
      {/* Heading */}

      <Button
        variant="outline"
        className="mb-6 hover:bg-gray-100 transition"
        onClick={() => router.push("/pricing")}
      >
        &larr; Back
      </Button>

      <h1 className="text-3xl font-extrabold mb-2 text-gray-900">Checkout</h1>
      <p className="text-gray-500 mb-8">Complete your subscription below.</p>

      {/* Payment method */}
      <div className="mb-8">
        <p className="font-semibold mb-3 text-gray-800">
          Select Payment Method
        </p>
        <div className="flex gap-4">
          {/* Stripe */}
          <label
            className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${
              paymentMethod === "stripe"
                ? "border-indigo-600 bg-indigo-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="stripe"
              checked={paymentMethod === "stripe"}
              onChange={() => handlePaymentMethodChange("stripe")}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <FaStripe className="text-indigo-600 text-2xl" />
              <div>
                <p className="font-semibold text-gray-800">Stripe</p>
                <p className="text-gray-500 text-sm">Pay with card</p>
              </div>
            </div>
          </label>

          {/* PayPal */}
          {/* <label
            className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${
              paymentMethod === "paypal"
                ? "border-indigo-600 bg-indigo-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="paypal"
              checked={paymentMethod === "paypal"}
              onChange={() => handlePaymentMethodChange("paypal")}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <FaPaypal className="text-blue-600 text-2xl" />
              <div>
                <p className="font-semibold text-gray-800">PayPal</p>
                <p className="text-gray-500 text-sm">Coming Soon</p>
              </div>
            </div>
          </label> */}
        </div>
      </div>

      {/* Form */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            className="block text-gray-700 mb-1 font-medium"
            htmlFor="email"
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 p-4 rounded-lg bg-gray-50"
          />
        </div>

        <div>
          <label
            className="block text-gray-700 mb-1 font-medium"
            htmlFor="fullName"
          >
            Full Name
          </label>
          <input
            type="text"
            name="fullName"
            placeholder="John Doe"
            value={form.fullName}
            onChange={handleChange}
            required
            className="w-full border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 p-4 rounded-lg bg-gray-50"
          />
        </div>

        {paymentMethod === "stripe" && (
          <div>
            <label className="block text-gray-700 mb-1 font-medium">
              Card Details
            </label>
            <div className="border border-gray-300 p-4 rounded-lg bg-gray-50">
              <CardElement options={{ hidePostalCode: true }} />
            </div>
          </div>
        )}

        {/* Terms */}
        <label className="flex items-center gap-2 mt-4 text-gray-700">
          <input
            type="checkbox"
            name="agreeTerms"
            checked={form.agreeTerms}
            onChange={handleChange}
            required
            className="accent-indigo-600"
          />
          I agree to the{" "}
          <a href="/terms" className="text-indigo-600 font-medium underline">
            Terms and Conditions
          </a>
        </label>

        {/* Button */}
        <Button
          type="submit"
          className="w-full h-12 rounded-xl text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-md"
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : `Pay $${price} with ${
                paymentMethod === "stripe" ? "Stripe" : "PayPal"
              }`}
        </Button>
      </form>
    </div>
  );
};

const CheckoutPage = () => {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "Pro Upgrade";
  const price = searchParams.get("price") || "72.00";
  const billing = searchParams.get("billing") || "annual";
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await getDoc(doc(db, "users", user.uid));
        setUserId(user.uid);
      } else {
        setUserId(null);
        setTimeout(() => router.replace("/"), 1000);
      }
    });
    return () => unsubscribe();
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const calculatedPrice =
    billing === "annual" ? (parseFloat(price) * 12).toFixed(2) : price;
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-10 px-4">
        <div className="max-w-6xl w-full bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          {/* LEFT SIDE = BRAND + ORDER */}
          <div className="bg-indigo-600 text-white p-10 flex flex-col justify-between">
            {/* BRAND */}
            <div>
              <img
                src="/lovable-uploads/solo-logo-icon.png"
                alt="SoloBizCards Logo"
                className="mb-8 w-11 h-11 sm:w-14 sm:h-14 object-contain rounded-lg"
              />
              {/* <img src="/logo.png" alt="Brand Logo" className="h-14 mb-8" /> */}

              <h2 className="text-3xl font-extrabold mb-2">
                Upgrade Your Plan
              </h2>
              <p className="text-indigo-100 mb-3">
                Unlock premium features & improve productivity.
              </p>
              {/* Money-back guarantee + icon in one line */}
              <div className="flex items-center gap-2 mb-10">
                <p className="text-xl">30-day money back guarantee</p>
                <img
                  src="/lovable-uploads/30-money back.png"
                  alt="SoloBizCards Logo"
                  className="h-14 w-14 object-contain"
                />
              </div>

              {/* Order Summary */}
              <div className="bg-indigo-500/40 backdrop-blur-sm p-6 rounded-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xl font-semibold">{plan}</p>
                    <p className="text-sm opacity-80">
                      {billing === "annual"
                        ? "Yearly Billing"
                        : "Monthly Billing"}
                    </p>
                  </div>
                  <p className="text-3xl font-bold">${calculatedPrice}</p>
                </div>

                <div className="border-t border-indigo-300/40 pt-4 text-sm opacity-90">
                  Access to all premium features • Priority support • Faster
                  performance
                </div>
              </div>
            </div>

            {/* Footer */}
            <p className="text-xs mt-10 opacity-70">
              Secure Payment • Stripe Encrypted • 100% Safe
            </p>
          </div>

          {/* RIGHT SIDE = PAYMENT FORM */}
          <div className="p-10 bg-white">
            <CheckoutForm
              plan={plan}
              price={calculatedPrice}
              billing={billing}
              userId={userId}
              setIsLoading={setIsLoading}
            />
          </div>
        </div>
      </div>
    </Elements>
  );

  // return (
  //   <Elements stripe={stripePromise}>
  //     <div className="min-h-screen bg-gray-50 py-12 px-4">
  //       <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
  //         {/* Checkout form */}
  //         <CheckoutForm
  //           plan={plan}
  //           price={calculatedPrice}
  //           billing={billing}
  //           userId={userId}
  //           setIsLoading={setIsLoading}
  //         />

  //         {/* Order Summary */}
  //         <div className="w-full lg:w-1/3 bg-white rounded-2xl p-8 shadow-lg border border-gray-100 sticky top-24 self-start">
  //           <h2 className="text-2xl font-bold mb-6 text-gray-900">
  //             Order Summary
  //           </h2>
  //           <div className="space-y-6">
  //             <div className="flex justify-between items-center">
  //               <div>
  //                 <p className="font-semibold text-gray-900 text-lg">{plan}</p>
  //                 <p className="text-gray-500">
  //                   {billing === "annual"
  //                     ? "Yearly Billing"
  //                     : "Monthly Billing"}
  //                 </p>
  //               </div>
  //               <p className="font-semibold text-indigo-600 text-lg">
  //                 ${calculatedPrice}
  //               </p>
  //             </div>

  //             <div className="border-t pt-4 space-y-2">
  //               <div className="flex justify-between text-gray-700">
  //                 <span className="text-lg">Subtotal</span>
  //                 <span className="text-lg">${calculatedPrice}</span>
  //               </div>
  //               <div className="flex justify-between font-bold text-2xl text-gray-900">
  //                 <span>Order Total</span>
  //                 <span>${calculatedPrice}</span>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </Elements>
  // );
};

export default CheckoutPage;
