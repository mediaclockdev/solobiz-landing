"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { applyBodyScrollLock } from "@/utils/scrollLock";
import { useRouter } from "next/navigation";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowSignUp: () => void;
  onShowForgotPassword?: () => void;
  message?: string;
}

export default function SignInModal({
  isOpen,
  onClose,
  onShowSignUp,
  onShowForgotPassword,
  message,
}: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showToast("The email field is required.", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("The email field must be a valid email address.", "error");
      return;
    }

    setIsSubmitting(true);

    const res = await login(email, password);

    if (res.success) {
      showToast("Login successful!", "success");
      onClose();
    } else {
      showToast("Invalid email or password!", "error");
    }
    clearForm();
    setIsSubmitting(false);
  };

  // Lock the page behind the modal, same as SignUpModal.
  useEffect(() => applyBodyScrollLock(isOpen), [isOpen]);

  if (!isOpen) return null;

  return (
    /* Same structure as SignUpModal: the PANEL scrolls, capped at the viewport
       height, with a fixed header and a scrolling body. Shorter than the signup
       form today, but a validation message or a "message" banner can push it
       past a laptop window - and it should behave identically either way. */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - fixed, so it covers the screen regardless of scrolling. */}
      <div
        className="fixed inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-lg bg-card shadow-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-500 transition-all duration-200 ease-in-out shadow-xl rounded-[10px]"
        >
          ✕
        </button>

        {/* min-h-0 lets this shrink below its content so the cap above holds. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 py-7">

        {message && (
          <div className="bg-slate-100 p-3 my-4 flex justify-center rounded-md">
            <Lock className="w-6 h-6 text-slate-800 my-auto mr-2" />
            <div className="text-slate-800 font-small text-center">
              {message}
            </div>
          </div>
        )}

        <h2 className="font-bold text-2xl leading-[40px] text-center mb-10">
          Sign in to your account
        </h2>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-1">
            Email address
          </label>
          <input
            type="text"
            placeholder="you@example.com"
            className="w-full mb-3 p-2 border border-gray-300 rounded bg-card"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="block text-sm font-medium mb-1">
            Password
          </label>
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full p-2 border border-gray-300 rounded pr-10 bg-card"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={15}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600 cursor-pointer"
              aria-label="Toggle password visibility"
            >
              {showPassword ? (
                // 👁 eye icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-eye "
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                // 👁 eye-off icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-eye-off "
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              )}
            </button>
          </div>

          {/* Forgot Password link */}
          <div className="text-right mb-4">
            <button
              type="button"
              onClick={() => {
                // onClose();
                onShowForgotPassword();
              }}
              className="text-sm text-slate-800 hover:text-black hover:underline font-medium"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white font-semibold py-2.5 rounded-full hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don&apos;t have an account ?{" "}
          <button
            onClick={() => {
              onClose();
              clearForm();
              onShowSignUp();
            }}
            className="text-slate-900 font-semibold hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
      </div>
    </div>
  );
}
