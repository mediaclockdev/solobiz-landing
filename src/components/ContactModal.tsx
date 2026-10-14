"use client";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { Camera, FileText, Loader2 } from "lucide-react";
import Tesseract from "tesseract.js";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import UpgradeModal from "./UpgradeModal";
import { addDays } from "date-fns";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  animateClass: string;
  username: string;
  isSubmitting: boolean;
  cardData: any;
  theme: string;
  isLocal?: boolean;
  onSubmitContact: (data: any) => void;
}

export function ContactModal({
  isOpen,
  onClose,
  animateClass,
  username,
  isLocal = false,
  isSubmitting,
  cardData,
  theme,
  onSubmitContact,
}: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    companyName: "",
    message: "",
  });
  const [mode, setMode] = useState<"select" | "scan" | "form" | "processing">(
    "select"
  );
  const [showWarning, setShowWarning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showMoreFields, setShowMoreFields] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  const router = useRouter();
  const { user } = useAuth();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const { showToast } = useToast();

  function parseCreatedAt(input) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  const createdAt = parseCreatedAt(user?.createdAt);
  const trialEnd = new Date(
    createdAt.getTime() + user?.freeTrialPeriod * 24 * 60 * 60 * 1000
  );
  const isTrialActive = new Date() <= trialEnd;

  // console.log("users:", user?.uid);
  // console.log("createdAt:", createdAt);
  // console.log("trialEnd:", trialEnd);
  // console.log("isTrialActive:", isTrialActive);

  // Clean up camera stream when modal closes
  useEffect(() => {
    if (!isOpen && stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [isOpen, stream]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getIpAddress = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      return data.ip;
    } catch (err) {
      console.error("IP fetch failed:", err);
      return null;
    }
  };

  const getBrowserLocation = async (): Promise<{
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    country?: string;
    fullAddress?: string;
  } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported.");
        return resolve(null);
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          // Google Maps Geocode API
          try {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyBcZaByAZLe7qQZAYhKWtc2O9Bn22PAD2E`
            );

            const data = await res.json();

            if (data.status !== "OK") {
              console.warn("Google Geocode error:", data.status);
              return resolve({ latitude, longitude });
            }

            const components = data.results[0].address_components;

            const city =
              components.find((c: any) => c.types.includes("locality"))
                ?.long_name ||
              components.find((c: any) => c.types.includes("sublocality"))
                ?.long_name;

            const state = components.find((c: any) =>
              c.types.includes("administrative_area_level_1")
            )?.long_name;

            const country = components.find((c: any) =>
              c.types.includes("country")
            )?.long_name;

            resolve({
              latitude,
              longitude,
              city,
              state,
              country,
              fullAddress: data.results[0].formatted_address,
            });
          } catch (err) {
            console.error("Geocode fetch error:", err);
            resolve({ latitude, longitude });
          }
        },

        (error) => {
          console.warn("User denied or error getting location:", error);
          resolve(null);
        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const getLocationFromIP = async (ip: any) => {
    const accessToken = "9f9a0a0c6d2d36";
    try {
      const res = await fetch(
        `https://ipinfo.io/${ip}/json?token=${accessToken}`
      );
      const data = await res.json();
      return {
        ip: data.ip,
        latitude: Number(data.loc.split(",")[0]),
        longitude: Number(data.loc.split(",")[1]),
        state: data.region,
        country: data.country,
        city: data.city,
        ...data,
      };
    } catch (err) {
      console.error("Error fetching IP location:", err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      showToast("Required fields missing", "error");
      return;
    }

    const uid = cardData.uid;
    //const ipAddress = await getIpAddress();
    let ipAddress = await getBrowserLocation();
    if (!ipAddress) {
      let ipAddress1 = await getIpAddress();
      ipAddress = await getLocationFromIP(ipAddress1);
    }

    try {
      await addDoc(collection(db, "leadContacts"), {
        uid,
        ...formData,
        createdAt: serverTimestamp(),
        ipAddress,
        type: "lead",
        fromUser: user?.uid ?? null, // Optional: store null if not logged in
      });

      // Update lead counts on card
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", cardData.metadata.id)
      );

      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();
        const now = new Date();

        // === KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentLeadsGenerated = cardData.leadsGenerated || 0;
        const cardLeadsGeneratedByMonth =
          cardData.cardLeadsGeneratedByMonth || {};
        const cardLeadsGeneratedByDay = cardData.cardLeadsGeneratedByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthLead = (cardLeadsGeneratedByMonth[monthKey] || 0) + 1;
        const updatedDayLead = (cardLeadsGeneratedByDay[dayKey] || 0) + 1;

        // === UPDATE ONLY IF USER IS NOT THE CARD OWNER ===
        if (!user || user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            leadsGenerated: currentLeadsGenerated + 1,
            [`cardLeadsGeneratedByMonth.${monthKey}`]: updatedMonthLead,
            [`cardLeadsGeneratedByDay.${dayKey}`]: updatedDayLead,
          });
        }
      }

      showToast("Your contact has been saved.", "success");
      onSubmitContact(formData);
      setFormData({
        name: "",
        lastName: "",
        email: "",
        phone: "",
        companyName: "",
        jobTitle: "",
        message: "",
      });
    } catch (error) {
      console.error("Error saving lead contact:", error);
      showToast("Could not save contact. Please try again.", "error");
    }
  };

  const handleScanCard = async () => {
    try {
      // Request camera access with simpler constraints for better compatibility
      const constraints = {
        video: {
          facingMode: "environment",
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      setStream(mediaStream);
      setMode("scan");
    } catch (error) {
      console.error("Camera access error:", error);
      showToast("Camera access denied", "error");
    }
  };

  // Effect to handle video stream when mode changes to scan
  useEffect(() => {
    if (mode === "scan" && stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;

      // Handle video load and play
      const handleLoadedMetadata = () => {
        video.play().catch((err) => {
          console.error("Error playing video:", err);
          showToast("Failed to start camera preview.", "error");
        });
      };

      video.addEventListener("loadedmetadata", handleLoadedMetadata);

      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    }
  }, [mode, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setMode("select");
  };

  const extractViaWebhook = async (imageBase64: string) => {
    try {
      const blob = await (await fetch(imageBase64)).blob();

      const fd = new FormData();
      fd.append("file", blob, "business-card.jpg");
      fd.append("cardId", cardData?.metadata?.id || "");

      const res = await fetch(
        "https://robuc33.app.n8n.cloud/webhook/business-card-upload",
        {
          method: "POST",
          body: fd,
        }
      );

      if (!res.ok) throw new Error("Webhook failed");

      return await res.json();
    } catch (err) {
      console.error("Webhook OCR failed:", err);
      return null;
    }
  };

  const extractTextFromImage = async (imageData: string) => {
    const result = await Tesseract.recognize(imageData, "eng");
    return result.data.text;
  };

  const parseBusinessCardText = (text: string) => {
    const lines = text.split("\n").filter(Boolean);
    const parsed: any = {};

    const emailRegex = /\S+@\S+\.\S+/;
    const phoneRegex = /(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

    for (const line of lines) {
      if (!parsed.email && emailRegex.test(line))
        parsed.email = line.match(emailRegex)?.[0];
      if (!parsed.phone && phoneRegex.test(line))
        parsed.phone = line.match(phoneRegex)?.[0];
      if (!parsed.name && line.length > 3) parsed.name = line;
    }

    return parsed;
  };

  // const parseBusinessCardText = (text: string) => {
  //   const lines = text.split("\n").filter((line) => line.trim());
  //   const parsed = {
  //     name: "",
  //     lastName: "",
  //     email: "",
  //     phone: "",
  //     jobTitle: "",
  //     companyName: "",
  //     message: "",
  //   };

  //   // Email regex
  //   const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  //   // Phone regex (supports various formats)
  //   const phoneRegex =
  //     /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;

  //   for (const line of lines) {
  //     const trimmed = line.trim();

  //     // Extract email
  //     const emailMatch = trimmed.match(emailRegex);
  //     if (emailMatch && !parsed.email) {
  //       parsed.email = emailMatch[0];
  //       continue;
  //     }

  //     // Extract phone
  //     const phoneMatch = trimmed.match(phoneRegex);
  //     if (phoneMatch && !parsed.phone) {
  //       parsed.phone = phoneMatch[0];
  //       continue;
  //     }

  //     // Extract name (assume first non-email, non-phone line is name)
  //     if (!parsed.name && trimmed.length > 2 && !emailMatch && !phoneMatch) {
  //       // Skip common business card keywords
  //       const skipWords = [
  //         "phone",
  //         "email",
  //         "tel",
  //         "mobile",
  //         "fax",
  //         "www",
  //         "http",
  //       ];
  //       const hasSkipWord = skipWords.some((word) =>
  //         trimmed.toLowerCase().includes(word)
  //       );
  //       if (!hasSkipWord) {
  //         parsed.name = trimmed;
  //       }
  //     }
  //   }

  //   return parsed;
  // };

  const playShutterSound = () => {
    try {
      if (typeof window !== "undefined") {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Create a brief click/snap sound
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          400,
          audioContext.currentTime + 0.1
        );

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.1
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    } catch (error) {
      console.log("Audio context not supported");
    }
  };

  const simulateProcessing = async () => {
    // Simulate processing with progress updates
    for (let i = 0; i <= 100; i += 10) {
      setProcessingProgress(i);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    playShutterSound();
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL("image/jpeg", 0.8);

      setCapturedImage(imageData);
      setMode("processing");
      setProcessingProgress(0);

      await simulateProcessing();
      // Fake progress
      for (let i = 0; i <= 100; i += 20) {
        setProcessingProgress(i);
        await new Promise((r) => setTimeout(r, 150));
      }

      /* ===================================================
         🔥 WEBHOOK FIRST → FALLBACK TO TESSERACT
         =================================================== */
      const webhookData = await extractViaWebhook(imageData);

      console.log("webhookData", webhookData);

      if (webhookData) {
        setFormData((prev) => ({
          ...prev,
          name: webhookData.fullName || "",
          lastName: webhookData.lastName || "",
          email: webhookData.email || "",
          phone: webhookData.phone || "",
          jobTitle: webhookData.jobTitle || "",
          companyName: webhookData.company || "",
          message: webhookData.notes || "",
        }));
      } else {
        const text = await extractTextFromImage(imageData);
        const parsed = parseBusinessCardText(text);

        setFormData((prev) => ({
          ...prev,
          ...parsed,
        }));
      }

      setCapturedImage(null);
      setMode("form");
      showToast("Card scanned successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to scan card", "error");
      setMode("select");
    }
  };

  const handleSendContact = async () => {
    if (isLocal) {
      setShowPermissionModal(true);
      return;
    }

    if (user?.planType == "free" && !isTrialActive) {
      setShowWarning(true);
      return;
    }
    setMode("form");
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`
          relative bg-white mx-auto w-[calc(100%-1rem)] ${
            cardData?.templateType === "modern" &&
            ["portrait"].includes(cardData?.cardLayout)
              ? "max-w-[500px]"
              : cardData?.templateType === "modern" &&
                  ["standard","fadein","centered"].includes(cardData?.cardLayout)
                ? "max-w-[500px]"
                : "max-w-[448px]"
          } 
          max-h-[98dvh] rounded-t-3xl shadow-2xl overflow-visible 
          transform transition-transform duration-700 ${animateClass}
        `}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
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
          {cardData?.profilePhoto ? (
            <img
              src={cardData.profilePhoto}
              alt="Profile"
              className="w-26 h-26 rounded-full border-4 border-white object-cover"
            />
          ) : (
            <div className="w-26 h-26 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-sm text-gray-600">
              No image
            </div>
          )}
        </div>

        {/* Content */}

        <div className="overflow-y-auto rounded-t-3xl max-h-[calc(98dvh-4rem)] pt-16 pb-6">
          <div className="px-6">
            <h2 className="text-center text-xl font-semibold mb-2">
              Send your contact information
            </h2>
            <p className="text-center text-gray-600 mb-6">to {username}</p>

            {mode === "select" && (
              <div className="space-y-4">
                <Button
                  onClick={handleScanCard}
                  className="w-full flex items-center justify-center gap-2"
                  variant="outline"
                >
                  <Camera size={20} />
                  Scan Paper Biz Card
                </Button>

                {user?.planType === "free" && !isTrialActive ? null : (
                  <Button
                    onClick={() => handleSendContact()}
                    className="w-full flex items-center justify-center gap-2"
                    style={{ backgroundColor: theme }}
                  >
                    <FileText size={20} />
                    Send via Contact Form
                  </Button>
                )}
              </div>
            )}

            {mode === "scan" && (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover"
                  />
                  {/* Overlay with cutout for capture area */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-black/40"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-40 border-2 border-dashed border-white rounded-lg relative">
                        {/* Clear cutout area */}
                        <div className="absolute inset-0 bg-transparent rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCapture}
                    disabled={isProcessing}
                    className="flex-1"
                    style={{ backgroundColor: theme }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Capture Card"
                    )}
                  </Button>
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Hidden canvas for image capture */}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {mode === "processing" && capturedImage && (
              <div className="space-y-4 text-center">
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Captured business card"
                    className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-4">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Processing Image...</h3>
                  <p className="text-sm text-gray-600">
                    Extracting text from business card
                  </p>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-200"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {processingProgress}% complete
                  </p>
                </div>
              </div>
            )}

            {mode === "form" && (
              <>
                <Button
                  onClick={() => setMode("select")}
                  variant="ghost"
                  className="mb-4 p-0 h-auto text-sm text-gray-600"
                >
                  ← Back to options
                </Button>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="First Name *"
                    required
                  />

                  <Input
                    name="lastName"
                    type="text"
                    value={formData.lastName || ""}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                  />

                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email *"
                    required
                  />

                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone Number"
                  />

                  {/* More fields toggle */}
                  {!showMoreFields && (
                    <button
                      type="button"
                      onClick={() => setShowMoreFields(true)}
                      className="text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1"
                    >
                      more {">"}
                      {">"}
                    </button>
                  )}

                  {/* Additional fields with slide-down animation */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      showMoreFields
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="space-y-4">
                      <Input
                        name="jobTitle"
                        type="text"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        placeholder="Job Title"
                      />

                      <Input
                        name="companyName"
                        type="text"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="Company Name"
                      />

                      <div>
                        <Textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          placeholder="Notes..."
                          rows={3}
                          maxLength={120}
                        />
                        <div className="text-xs text-gray-500 mt-1 text-right">
                          {formData.message.length}/120 characters
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-6"
                    style={{ backgroundColor: theme }}
                  >
                    {isSubmitting ? "Sending..." : "Send Contact Info"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      {showPermissionModal && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center px-4"
          )}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal Box */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 z-50 w-full max-w-md text-center">
            {/* Icon / Visual cue */}
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
              <span className="font-medium text-gray-800">create a FREE! </span>
              account to access and share these features. Please create an
              account now.
            </p>
            {/* Actions */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPermissionModal(false)}
                className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowPermissionModal(false);
                  setTimeout(() => router.replace("/?signIn=true"), 200);
                }}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
      <UpgradeModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
      />
    </div>,
    document.body
  );
}
