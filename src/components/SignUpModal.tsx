"use client";
import ReCAPTCHA from "react-google-recaptcha";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/contexts/ToastContext";
import { applyBodyScrollLock } from "@/utils/scrollLock";
import { X, Eye, EyeOff, Check, X as Cross } from "lucide-react";
import { auth } from "@/services/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { query } from "firebase/firestore";
import { Mail } from "lucide-react";
import { completeSignupProfile } from "@/services/signupProfile";

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowSignIn: () => void;
  onSubmit?: (useremail: string) => void;
}

export default function SignUpModal({
  isOpen,
  onClose,
  onShowSignIn,
  onSubmit,
}: SignUpModalProps) {
  const [name, setName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [clientsPreference, setClientsPreference] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [confirmEmailModal, setConfirmEmailModal] = useState<boolean>(false);
  const { showToast } = useToast();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const recaptchaRef = useRef(null);
  const [captchaToken, setCaptchaToken] = useState(null);

  // Stop the page behind the modal scrolling while it is open. Uses the shared
  // ref-counted lock so overlapping overlays cannot unlock each other.
  useEffect(() => applyBodyScrollLock(isOpen), [isOpen]);

  // Capture referral code from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref");
      setReferralCode(ref ? ref : "ROBPTF2");
    }
  }, []);

  const passwordChecks = {
    length: password.length >= 8,
    maxLength: password.length <= 15,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const passedRules = Object.values(passwordChecks).filter(Boolean).length;
  const progress = (passedRules / 5) * 100;
  const progressColor =
    passedRules <= 2
      ? "bg-red-500"
      : passedRules === 3
        ? "bg-yellow-500"
        : passedRules === 4
          ? "bg-blue-500"
          : "bg-green-600";

  const clearForm = () => {
    setName("");
    setBusinessCategory("");
    setClientsPreference("");
    setConfirmEmail(email);
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };

  // Get browser location (with permission popup)

  // useEffect(() => {
  //   const getLocation = async () => {
  //     const browserLocation = await getBrowserLocation();

  //     if (!browserLocation) {
  //       console.log("Location not available or denied.");
  //       navigator.permissions.query({ name: "geolocation" }).then((result) => {
  //         console.log("Chrome permission state:", result.state);
  //         console.log("browserLocation", browserLocation);
  //       });
  //     } else {
  //       console.log("browserLocation", browserLocation);
  //       navigator.permissions.query({ name: "geolocation" }).then((result) => {
  //         console.log("Chrome permission state:", result.state);
  //       });
  //     }
  //   };

  //   getLocation();
  // }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name) return showToast("Display name is required.", "error");
    if (!businessCategory)
      return showToast("Please select a business category.", "error");
    if (!clientsPreference)
      return showToast("Please select a Clients Preference.", "error");
    if (!email) return showToast("The email field is required.", "error");

    if (!acceptTerms) {
      return showToast(
        "You must agree to the Terms of Service and Privacy Policy.",
        "error",
      );
    }

    if (!captchaToken) {
      showToast("Please verify that you are not a robot.", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return showToast(
        "The email field must be a valid email address.",
        "error",
      );

    if (!password) return showToast("Password field is required.", "error");
    if (!Object.values(passwordChecks).every(Boolean))
      return showToast("Password does not meet requirements", "error");

    setIsSubmitting(true);

    try {
      //  Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // One shared implementation, also used by the /welcome campaign funnel -
      // see services/signupProfile.ts. Everything from the displayName down to
      // the verification email happens in there.
      await completeSignupProfile({
        user,
        name,
        email,
        businessCategory,
        clientsPreference,
        referralCode,
      });
      showToast(
        "Account created successfully! Please check your email for verification before logging in.",
        "success",
      );
      onSubmit?.(user.uid);
      setConfirmEmailModal(true);
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
      // onClose();
      clearForm();
    } catch (error: any) {
      console.error("Signup error:", error);
      showToast(error.message || "Signup failed. Try again.", "error");
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  if (confirmEmailModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal content */}
        <div className="relative flex min-h-full items-center justify-center p-4">
          <div className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-lg p-8 py-10">
            {/* Close Button */}
            {/* <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-all duration-200 ease-in-out"
          >
            <X className="w-5 h-5" />
          </button> */}

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-50 p-3 rounded-full">
                <Mail className="w-8 h-8 text-gray-600" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center mb-3">
              Check your email
            </h2>

            {/* Description */}
            <p className="text-gray-600 text-center mb-6">
              We've sent confirmation instructions to{" "}
              <span className="font-medium text-gray-900">{confirmEmail}</span>
            </p>

            {/* Success alert box */}
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-md border border-green-200 mb-6 text-center">
              Please check your email "spam" folder too for the confirmation
              link. It may take a few minutes to arrive.
            </div>

            {/* Back to sign in */}
            <div className="text-center">
              <button
                onClick={onShowSignIn}
                className="text-gray-600 font-medium text-sm"
              >
                ← Back to sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    /* The PANEL scrolls, not the screen. The panel is capped at the viewport
       height and laid out as a column: a fixed header holding the title and
       close button, then a scrolling body for the form. Previously the whole
       screen scrolled, which meant the title and close button scrolled away
       and the page behind moved with it. Body scroll is locked while this is
       open (see the effect above) so the background cannot move at all. */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-lg bg-card shadow-lg">
        {/* Header - stays put while the form scrolls under it. */}
        <div className="relative shrink-0 px-6 pt-10 pb-4">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-all duration-200 ease-in-out"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-bold text-center">
            Create your account
          </h2>
        </div>

        {/* min-h-0 is required: a flex child defaults to min-height:auto and
            would refuse to shrink below its content, defeating the cap. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-10">
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="John"
              className="w-full mb-3 p-2 border border-gray-300 rounded bg-card"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label className="block text-sm font-medium mb-1">
              Business Category <span className="text-red-500">*</span>
            </label>
            <select
              value={businessCategory}
              onChange={(e) => {
                setBusinessCategory(e.target.value);
                setClientsPreference("");
              }}
              className="w-full p-2 border border-gray-300 rounded mb-3 bg-card"
            >
              <option value="">Select Category</option>
              <option value="ARTS/MUSIC/WRITING">Arts/Music/Writing</option>
              <option value="BANKING/FINANCE">Banking/Finance</option>
              <option value="BUSINESS MGT">Business Mgt</option>
              <option value="COMMUNICATION">Communication</option>
              <option value="CONSTRUCTION">Construction</option>
              <option value="EDUCATION">Education</option>
              <option value="ENGINEERING">Engineering</option>
              <option value="ENTERTAINMENT">Entertainment</option>
              <option value="FARMING">Farming</option>
              <option value="GOV/POLITICS">Gov/Politics</option>
              <option value="HEALTHCARE">Healthcare</option>
              <option value="HOSPITALITY">Hospitality</option>
              <option value="IT/SOFTWARE">IT/Software</option>
              <option value="LEGAL">Legal</option>
              <option value="MANUFACTURING">Manufacturing</option>
              <option value="MILITARY">Military</option>
              <option value="NON-PROFIT">Non-Profit</option>
              <option value="REAL ESTATE">Real Estate</option>
              <option value="RETAIL">Retail</option>
              <option value="SALES/MARKETING">Sales/Marketing</option>
              <option value="SCIENCE/RESEARCH">Science/Research</option>
              <option value="SELF-EMPLOYED">Self-Employed</option>
              <option value="STUDENT">Student</option>
              <option value="TRANSPORTATION">Transportation</option>
              <option value="RETIRED">Retired</option>
              <option value="OTHER">Other</option>
            </select>

            {businessCategory && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clients/Leads Preference{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={clientsPreference}
                  onChange={(e) => setClientsPreference(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded bg-card"
                >
                  <option value="">Select Preference</option>
                  <option value="local">Local Clients</option>
                  <option value="non-local">Non-Local Clients</option>
                  <option value="both">Both</option>
                </select>
              </div>
            )}

            <label className="block text-sm font-medium mb-1">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="you@example.com"
              className="w-full mb-3 p-2 border border-gray-300 rounded bg-card"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="block text-sm font-medium mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full p-2 border border-gray-300 rounded pr-10 mb-3 bg-card"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={15}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>

            {password.length > 0 && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded h-2 mb-2">
                  <div
                    className={`h-2 rounded ${progressColor} transition-all duration-300`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <ul className="text-sm space-y-1">
                  {Object.entries(passwordChecks).map(([key, passed]) => (
                    <li
                      key={key}
                      className={`flex items-center ${
                        passed ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {passed ? (
                        <Check className="w-4 h-4 mr-1" />
                      ) : (
                        <Cross className="w-4 h-4 mr-1" />
                      )}
                      {key === "length" && "Minimum 8 characters"}
                      {key === "maxLength" && "Maximum 15 characters"}
                      {key === "lowercase" && "At least 1 lowercase letter"}
                      {key === "uppercase" && "At least 1 uppercase letter"}
                      {key === "number" && "At least 1 number"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-start gap-2 mb-4">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <label
                htmlFor="terms"
                className="text-sm text-gray-600 leading-5"
              >
                I agree to the{" "}
                <a
                  href="https://www.solobizcards.com/terms-of-service"
                  target="_blank"
                  className="text-slate-900 font-semibold hover:underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="https://www.solobizcards.com/privacy-policy"
                  target="_blank"
                  className="text-slate-900 font-semibold hover:underline"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            <div className="justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white font-semibold py-2.5 rounded-full hover:bg-neutral-800 transition-colors disabled:opacity-50 mt-4"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{" "}
            <button
              onClick={() => {
                clearForm();
                onShowSignIn();
              }}
              className="text-slate-900 font-semibold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
