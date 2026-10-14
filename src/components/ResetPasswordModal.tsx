"use client";

import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { useNavigate } from "@/lib/navigation";
import { auth } from "@/services/firebase";
import { confirmPasswordReset } from "firebase/auth";
import { Eye, EyeOff, Check, X as Cross } from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  oobCode: string | null;
}

export default function ResetPasswordModal({ isOpen, onClose, oobCode }: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [password_confirmation, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  // Password validation
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
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oobCode) {
      showToast("Invalid reset link", "error");
      return;
    }

    if (password !== password_confirmation) {
      showToast("Passwords do not match", "error");
      return;
    }

    if (!Object.values(passwordChecks).every(Boolean)) {
      showToast("Password does not meet requirements", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      showToast("Password reset successfully!", "success");

      clearForm();
      onClose();
      navigate("/");
    } catch (err: any) {
      showToast(err.message || "Failed to reset password!", "error");
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md bg-card rounded-lg shadow-lg p-6 py-8 mx-4">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-all duration-200 ease-in-out"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your new password below.
        </p>

        <form onSubmit={handleResetPassword}>
          {/* New Password */}
          <label className="block text-sm font-medium mb-1">
            New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative mb-3">
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
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>

          {/* Confirm Password */}
          <label className="block text-sm font-medium mb-1">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative mb-4">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full p-2 border border-gray-300 rounded pr-10 bg-card"
              value={password_confirmation}
              onChange={(e) => setConfirmPassword(e.target.value)}
              maxLength={15}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>

          {/* Password Strength */}
          {password.length > 0 && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded h-2 mb-2">
                <div
                  className={`h-2 rounded ${progressColor} transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <ul className="text-sm space-y-1">
                <li
                  className={`flex items-center ${passwordChecks.length ? "text-green-600" : "text-red-500"}`}
                >
                  {passwordChecks.length ? <Check className="w-4 h-4 mr-1" /> : <Cross className="w-4 h-4 mr-1" />}
                  Minimum 8 characters
                </li>
                <li
                  className={`flex items-center ${passwordChecks.maxLength ? "text-green-600" : "text-red-500"}`}
                >
                  {passwordChecks.maxLength ? <Check className="w-4 h-4 mr-1" /> : <Cross className="w-4 h-4 mr-1" />}
                  Maximum 15 characters
                </li>
                <li
                  className={`flex items-center ${passwordChecks.lowercase ? "text-green-600" : "text-red-500"}`}
                >
                  {passwordChecks.lowercase ? <Check className="w-4 h-4 mr-1" /> : <Cross className="w-4 h-4 mr-1" />}
                  At least 1 lowercase letter
                </li>
                <li
                  className={`flex items-center ${passwordChecks.uppercase ? "text-green-600" : "text-red-500"}`}
                >
                  {passwordChecks.uppercase ? <Check className="w-4 h-4 mr-1" /> : <Cross className="w-4 h-4 mr-1" />}
                  At least 1 uppercase letter
                </li>
                <li
                  className={`flex items-center ${passwordChecks.number ? "text-green-600" : "text-red-500"}`}
                >
                  {passwordChecks.number ? <Check className="w-4 h-4 mr-1" /> : <Cross className="w-4 h-4 mr-1" />}
                  At least 1 number
                </li>
              </ul>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white font-semibold py-2.5 rounded-full hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
