"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "@/lib/navigation";
import { BusinessCard, FormSection } from "@/types/businessCard";
import { BusinessCardForm } from "@/components/onboarding/BusinessCardForm";
import { BusinessCardPreview } from "@/components/onboarding/BusinessCardPreview";
import { getFullName, createInitialCard } from "@/utils/businessCard";
import { loadBusinessCards } from "@/utils/cardStorage";
import { X, Eye, EyeOff, Check, X as Cross, ArrowLeft } from "lucide-react";
// ✅ import Header, Footer, and Modals like in BusinessCardCreator
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import ResetPasswordModal from "@/components/ResetPasswordModal";
import { useSearchParams } from "next/navigation";
import SoloBizVideoAd from "./Animations";

export default function Onboarding() {
  const [card, setCard] = useState<BusinessCard>(createInitialCard());
  const [currentSection, setCurrentSection] = useState<FormSection>("display");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const router = useRouter();
  // ✅ Modal states
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isForgotOpen, setForgotOpen] = useState(false);
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false); // closed by default

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useSearchParams();

  const [isResetOpen, setResetOpen] = useState(false);
  const [resetCode, setResetCode] = useState<string | null>(null);

  const isEditMode = Boolean(
    location.state?.editMode && location.state?.cardId,
  );
  const selectedTab = searchParams.get("selectedTab") ?? null;
  // Initialize card state for editing
  const referal = searchParams.get("ref");
  const signIn = searchParams.get("signIn");

  const signUp = searchParams.get("signUp");
  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");
    if (mode === "resetPassword" && oobCode) {
      setResetCode(oobCode);
      setResetOpen(true);
    } else if (mode === "verifyEmail" && oobCode) {
      navigate(`/verify-email?${searchParams}`);
    } else {
      setResetOpen(false);
    }

    if (isEditMode && location.state?.cardId) {
      const cards = loadBusinessCards();
      const cardToEdit = cards.find(
        (c: BusinessCard) => c.metadata.id === location.state.cardId,
      );

      if (cardToEdit) {
        setCard(cardToEdit);
      } else {
        navigate(`/dashboard/cards`);
      }
    }
  }, [isEditMode, location.state?.cardId, navigate]);

  useEffect(() => {
    if (signIn) {
      if (!isSignInOpen) {
        setIsSignInOpen(true);
      }
    } else {
      setIsSignInOpen(false);
    }

    if (referal) {
      if (!isSignInOpen) {
        setShowAnimation(true);
        //setIsExtraModalOpen(true);
        //setIsSignUpOpen(true);
      }
    } else {
      if (signUp) {
        setIsSignUpOpen(true);
      } else {
        setIsSignUpOpen(false);
      }
    }
    if (signUp) {
      setIsSignUpOpen(true);
    } else {
      setIsSignUpOpen(false);
    }
  }, []);

  const handleCardUpdate = (updatedCard: BusinessCard) => {
    setCard(updatedCard);
    setHasUnsavedChanges(true);
  };

  const handleOnAnimation = () => {
    setShowAnimation(false);
    setIsExtraModalOpen(true);
  };
  if (showAnimation) {
    return <SoloBizVideoAd onEndAnimation={handleOnAnimation} />;
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: `${card.brandColor}15` }}
    >
      <Header onShowSignIn={() => setIsSignInOpen(true)} />
      {/* Added Header with sign in trigger */}
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            {/* Form Section */}
            <div className="form-scroll-container md:sticky md:top-6 md:self-start md:h-[calc(100vh-3rem)] md:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <BusinessCardForm
                card={card}
                onUpdate={handleCardUpdate}
                currentSection={currentSection}
                onSectionChange={setCurrentSection}
                isEditMode={isEditMode}
                getFullName={getFullName}
                hasUnsavedChanges={hasUnsavedChanges}
                selectedTab={selectedTab ?? null}
              />
            </div>

            {/* Preview Section */}
            <div className="hidden md:block md:sticky md:top-6 mt-8 md:mt-0 md:self-start">
              <BusinessCardPreview card={card} isCreateMode={true} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}

      {/* Sign In Modal */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => {
          if (referal) {
            setIsSignInOpen(false);
            navigate("/");
            return;
          }
          setIsSignInOpen(false);
        }}
        onShowSignUp={() => {
          setIsSignInOpen(false);
          setIsSignUpOpen(true);
        }}
        onShowForgotPassword={() => {
          setIsSignInOpen(false);
          setForgotOpen(true);
        }}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotOpen} // Correct state
        onClose={() => setForgotOpen(false)}
      />

      {/* Sign Up Modal */}
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => {
          setIsSignUpOpen(false);
          if (referal) {
            navigate("/");
            return;
          }
          setIsSignUpOpen(false);
        }}
        onShowSignIn={() => {
          setIsSignUpOpen(false);
          setIsSignInOpen(true);
        }}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetOpen}
        onClose={() => setResetOpen(false)}
        oobCode={resetCode}
      />

      {isExtraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm"
            onClick={() => {
              setIsExtraModalOpen(false);
            }}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-lg p-6 py-6 mx-4">
            <div
              className="absolute inset-0 bg-center opacity-10 bg-[length:100%_60%] bg-no-repeat lg:bg-[length:70%_70%] -z-10"
              style={{
                backgroundImage: "url('/lovable-uploads/solo-logo-icon.png')",
              }}
            />
            <button
              onClick={() => {
                setIsExtraModalOpen(false);
              }}
              aria-label="Close"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-all duration-200 ease-in-out"
            >
              <X className="w-5 h-5" />
            </button>

            {/* NEW WELCOME TEXT SECTION */}
            <div className="text-center">
              <h3>
                <span className="text-base">Welcome</span>
                <br />
                to
                <br />
                <span className="text-xl font-semibold leading-tight">
                  Solo Biz Cards
                </span>
              </h3>

              <p className="text-sm text-gray-600 mt-3">
                The only digital business card for small businesses and side
                hustlers. And where users can earn income just by sharing our
                free biz card.
              </p>

              <h4 className="text-base font-semibold mt-4">
                How to get started:
              </h4>

              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>1. Create & save your free biz card locally.</li>
                <li>2. Create your free user account.</li>
                <li>3. Transfer (sync) your card with your account.</li>
              </ul>

              <p className="text-base font-semibold mt-4">Or</p>

              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                <li>1. Create a free account first.</li>
                <li>2. Create & save your free biz card to your account.</li>
              </ul>

              {/* BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => {
                    setIsExtraModalOpen(false);
                    navigate("/");
                    return;
                  }}
                  className="px-5 py-2 rounded bg-gray-100 border border-gray-300 font-medium hover:bg-gray-200 transition"
                >
                  Create Free Card
                </button>

                <button
                  onClick={() => {
                    setIsExtraModalOpen(false);
                    setIsSignUpOpen(true);
                  }}
                  className="px-5 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                >
                  Create Free Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
