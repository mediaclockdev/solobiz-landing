"use client";

import React, { useState, useEffect } from "react";
import { BusinessCard } from "@/types/businessCard";
import { BusinessCardPreview } from "@/components/onboarding/BusinessCardPreview";
import { ShareModal } from "@/components/ShareModal";
import { ContactModal } from "@/components/ContactModal";
import { ThankYouPopup } from "@/components/ThankYouPopup";
import { Lightbox } from "@/components/ui/lightbox";
import { getFullName, generateVCard } from "@/utils/businessCard";
// import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Share2, Download, Eye, ArrowRight } from "lucide-react";
import { useAuth, UserData } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useToast } from "@/contexts/ToastContext";
import {
  useRouter,
  useSearchParams,
  useParams,
  redirect,
} from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { User } from "firebase/auth";
import Script from "next/script";
import { set } from "date-fns";
import { useNavigate } from "@/lib/navigation";
import { applyBodyScrollLock } from "@/utils/scrollLock";

interface MobileCardLayoutProps {
  cardId: string;
  card: BusinessCard;
  cardType: string;
  onNavigateBack: () => void;
  option?: string;
  showBackbtn?: boolean;
}

export function MobileCardLayout({
  cardId,
  card,
  cardType,
  onNavigateBack,
  showBackbtn,
  option = "",
}: MobileCardLayoutProps) {
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { showToast } = useToast();
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showLocalModal, setShowLocalModal] = useState(false);

  // Animation states
  const [shareModalAnimateClass, setShareModalAnimateClass] =
    useState("translate-y-full");
  const [contactModalAnimateClass, setContactModalAnimateClass] =
    useState("translate-y-full");
  const [thankYouAnimateClass, setThankYouAnimateClass] =
    useState("translate-y-full");
  const [shareModalClaimAnimateClass, setShareModalClaimAnimateClass] =
    useState("translate-y-full");

  // Custom message states for thank you popup
  const [customMessage, setCustomMessage] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customButtonText, setCustomButtonText] = useState("");
  const [localMessage, setLocalMessage] = useState("");
  const [showBackButton, setShowBackButton] = useState(false);
  const [userName, setUserName] = useState("");
  const [refLink, setRefLink] = useState("");
  const [cardUser, setCardUser] = useState<UserData>(null);
  const router = useRouter();
  const [emailValue, setEmailValue] = useState("");
  const searchParams = useSearchParams();
  const selectedView = searchParams.get("view");

  // const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const current = localStorage.getItem("currentPath");
    if (
      current &&
      (current.includes("members") ||
        current.includes("dashboard") ||
        current.includes("marketplace"))
    ) {
      setShowBackButton(true);
    } else {
      setShowBackButton(false);
    }
  }, [window, showBackbtn]);

  // Animation effects
  useEffect(() => {
    if (showShareModal) {
      setShareModalAnimateClass("translate-y-full");
      setTimeout(() => {
        setShareModalAnimateClass("translate-y-0");
      }, 50);
    }
  }, [showShareModal]);

  useEffect(() => {
    if (showClaimModal) {
      setShareModalAnimateClass("translate-y-full");
      setTimeout(() => {
        setShareModalAnimateClass("translate-y-0");
      }, 50);
    }
    return applyBodyScrollLock(showClaimModal);
  }, [showClaimModal]);

  useEffect(() => {
    if (showContactModal) {
      setContactModalAnimateClass("translate-y-full");
      setTimeout(() => {
        setContactModalAnimateClass("translate-y-0");
      }, 50);
    }
  }, [showContactModal]);

  useEffect(() => {
    if (showThankYouModal) {
      setThankYouAnimateClass("translate-y-full");
      setTimeout(() => {
        setThankYouAnimateClass("translate-y-0");
      }, 50);
    }

    async function fetchCardDetails() {
      try {
        const cardsQuery = query(
          collection(db, "cards"),
          where("metadata.id", "==", cardId),
        );
        const cardsSnapshot = await getDocs(cardsQuery);
        for (const cardDoc of cardsSnapshot.docs) {
          const cardData = cardDoc.data();
          const userID = cardDoc.data().uid;

          // Fetch user data for referral link
          const userQuery = doc(db, "users", userID);
          const userSnapshot = await getDoc(userQuery);
          const user_data = userSnapshot.data();
          //@ts-ignore
          setCardUser(user_data);
          const referalCode = user_data.referralCode;
          const link = `${window.location.origin}/?ref=${referalCode}`;
          setRefLink(link);

          // === DATE KEYS ===
          const now = new Date();
          const monthKey = `${now.getFullYear()}-${String(
            now.getMonth() + 1,
          ).padStart(2, "0")}`;
          const dayKey = `${now.getFullYear()}-${String(
            now.getMonth() + 1,
          ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

          // === EXISTING COUNTERS ===
          const currentViews = cardData.cardView || 0;
          const cardViewsByMonth = cardData.cardViewsByMonth || {};
          const updatedMonthViews = (cardViewsByMonth[monthKey] || 0) + 1;

          // === NEW DAILY COUNTER ===
          const cardViewsByDay = cardData.cardViewsByDay || {};
          const updatedDayViews = (cardViewsByDay[dayKey] || 0) + 1;

          // === UPDATE ONLY IF VIEWER != OWNER ===
          if (cardUser?.uid !== cardData?.uid) {
            await updateDoc(cardDoc.ref, {
              cardView: currentViews + 1,
              [`cardViewsByMonth.${monthKey}`]: updatedMonthViews,
              [`cardViewsByDay.${dayKey}`]: updatedDayViews,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching card details:", error);
      }
    }

    fetchCardDetails();
  }, [showThankYouModal]);

  const handleClaimClose = () => {
    setShareModalClaimAnimateClass("translate-y-full");
    setTimeout(() => {
      setShowClaimModal(false);
    }, 600);
  };
  // Modal sequence handlers
  const handleCloseShareModal = () => {
    if (cardUser?.planType === "free" && !isTrialActive) {
      setShareModalAnimateClass("translate-y-full");
      setTimeout(() => {
        setShowShareModal(false);
        if (card.templateType === "modern") {
          handleCloseContactModal();
        } else {
          setTimeout(() => {
            handleCloseContactModal();
            setTimeout(() => {
              setContactModalAnimateClass("translate-y-0");
            }, 500);
          }, 200);
        }
      }, 700);

      return;
    } else if (!cardUser) {
      const createdAt = parseCreatedAt(cardUser?.createdAt);
      const trialEnd = new Date(
        createdAt.getTime() + cardUser?.freeTrialPeriod * 24 * 60 * 60 * 1000,
      );
      const isTrialActive = new Date() <= trialEnd;
      if (cardUser?.planType === "free" && !isTrialActive) {
        setShareModalAnimateClass("translate-y-full");
        setTimeout(() => {
          setShowShareModal(false);
          if (card.templateType === "modern") {
            handleCloseContactModal();
          } else {
            setTimeout(() => {
              handleCloseContactModal();
              setTimeout(() => {
                setContactModalAnimateClass("translate-y-0");
              }, 500);
            }, 200);
          }
        }, 700);
      } else {
        setShareModalAnimateClass("translate-y-full");
        setTimeout(() => {
          setShowShareModal(false);
          if (card.templateType === "modern") {
            handleCloseContactModal();
          } else {
            setTimeout(() => {
              setShowContactModal(true);
              setTimeout(() => {
                setContactModalAnimateClass("translate-y-0");
              }, 500);
            }, 200);
          }
        }, 700);
      }
      return;
    }
    console.log("Need To Test");
    setShareModalAnimateClass("translate-y-full");
    setTimeout(() => {
      setShowShareModal(false);
      if (card.templateType === "modern") {
        handleCloseContactModal();
      } else {
        setTimeout(() => {
          setShowContactModal(true);
          setTimeout(() => {
            setContactModalAnimateClass("translate-y-0");
          }, 500);
        }, 200);
      }
    }, 700);
  };

  const handleContactForm = () => {
    setShareModalAnimateClass("translate-y-full");
    setTimeout(() => {
      setShowShareModal(false);
      setTimeout(() => {
        setShowContactModal(true);
        setTimeout(() => {
          setContactModalAnimateClass("translate-y-0");
        }, 500);
      }, 200);
    }, 700);
  };

  function parseCreatedAt(input) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  const createdAt = parseCreatedAt(cardUser?.createdAt);
  const trialEnd = new Date(
    createdAt.getTime() + cardUser?.freeTrialPeriod * 24 * 60 * 60 * 1000,
  );
  const isTrialActive = new Date() <= trialEnd;

  const handleCloseContactModal = () => {
    setContactModalAnimateClass("translate-y-full");
    setTimeout(() => {
      setShowContactModal(false);
       setTimeout(() => {
                setThankYouAnimateClass("translate-y-0");
              }, 500);
      setUserName("");
      setCustomMessage(
        "Hey, want your own digital biz card like this? Grab one now, it just takes 2 minutes.",
      );
      setCustomTitle("Free BizCard Offer!!!");
      setCustomButtonText("Get Your Free! BizCard Today");
      setShowThankYouModal(true);
    }, 500);
  };

  const handleDownloadVCard = async () => {
    if (cardUser && cardType === "local") {
      //local cards can't be shared
      setLocalMessage(
        "Local cards can't saved your contacts. Please sync them.",
      );
      setShowLocalModal(true);
      return;
    }
    // else if (!user) {
    //   setShowPermissionModal(true);
    //   return;
    // }

    try {
      const vCardData = await generateVCard(card);
      const blob = new Blob([vCardData], { type: "text/vcard;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${card.urlName || getFullName(card) || "contact"}.vcf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Failed to generate or download vCard:", err);
    }

    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === MONTHLY AND DAILY KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentSaveContacts = cardData.saveContact || 0;
        const saveContactsByMonth = cardData.saveContactsByMonth || {};
        const saveContactsByDay = cardData.saveContactsByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthSave = (saveContactsByMonth[monthKey] || 0) + 1;
        const updatedDaySave = (saveContactsByDay[dayKey] || 0) + 1;
        // === UPDATE ONLY IF USER IS NOT THE OWNER ===
        if (cardUser?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            saveContact: currentSaveContacts + 1,
            [`saveContactsByMonth.${monthKey}`]: updatedMonthSave,
            [`saveContactsByDay.${dayKey}`]: updatedDaySave,
          });
        }
      }
    } catch (error) {
      console.error("Error updating save contacts:", error);
    }

    // Show thank you popup after download
    setTimeout(() => {
      setUserName(card.profile?.firstName);
      setCustomMessage(
        `${
          card.profile?.firstName || "Contact"
        }'s contact details were downloaded to your phone.`,
      );
      setCustomTitle("Great Job!!!");
      setCustomButtonText("Get a BizCard Free!");
      setShowThankYouModal(true);
    }, 1000);
  };

  const handleContactSubmit = (contactData: any) => {
    setIsSubmitting(true);

    // Simulate API call - replace with actual API endpoint
    const submitData = {
      ...contactData,
      cardName: getFullName(card),
      cardLink: window.location.href,
    };

    // Mock API call - replace with actual implementation
    setTimeout(() => {
      // toast({
      //   title: "Contact information sent!",
      //   description: "Your contact details have been shared successfully.",
      // });
      setIsSubmitting(false);
      setShowContactModal(false);
      setCustomMessage(
        " Hey, want your own digital biz card like this? Grab one now, it just takes 2 minutes.",
      );
      setCustomTitle("Free BizCard Offer!!!");
      setCustomButtonText("Get Your Free! BizCard Today");
      setShowThankYouModal(true);
    }, 2000);
  };

  const handleCloseThankYou = () => {
    setThankYouAnimateClass("translate-y-full");
    setTimeout(() => {
      setShowThankYouModal(false);
      setCustomMessage("");
      setUserName("");
      setCustomTitle("");
      setCustomButtonText("");
      //setThankYouAnimateClass("translate-y-0");
    }, 500);
  };

  const handleSharedCard = () => {
    if (cardUser && cardType === "local") {
      //local cards can't be shared
      setLocalMessage("Local cards can't be shared. Please sync them.");
      setShowLocalModal(true);
      return;
    }
    setShowShareModal(true);
    setUserName("");
  };
  const handleClaimCard = () => {
    if (cardUser && cardType === "local") {
      setLocalMessage("Local cards can't be shared. Please sync them.");
      setShowLocalModal(true);
      return;
    }
    setTimeout(() => {
      setShowClaimModal(true);
      setTimeout(() => {
        setShareModalClaimAnimateClass("translate-y-0");
      }, 100);
    }, 400);
  };

  const navigateBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
      return;
    }
    router.back();
  };

  const words = [
    { text: "Professionals", color: "text-red-500" },
    { text: "Businesses", color: "text-pink-400" },
    { text: "Individuals", color: "text-yellow-400" },
  ];
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setAnimate(true);
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // const handleClaim = async () => {
  //   if (isSending) return;
  //   if (!emailValue) {
  //     showToast("Please fill proper value.", "error");
  //     return;
  //   }

  //   try {
  //     setIsSending(true);
  //     const res = await fetch("/api/claim-profile", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         email: emailValue,
  //       }),
  //     });

  //     const data = await res.json();

  //     if (data.success) {
  //       showToast("Request sent successfully!", "success");
  //       setEmailValue("");
  //       setIsSending(false);
  //       redirect("/");
  //     } else {
  //       showToast("Something went wrong", "error");
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     showToast("Server error", "error");
  //   }
  // };

  const handleClaim = () => {
    if (isSending) return;
    if (!emailValue) {
      showToast("Please fill proper value.", "error");
      return;
    }

    try {
      setIsSending(true);
      localStorage.setItem("claimCard", emailValue);
      showToast("Card Claimed Successfully!", "success");
      setEmailValue("");
      navigate("/?signUp=true");
      setIsSending(false);
    } catch (error) {
      console.error(error);
      setIsSending(false);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col relative",
        card.templateType === "modern" ? "" : "p-4 sm:p-6",
      )}
      style={{ backgroundColor: `${card.brandColor}20` }}
    >
      <>
        {card.metadata.tracking && (
          <Script
            id={`tracking-${card.id}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: card.metadata.tracking,
            }}
          />
        )}
      </>
      <div
        className={cn(
          showLocalModal || showPermissionModal
            ? "blur-sm pointer-events-none"
            : "",
          card.templateType !== "modern" && "business-card-display",
        )}
      >
        {showBackButton && card.templateType !== "modern" && (
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={navigateBack}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          </div>
        )}
        <BusinessCardPreview
        refLink={refLink}
          card={card}
          handleSharedCard={handleSharedCard}
          handleDownloadVCard={handleDownloadVCard}
          handleClaimClick={handleClaimCard}
          onExchangePress={handleContactForm}
          isEditMode={option === "edit" && cardType === "local"}
          showBackbtn={showBackButton}
          onNavigateBack={() => router.back()}
        />
      </div>

      {/* Footer */}
      <div
        className={cn(
          showLocalModal || showPermissionModal
            ? "blur-sm pointer-events-none"
            : "",
          card.templateType == "modern" ? "" : "fixed bottom-0 left-0 right-0",
        )}
      >
        {/* max-w-md */}
        {card.templateType !== "modern" && (
          <div className="max-w-md mx-auto w-full px-4 sm:px-0">
            {/* Action Buttons */}
            <>
              <div className="flex justify-center gap-4 mb-4">
                <>
                  <button
                    onClick={() => handleSharedCard()}
                    className="px-4 h-[40px] text-white rounded-lg hover:opacity-90 transition-opacity font-medium shadow-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor: card.brandColor }}
                  >
                    <Share2 size={20} />
                    Share Card
                  </button>

                  <button
                    onClick={handleDownloadVCard}
                    className="px-4 h-[40px] text-white rounded-lg hover:opacity-90 transition-opacity font-medium shadow-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor: card.brandColor }}
                  >
                    <Download size={20} />
                    Save Contact
                  </button>
                </>
              </div>

              {/* Footer Text */}

              <div
                className="text-center text-white text-xs h-[20px] flex items-center justify-center px-1 rounded-t-lg"
                style={{ backgroundColor: card.brandColor, lineHeight: "30px" }}
              >
                <span className="italic">
                  {card?.metadata?.cardType == null ||
                  card?.metadata?.cardType === "free"
                    ? "Created by: "
                    : ""}
                  <a
                    href={
                      card?.metadata?.cardType == null ||
                      card?.metadata?.cardType === "free"
                        ? refLink
                        : undefined
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${
                      card?.metadata?.cardType == null ||
                      card?.metadata?.cardType === "free"
                        ? "hover:opacity-80"
                        : "pointer-events-none cursor-not-allowed"
                    }`}
                  >
                    {card?.metadata?.cardType == null ||
                    card?.metadata?.cardType === "free"
                      ? process.env.NEXT_PUBLIC_API_LIVE_URL?.replace(/\/$/, "")
                      : "Digital Business Card"}
                  </a>
                </span>
              </div>
            </>
          </div>
        )}
      </div>

      {/* Spacer to prevent content from being hidden behind fixed footer */}
      {card.templateType !== "modern" && <div className="h-20" />}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={handleCloseShareModal}
        //url={`${window.location.href}`}
        url={`${
          cardType === "local"
            ? process.env.NEXT_PUBLIC_API_LIVE_URL
            : window.location.href
        }`}
        refLink={refLink}
        title={`${getFullName(card)}'s Digital Business Card`}
        cardProfile={card.profile}
        cardBusiness={card.profile}
        cardBrandColor={card.brandColor}
        animateClass={shareModalAnimateClass}
        cardData={card}
        isLocal={cardType === "local"}
        qrCodeUrl={
          cardType === "local"
            ? `${card.localQRCode?.qrCodeUrl}`
            : `${card.qrCode?.qrCodeUrl}`
        }
      />

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={handleCloseContactModal}
        animateClass={contactModalAnimateClass}
        username={card.profile?.firstName || "user"}
        isSubmitting={isSubmitting}
        cardData={card}
        theme={card.brandColor}
        onSubmitContact={handleContactSubmit}
        isLocal={cardType === "local"}
      />

      {/* Thank You Popup */}
      <ThankYouPopup
        isOpen={showThankYouModal}
        onClose={handleCloseThankYou}
        animateClass={thankYouAnimateClass}
        customTitle={customTitle}
        customMessage={customMessage}
        customButtonText={customButtonText}
        theme={card.brandColor}
        username={userName}
        profilePhoto={card.profilePhoto}
        template={card.templateType}
        cardData={card}
        Link={refLink}
      />

      {showPermissionModal && (
        <div
          className={cn(
            "fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center",
            "left-0", // matches sidebar width
          )}
        >
          {/* Dark overlay (only covers content area) */}
          <div className="absolute inset-0 bg-black/40" />
          {/* Modal Box */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 z-50 w-full max-w-sm mx-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100 text-red-600">
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

            {/* Heading */}
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Permission Required
            </h2>

            {/* Message */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              You need to{" "}
              <span className="font-medium text-gray-800">sign in</span>
              to access this page. Please log in with your account.
            </p>

            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPermissionModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowPermissionModal(false);
                  setTimeout(() => router.replace("/?signIn=true"), 100);
                }}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}

      {showLocalModal && (
        <div
          className={cn(
            "fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center",
            "left-0", // matches sidebar width
          )}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-lg shadow-xl p-6 z-50 w-full max-w-sm mx-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100 text-red-600">
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

            {/* Heading */}
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Permission Required
            </h2>

            {/* Message */}
            <p className="text-gray-600 mb-8 leading-relaxed">{localMessage}</p>

            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowLocalModal(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showClaimModal && (
        <div
          className={
            showPermissionModal
              ? "blur-sm pointer-events-none fixed inset-0 flex items-end justify-center bg-black/30"
              : "fixed inset-0 flex items-end justify-center bg-black/30 z-[99]"
          }
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClaimClose();
          }}
        >
          {/* Main Modal Container */}
          <div
            className={`relative bg-white mx-auto w-[calc(100%-1rem)] ${card?.templateType === "modern" && (card.cardLayout == "standard" || card.cardLayout == "portrait" || card.cardLayout == "centered" || card.cardLayout == "fadein") ? "max-w-[500px]" : "max-w-[460px]"} max-h-[98dvh] rounded-t-3xl shadow-2xl overflow-visible transform transition-transform duration-700 ${shareModalClaimAnimateClass}`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button at top-right */}
            <button
              onClick={handleClaimClose}
              className="absolute top-4 right-4 p-2 bg-white z-10 cursor-pointer rounded-full hover:scale-110 transition-transform"
              aria-label="Close"
            >
              <svg
                style={{
                  fill: "rgb(0, 0, 0)",
                  height: "24px",
                  width: "24px",
                }}
                viewBox="0 0 20 20"
              >
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </button>

            {/* Profile Picture Overlap */}
            <div className="absolute left-1/2 transform -translate-x-1/2 -top-13 z-10">
              {card?.profilePhoto ? (
                <img
                  src={card.profilePhoto}
                  alt="Profile"
                  className="w-26 h-26 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="w-26 h-26 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                  No image
                </div>
              )}
            </div>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto rounded-t-3xl max-h-[calc(98dvh-4rem)] pt-16">
              <div className="relative w-full px-4">
                {/* Heading */}
                <h2 className="text-center text-xs font-semibold mb-2 mt-2 bg-white rounded-full shadow-md w-fit m-auto px-4 py-2 border border-[#39232317]">
                  POWERING 5M+ CONNECTIONS
                </h2>
                <h2 className="text-4xl font-bold leading-snug text-center">
                  Trusted by 100k+ <br />
                  <span className="relative inline-block h-8">
                    <span
                      className={`block transition-all duration-300 ${
                        animate
                          ? "translate-y-0 opacity-100"
                          : "translate-y-6 opacity-0"
                      } ${words[index].color}`}
                    >
                      {words[index].text}
                    </span>
                  </span>
                </h2>
                {/* Username Input */}

                <div className="mt-6">
                  <div className="flex items-center rounded-xl overflow-hidden shadow-md transition border focus-within:ring-2 focus-within:ring-black-500 rounded-lg">
                    {/* Prefix */}
                    <span className="px-4 py-3 text-black/90 text-sm font-medium bg-[#80808017] backdrop-blur-sm rounded-l-lg border-r border-[#39232317]">
                      dash.solobizcards.com/
                    </span>

                    {/* Input */}
                    <input
                      type="text"
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      placeholder="yourname"
                      className="flex-1 px-1 py-3 bg-transparent text-black placeholder:text-white/60 focus:outline-none text-sm"
                    />
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleClaim}
                  disabled={isSending}
                  className={`mt-5 w-full font-semibold py-3 rounded-xl shadow-md transition-all duration-200 
                  ${
                    isSending
                      ? "bg-purple-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 hover:scale-[1.02]"
                  } text-white`}
                >
                  {isSending ? "Sending..." : "Claim your Card"}
                </button>
              </div>
              <div className="w-full flex justify-center pointer-events-none">
                <img
                  src="/lovable-uploads/slide-img.png"
                  alt="Cards Preview"
                  className="w-full max-w-none object-cover mt-6"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
