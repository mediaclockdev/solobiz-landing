import {
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "@/services/firebase";
import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import {
  collection,
  query,
  where,
  getDocs,
  QuerySnapshot,
  getDoc,
} from "firebase/firestore";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const clearForm = () => setEmail("");
  const handleForgotPassword = async (e: React.FormEvent) => {
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

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.length === 0) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          showToast("No user found with this email.", "error");
          setIsSubmitting(false);
          return;
        }
        const currentUserDoc = querySnapshot.docs[0];
        const currentUser = currentUserDoc.data();
        if (currentUser?.isVerify) {
          await sendPasswordResetEmail(auth, email);
          showToast("Password reset link sent to your email!", "success");
          setEmail("");
        } else {
          showToast("Please verify your email!", "error");
        }
        onClose();
      }
    } catch (err: any) {
      showToast(
        err.message || "Something went wrong. Try again later.",
        "error"
      );
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-md max-w-md bg-card rounded-lg shadow-lg p-6 py-7 mx-4">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-all duration-200 ease-in-out rounded-[10px]"
        >
          ✕
        </button>
        <h2 className="font-bold text-xl text-center mb-6">
          Forgot Password
        </h2>
        <p className="text-sm text-gray-600 text-center mb-4">
          Enter your email address and we&apos;ll send you a reset link.
        </p>
        <form onSubmit={handleForgotPassword}>
          <input
            type="text"
            placeholder="you@example.com"
            className="w-full mb-4 p-2 border border-gray-300 rounded bg-card"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white font-semibold py-2.5 rounded-full hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
}
