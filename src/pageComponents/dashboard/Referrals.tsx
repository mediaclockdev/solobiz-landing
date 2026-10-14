"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * How many grandchild referrals a paid user may click through to.
 * Client point (b): "max. first10 only. after 10, when the [icons] are
 * clicked... popup a notice."
 */
const GRANDCHILD_VIEW_LIMIT = 10;
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Lightbox } from "@/components/ui/lightbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Eye,
  Info,
  Copy,
  Users,
  TrendingUp,
  Target,
  Star,
  ChevronRight,
  ChevronLeft,
  Gift,
  X,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
//import { WorldMap } from "@/components/ui/WorldMap";
import dynamic from "next/dynamic";
import { useToast } from "@/contexts/ToastContext";
const WorldMap = dynamic(() => import("@/components/ui/WorldMap"), {
  ssr: false,
});
import { useNavigate } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LeadExportPurchaseModal } from "@/components/dashboard/LeadExportPurchaseModal";
import { ReferralLeadsChart } from "@/components/dashboard/ReferralLeadsChart";
import {
  addDoc,
  average,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { BusinessCard } from "@/types/businessCard";
import { YourParent } from "@/components/dashboard/systems/YourParent";

export default function Referrals() {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const createdAt = user?.metadata?.creationTime ?? new Date();
  let referralLink = "";
  if (typeof window !== "undefined" && user?.referralCode) {
    referralLink = `${window.location.origin}?ref=${user.referralCode}`;
  }
  const date = new Date(createdAt);
  const day = date.getDate();
  const [parentCount, setParentCount] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  const getDaySuffix = (d: number) => {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
  };

  const formattedDate = date.toLocaleDateString("en-GB", options);
  const formatted = `${day}${getDaySuffix(day)} ${formattedDate}`;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [referalMap, setReferalMap] = useState([]);
  const [grnadChildreferalMap, setGrandChildReferalMap] = useState([]);

  const [showRemaining, setShowRemaining] = useState(false);

  const sortedReferrals = useMemo(() => {
    return [...(referalMap || [])].reverse(); // latest first
  }, [referalMap]);

  // const firstRow = sortedReferrals.slice(0, 10);
  // const remaining = sortedReferrals.slice(10);

  const [level, setLevel] = useState(0);
  const [memberLevel, setMemberLevel] = useState("");
  const [nextLevelNeed, setNextLevelNeed] = useState(0);

  const [requiredChildren, setRequiredChildren] = useState(0);
  const [requiredGrandChildren, setRequiredGrandChildren] = useState(0);

  const [currentChildren, setCurrentChildren] = useState(0);
  const [currentGrandChildren, setCurrentGrandChildren] = useState(0);

  const [averageForChild, setAverageForChild] = useState(0);
  const [averageForLevelUp, setAverageForLevelUp] = useState(0);

  const [remainingChildren, setRemainingChildren] = useState(0);
  const [remainingGrandChildren, setRemainingGrandChildren] = useState(0);

  const [childEarnings, setchildEarnings] = useState(0);
  const [grandchildEarnings, setRgrandchildEarnings] = useState(0);
  const [parentInfo, setParentInfo] = useState(null);
  const [defaultCard, setDefaultCard] = useState<string>(null);

  const [cardDetails, setCardDetails] = useState<BusinessCard>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [MNR, setMNR] = useState(0);
  const [refBadgesLevel, setRefBadgesLevel] = useState(0);
  const [l4Multiplier, setL4Multiplie] = useState(0);
  const [l5Multiplier, setL5Multiplier] = useState(0);
  const [l6Multiplier, setL6Multiplier] = useState(0);
  const [hasFetchedSettings, setHasFetchedSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  const [privateCardMessage, setPrivateCardMessage] =
    useState<string>("Private Card");
  const [privateCardSubMessage, setPrivateCardSubMessage] = useState<string>(
    "Oops! This card is private. You don’t have permission to view it.",
  );

  async function countParents(userId: string) {
    const userRef = doc(db, "referrals", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const grandchildren = userData.grandchildren || [];
      const parent = userData.parentUid || null;
      setRefBadgesLevel(userData.badgeLevel);

      if (parent) {
        const parentRef = doc(db, "users", parent);
        const parentSnap = await getDoc(parentRef);
        if (parentSnap.exists()) {
          const parentData = parentSnap.data();
          setParentInfo(parentData);
          const q = query(
            collection(db, "cards"),
            where("uid", "==", parent),
            limit(1),
          );

          const querySnapshot = await getDocs(q);
          const latestCard = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))[0];
          //    console.log("latestCard", latestCard);
          if (latestCard) {
            //@ts-ignore
            setCardDetails(latestCard);
            //console.log("Created latestCard", latestCard);
            //@ts-ignore
            setDefaultCard(latestCard?.urlName);
          }
        }
      } else {
        const q = query(
          collection(db, "users"),
          where("email", "==", "rob@solobizcards.com"),
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))[0];
          // const userData = querySnapshot.docs[0].data() as any;
          setParentInfo(userData);
          setDefaultCard(
            "sb-example-card"
          );
          // console.log("userData", userData);
          const q = query(
            collection(db, "cards"),
            where("uid", "==", userData?.id),
            limit(1),
          );

          const userQuerySnapshot = await getDocs(q);
          const latestCard = userQuerySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))[0];
          if (latestCard) {
            //@ts-ignore
            setCardDetails(latestCard);
          }
        }
      }
      return grandchildren.length;
    }
    return 0;
  }

  const getLocationFromIP = async (ip: string) => {
    const accessToken = "9f9a0a0c6d2d36";
    try {
      const res = await fetch(
        `https://ipinfo.io/${ip}/json?token=${accessToken}`,
      );
      const data = await res.json();
      return {
        ip: data.ip,
        latitude: Number(data.loc.split(",")[0]),
        longitude: Number(data.loc.split(",")[1]),
        state: data.region,
        country: data.country,
        ...data,
      };
    } catch (err) {
      console.error("Error fetching IP location:", err);
      return null;
    }
  };

  const buildReferralArray = async () => {
    const userRef = doc(db, "referrals", user.uid);
    const userSnap = await getDoc(userRef);
    const referralArray: any[] = [];

    if (!userSnap.exists()) return referralArray;

    const userData = userSnap.data();
    const childrenIP = userData?.childrenIP || [];
    const children = userData?.children || [];
    const childrenLocation = userData?.childrenLocation || [];

    const grandchildrenIP = userData?.grandchildrenIP || [];
    const grandchildren = userData?.grandchildren || [];
    // const grandchildrenLocation = userData?.childrenLocation || [];

    const grandChildTotal = grandchildrenIP.length;
    const total = childrenIP.length;

    const locCount = childrenLocation.length;

    const grandChildnormalizedLocations: any[] =
      Array(grandChildTotal).fill(null);
    // -------------------------------------
    // 1️ Initialize normalizedLocations
    // -------------------------------------
    const normalizedLocations: any[] = Array(total).fill(null);

    if (locCount === total) {
      // CASE A: Perfect 1:1 mapping → use directly
      for (let i = 0; i < total; i++) {
        normalizedLocations[i] = childrenLocation[i];
      }
    } else {
      // CASE B: Old data → shift to end
      for (let i = 0; i < locCount; i++) {
        const targetIndex = total - locCount + i;
        normalizedLocations[targetIndex] = childrenLocation[i];
      }
    }

    // -------------------------------------
    // 2️ Fill missing locations using IP
    // -------------------------------------
    for (let i = 0; i < total; i++) {
      if (!normalizedLocations[i]) {
        try {
          normalizedLocations[i] = await getLocationFromIP(childrenIP[i]);
        } catch (err) {
          console.error("IP lookup failed", err);
          normalizedLocations[i] = null;
        }
      }
    }
    for (let i = 0; i < grandChildTotal; i++) {
      if (!grandChildnormalizedLocations[i]) {
        try {
          grandChildnormalizedLocations[i] = await getLocationFromIP(
            grandchildrenIP[i],
          );
        } catch (err) {
          console.error("IP lookup failed", err);
          grandChildnormalizedLocations[i] = null;
        }
      }
    }
    // -------------------------------------
    // 3️ Continue your regular loop logic
    // -------------------------------------
    for (let i = 0; i < total; i++) {
      const ip = childrenIP[i];
      const childId = children[i];
      const loc = normalizedLocations[i];

      if (!ip || !childId) continue;

      let finalLocation = loc;

      // Reverse geocode ONLY if location has original lat/lon from browser
      if (loc?.latitude && loc?.longitude && loc?.source !== "ip") {
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.latitude},${loc.longitude}&key=AIzaSyBcZaByAZLe7qQZAYhKWtc2O9Bn22PAD2E`,
          );
          const data = await res.json();
          const components = data.results?.[0]?.address_components || [];
          // console.log("data", data);

          finalLocation = {
            latitude: loc.latitude,
            longitude: loc.longitude,
            city:
              components.find((c) => c.types.includes("locality"))?.long_name ||
              components.find((c) => c.types.includes("sublocality"))
                ?.long_name ||
              null,
            country:
              components.find((c) => c.types.includes("country"))?.long_name ||
              null,
          };
        } catch (e) {
          console.error("Reverse geocoding failed", e);
        }
      }

      // Fetch user + card logic (unchanged)
      const userDoc = await getDoc(doc(db, "users", childId));
      if (!userDoc.exists()) continue;

      let displayName = userDoc.data()?.displayName || "";
      let cardType = false;
      let profilePhoto = "/lovable-uploads/logo_color_correct.png";

      const q = query(
        collection(db, "cards"),
        where("uid", "==", childId),
        limit(1),
      );
      const cardsSnap = await getDocs(q);

      if (!cardsSnap.empty) {
        const cardData = cardsSnap.docs[0].data();

        cardType = cardData?.metadata?.isPublic ?? false;

        profilePhoto =
          cardType !== true
            ? "/lovable-uploads/private_card_logo.png"
            : cardData?.profilePhoto ||
              "/lovable-uploads/logo_color_correct.png";

        displayName = cardType !== true ? "Private" : displayName;
      }

      // console.log("finalLocation",finalLocation);

      referralArray.push({
        type: "child",
        userId: childId,
        cardType,
        name: displayName,
        location: finalLocation,
        avatar: profilePhoto,
      });
    }
    return referralArray;
  };

  // const buildReferralArray = async () => {
  //   const userRef = doc(db, "referrals", user.uid);
  //   const userSnap = await getDoc(userRef);
  //   const referralArray: any[] = [];

  //   if (!userSnap.exists()) return referralArray;

  //   const userData = userSnap.data();
  //   const childrenIP = userData?.childrenIP || [];
  //   const children = userData?.children || [];
  //   const browserLocations = userData?.childrenLocation || [];

  //   for (let index = 0; index < childrenIP.length; index++) {
  //     const ip = childrenIP[index];
  //     const childId = children[index];
  //     const browserLoc = browserLocations?.[index];

  //     if (!ip || !childId) continue;

  //     // --------------------------
  //     // 1️⃣ Browser Location → Reverse Geocoding
  //     // --------------------------
  //     let formattedBrowserLoc: any = null;

  //     if (browserLoc?.latitude && browserLoc?.longitude) {
  //       try {
  //         const res = await fetch(
  //           `https://maps.googleapis.com/maps/api/geocode/json?latlng=${browserLoc.latitude},${browserLoc.longitude}&key=AIzaSyBcZaByAZLe7qQZAYhKWtc2O9Bn22PAD2E`
  //         );

  //         const data = await res.json();
  //         const components = data.results?.[0]?.address_components || [];

  //         const city =
  //           components.find((c) => c.types.includes("locality"))?.long_name ||
  //           components.find((c) => c.types.includes("sublocality"))
  //             ?.long_name ||
  //           null;

  //         const country =
  //           components.find((c) => c.types.includes("country"))?.long_name ||
  //           null;

  //         formattedBrowserLoc = {
  //           latitude: browserLoc.latitude,
  //           longitude: browserLoc.longitude,
  //           city,
  //           country,
  //         };
  //       } catch (e) {
  //         console.error("Reverse geocoding failed:", e);
  //       }
  //     }

  //     // --------------------------
  //     // 2️⃣ IP Location → Fallback
  //     // --------------------------
  //     let locationFinal = formattedBrowserLoc;

  //     if (!locationFinal) {
  //       // Browser location missing → use IP location
  //       try {
  //         const ipLocation = await getLocationFromIP(ip);
  //         locationFinal = ipLocation;
  //       } catch (e) {
  //         console.error("IP Location fetch failed:", e);
  //         locationFinal = null;
  //       }
  //     }

  //     // --------------------------
  //     // 3️⃣ Fetch Child User Info
  //     // --------------------------
  //     const userDoc = await getDoc(doc(db, "users", childId));
  //     if (!userDoc.exists()) continue;

  //     let displayName = userDoc.data()?.displayName || "";
  //     let profilePhoto = "/lovable-uploads/logo_color_correct.png";
  //     let cardType = false;

  //     // --------------------------
  //     // 4️⃣ Card Details
  //     // --------------------------
  //     const q = query(
  //       collection(db, "cards"),
  //       where("uid", "==", childId),
  //       limit(1)
  //     );
  //     const cardsSnap = await getDocs(q);

  //     if (!cardsSnap.empty) {
  //       const cardData = cardsSnap.docs[0].data();
  //       cardType = cardData?.metadata?.isPublic ?? false;

  //       profilePhoto =
  //         cardType !== true
  //           ? "/lovable-uploads/private_card_logo.png"
  //           : cardData?.profilePhoto ||
  //             "/lovable-uploads/logo_color_correct.png";

  //       displayName = cardType !== true ? "Private" : displayName;
  //     }

  //     // --------------------------
  //     // 5️⃣ Push Final Result
  //     // --------------------------
  //     referralArray.push({
  //       type: "child",
  //       userId: childId,
  //       cardType,
  //       name: displayName,
  //       location: locationFinal,
  //       avatar: profilePhoto,
  //     });
  //   }

  //   console.log("referralArray", referralArray);

  //   return referralArray;
  // };

  // const buildReferralArray = async () => {
  //   const userRef = doc(db, "referrals", user.uid);
  //   const userSnap = await getDoc(userRef);
  //   const referralArray: any[] = [];

  //   if (userSnap.exists()) {
  //     const userData = userSnap.data();
  //     const childrenIP = userData?.childrenIP;
  //     const children = userData.children || [];

  //     if (childrenIP) {
  //       let ch = 0;

  //       const browserloc = userData?.childrenLocation;

  //       for (const ip of childrenIP) {
  //         const loc = await getLocationFromIP(ip);
  //         const res = await fetch(
  //           `https://maps.googleapis.com/maps/api/geocode/json?latlng=${browserloc[ch].latitude},${browserloc[ch].longitude}&key=AIzaSyBcZaByAZLe7qQZAYhKWtc2O9Bn22PAD2E`
  //         );
  //         const data = await res.json();
  //         console.log("data", data);

  //         // Get address components
  //         const components = data.results?.[0]?.address_components || [];

  //         const city =
  //           components.find((c) => c.types.includes("locality"))?.long_name ||
  //           components.find((c) => c.types.includes("sublocality"))
  //             ?.long_name ||
  //           null;

  //         const state =
  //           components.find((c) =>
  //             c.types.includes("administrative_area_level_1")
  //           )?.long_name || null;

  //         const country =
  //           components.find((c) => c.types.includes("country"))?.long_name ||
  //           null;

  //         const formattedBrowserLoc = browserloc.length
  //           ? {
  //               latitude: browserloc[ch].latitude,
  //               longitude: browserloc[ch].longitude,
  //               city: city,
  //               country: country,
  //             }
  //           : null;
  //         console.log(browserloc);

  //         if (loc) {
  //           const usersGpQuery = doc(db, "users", children[ch]);
  //           const UserGpSnap = await getDoc(usersGpQuery);

  //           if (UserGpSnap.exists()) {
  //             const q = query(
  //               collection(db, "cards"),
  //               where("uid", "==", children[ch]),
  //               limit(1)
  //             );

  //             const snapshot1 = await getDocs(q);

  //             let profilePhoto = "/lovable-uploads/logo_color_correct.png";
  //             let cardType = false; // default: no card / private
  //             let displayName = "";

  //             const userData1 = UserGpSnap.data();
  //             displayName = userData1?.displayName ?? "";

  //             if (!snapshot1.empty) {
  //               const cardData1 = snapshot1.docs[0].data();

  //               cardType = cardData1?.metadata?.isPublic ?? false;

  //               profilePhoto =
  //                 cardType !== true
  //                   ? "/lovable-uploads/private_card_logo.png"
  //                   : cardData1?.profilePhoto ||
  //                     "/lovable-uploads/logo_color_correct.png";

  //               displayName = cardType !== true ? "Private" : displayName;
  //             }
  //             console.log("browser", browserloc);
  //             console.log("Loca", loc);
  //             // ALWAYS PUSH — even if no card exists
  //             referralArray.push({
  //               type: "child",
  //               userId: children[ch],
  //               cardType,
  //               name: displayName,
  //               location: { ...formattedBrowserLoc },
  //               avatar:
  //                 profilePhoto ?? "/lovable-uploads/logo_color_correct.png",
  //             });
  //           }
  //         }
  //         ch++;
  //       }
  //     }
  //   }

  //   return referralArray;
  // };
  // const buildReferralArray = async () => {
  //   const userRef = doc(db, "referrals", user.uid);
  //   const userSnap = await getDoc(userRef);
  //   const referralArray: any[] = [];

  //   if (!userSnap.exists()) return referralArray;

  //   const userData = userSnap.data();
  //   const childrenIP: string[] = userData?.childrenIP || [];
  //   const children: string[] = userData?.children || [];
  //   const childrenLocation: any[] = userData?.childrenLocation || [];

  //   const total = childrenIP.length;
  //   const locCount = childrenLocation.length;

  //   // ---------------------------
  //   // 1️⃣ Build aligned location array
  //   // ---------------------------
  //   const normalizedLocations: any[] = Array(total).fill(null);

  //   // SHIFT locations to the end
  //   // example: 9 IPs, 1 location → location goes to index 8
  //   for (let i = 0; i < locCount; i++) {
  //     const targetIndex = total - locCount + i;
  //     normalizedLocations[targetIndex] = childrenLocation[i];
  //   }

  //   // ---------------------------
  //   // 2️⃣ Fill missing slots using IP lookup
  //   // ---------------------------
  //   for (let i = 0; i < total; i++) {
  //     if (!normalizedLocations[i]) {
  //       try {
  //         const ipLoc = await getLocationFromIP(childrenIP[i]);
  //         normalizedLocations[i] = ipLoc;
  //       } catch (err) {
  //         console.error("IP lookup failed", err);
  //         normalizedLocations[i] = null;
  //       }
  //     }
  //   }

  //   // ---------------------------
  //   // 3️⃣ Now loop through all users normally
  //   // ---------------------------
  //   for (let index = 0; index < total; index++) {
  //     const ip = childrenIP[index];
  //     const childId = children[index];
  //     const loc = normalizedLocations[index];

  //     if (!ip || !childId) continue;

  //     let finalLocation = loc;

  //     // Reverse geocode only for browserLatLng sources (not IP)
  //     if (loc?.latitude && loc?.longitude && loc?.source !== "ip") {
  //       try {
  //         const res = await fetch(
  //           `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.latitude},${loc.longitude}&key=AIzaSyBcZaByAZLe7qQZAYhKWtc2O9Bn22PAD2E`
  //         );

  //         const data = await res.json();
  //         const components = data.results?.[0]?.address_components || [];

  //         const city =
  //           components.find((c) => c.types.includes("locality"))?.long_name ||
  //           components.find((c) => c.types.includes("sublocality"))
  //             ?.long_name ||
  //           null;

  //         const country =
  //           components.find((c) => c.types.includes("country"))?.long_name ||
  //           null;

  //         finalLocation = {
  //           latitude: loc.latitude,
  //           longitude: loc.longitude,
  //           city,
  //           country,
  //         };
  //       } catch (e) {
  //         console.error("Reverse geocoding failed:", e);
  //       }
  //     }

  //     // Fetch child user info
  //     const userDoc = await getDoc(doc(db, "users", childId));
  //     if (!userDoc.exists()) continue;

  //     let displayName = userDoc.data()?.displayName || "";
  //     let profilePhoto = "/lovable-uploads/logo_color_correct.png";
  //     let cardType = false;

  //     // Card check
  //     const q = query(
  //       collection(db, "cards"),
  //       where("uid", "==", childId),
  //       limit(1)
  //     );
  //     const cardsSnap = await getDocs(q);

  //     if (!cardsSnap.empty) {
  //       const cardData = cardsSnap.docs[0].data();
  //       cardType = cardData?.metadata?.isPublic ?? false;

  //       profilePhoto =
  //         cardType !== true
  //           ? "/lovable-uploads/private_card_logo.png"
  //           : cardData?.profilePhoto ||
  //             "/lovable-uploads/logo_color_correct.png";

  //       displayName = cardType !== true ? "Private" : displayName;
  //     }

  //     referralArray.push({
  //       type: "child",
  //       userId: childId,
  //       cardType,
  //       name: displayName,
  //       location: finalLocation,
  //       avatar: profilePhoto,
  //     });
  //   }

  //   return referralArray;
  // };

  async function countChildren(userId: string) {
    const userRef = doc(db, "referrals", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const children = userData.children || [];
      return children.length;
    }
    return 0;
  }

  const fetchSettings = async () => {
    try {
      setLoading(true); // start loader
      const userId = user?.uid;
      if (!userId) return;

      // --- Settings: MNR ---
      const settingsRef = doc(db, "users", userId);
      const settingsSnap = await getDoc(settingsRef);
      if (!settingsSnap.exists()) return;
      const settings = settingsSnap.data();

      // --- Earnings ---
      const earningRef = doc(db, "users", userId);
      const earningSnap = await getDoc(earningRef);
      if (!earningSnap.exists()) return;
      const earningData = earningSnap.data();

      setchildEarnings(earningData.userChildEarning);
      setRgrandchildEarnings(earningData.userGrandChildEarning);

      const MNR = settings.l2Child;
      setMNR?.(MNR);

      const l4Multiplier = settings.l4Multiplier;
      const l5Multiplier = settings.l5Multiplier;
      const l6Multiplier = settings.l6Multiplier;

      setL4Multiplie(l4Multiplier);
      setL5Multiplier(l5Multiplier);
      setL6Multiplier(l6Multiplier);

      // --- User data ---
      const userRef = doc(db, "referrals", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      const userData = userSnap.data();

      const children = userData.children || [];
      const RCA = children.length;
      //  console.log("Direct children (RCA):", RCA);

      let childrenReachedLevel2 = 0;
      let totalGrandChildrenFromLevel2 = 0;
      let totalGrandChildrenAll = 0;
      let level3Count = 0;

      const nonLevel2Deficits: number[] = [];

      // --- Check children ---
      for (const childId of children) {
        const childRef = doc(db, "referrals", childId);
        const childSnap = await getDoc(childRef);

        if (!childSnap.exists()) {
          //console.log(`Child ID ${childId} not found`);
          continue;
        }

        const childData = childSnap.data();
        const childChildren = childData.children || [];
        const childRCA = childChildren.length;
        const childLevel = Number(childData.children.length) || 0;
        const grandChildLevel = Number(childData.grandchildren.length) || 0;

        totalGrandChildrenAll += childRCA;

        if (childRCA >= MNR || childLevel >= 2) {
          childrenReachedLevel2++;
          totalGrandChildrenFromLevel2 += childRCA;
        } else {
          const deficit = Math.max(0, MNR - childRCA);
          nonLevel2Deficits.push(deficit);
        }

        if (childLevel >= MNR) level3Count++;
        //  console.log("childData==>", childData.Level);
      }

      // --- Correct remaining grandchildren calculation ---
      let remainingGrandChildrenCorrect = 0;
      for (const childId of children) {
        const childRef = doc(db, "referrals", childId);
        const childSnap = await getDoc(childRef);
        if (!childSnap.exists()) {
          remainingGrandChildrenCorrect += MNR; // treat missing as 0 children
          continue;
        }

        const childData = childSnap.data();
        const childChildrenCount = (childData.children || []).length;

        // Deficit per child = required - actual (min 0)
        const deficit = Math.max(0, MNR - childChildrenCount);
        remainingGrandChildrenCorrect += deficit;
      }

      // console.log("Total actual grandchildren:", totalGrandChildrenAll);
      // console.log(
      //   "Remaining grandchildren required:",
      //   remainingGrandChildrenCorrect
      // );

      const missingLevel2Children = Math.max(0, MNR - childrenReachedLevel2);
      nonLevel2Deficits.sort((a, b) => a - b);

      let remainingPoints = missingLevel2Children;

      let userLevelStr = 1;
      let memberLevel = "Starter";
      let requiredChildrenToNext = 0;
      let requiredGrandChildrenToNext = 0;
      let nextLevelName = "";

      // Get current date
      const today = new Date().toISOString();
      if (!userData.LevelsUpdate) {
        userData.LevelsUpdate = {};
      }

      // Level 1 → Starter
      if (RCA < MNR) {
        userLevelStr = 1;
        memberLevel = "Starter";
        requiredChildrenToNext = MNR - RCA;
        requiredGrandChildrenToNext = 0;
        nextLevelName = "Level-Up";
        remainingPoints = 0;
        await updateDoc(userRef, { Level: 1 });

        // Only set date if not already exists
        if (!userData.LevelsUpdate[1]) {
          await updateDoc(userRef, { [`LevelsUpdate.1`]: today });
        }
      }
      // Level 2 → Level-Up
      // else if (childrenReachedLevel2 < MNR) {
      else if (RCA >= MNR && level3Count < settings.l3LeveledUps) {
        userLevelStr = 2;
        memberLevel = "Level-Up";
        requiredChildrenToNext = Math.max(0, MNR - RCA);
        requiredGrandChildrenToNext = remainingGrandChildrenCorrect;
        nextLevelName = "Bronze";
        await updateDoc(userRef, { Level: 2 });
        if (!userData.LevelsUpdate[2]) {
          await updateDoc(userRef, { [`LevelsUpdate.2`]: today });
        }
      }
      // Level 3 → Bronze
      // else if (
      //   childrenReachedLevel2 >= MNR &&
      //   totalGrandChildrenFromLevel2 >= MNR * MNR &&
      //   level3Count <= MNR * MNR
      // ) {
      else if (
        level3Count >= MNR &&
        level3Count < settings.l4Multiplier * settings.l3LeveledUps
      ) {
        userLevelStr = 3;
        memberLevel = "Bronze";
        requiredChildrenToNext = Math.max(0, 2 * MNR - RCA);
        requiredGrandChildrenToNext =
          settings.l4Multiplier * RCA - totalGrandChildrenFromLevel2;
        nextLevelName = "Silver";
        await updateDoc(userRef, { Level: 3 });
        if (!userData.LevelsUpdate[3]) {
          await updateDoc(userRef, { [`LevelsUpdate.3`]: today });
        }
      }
      // Level 4 → Silver Earner
      // else if (RCA <= settings.l4Multiplier * MNR) {
      //   userLevelStr = 3;
      //   memberLevel = "Bronze";
      //   requiredChildrenToNext = Math.max(0, settings.l4Multiplier * MNR - RCA);
      //   requiredGrandChildrenToNext =
      //     settings.l4Multiplier * RCA - totalGrandChildrenFromLevel2;
      //   nextLevelName = "Silver";
      //   await updateDoc(userRef, { Level: 3 });

      //   if (!userData.LevelsUpdate[4]) {
      //     await updateDoc(userRef, { [`LevelsUpdate.3`]: today });
      //   }
      // }
      // Level 5 → Gold Earner
      // else if (
      //   childrenReachedLevel2 >= settings.l4Multiplier &&
      //   totalGrandChildrenFromLevel2 >=
      //     settings.l3Total * settings.l4Multiplier &&
      //   level3Count <= settings.l3LeveledUps * MNR
      // ) {
      else if (
        level3Count >= settings.l4Multiplier * settings.l3LeveledUps &&
        level3Count < settings.l5Multiplier * settings.l3LeveledUps
      ) {
        userLevelStr = 4;
        memberLevel = "Silver";
        requiredChildrenToNext = Math.max(0, settings.l5Multiplier * MNR - RCA);
        requiredGrandChildrenToNext =
          settings.l5Multiplier * RCA - totalGrandChildrenFromLevel2;
        nextLevelName = "Gold";
        await updateDoc(userRef, { Level: 4 });
        if (!userData.LevelsUpdate[5]) {
          await updateDoc(userRef, { [`LevelsUpdate.4`]: today });
        }
      }
      // else if (RCA <= settings.l5Multiplier * MNR) {
      //   userLevelStr = 4;
      //   memberLevel = "Silver";
      //   requiredChildrenToNext = Math.max(0, settings.l4Multiplier * MNR - RCA);
      //   requiredGrandChildrenToNext =
      //     settings.l4Multiplier * RCA - totalGrandChildrenFromLevel2;
      //   nextLevelName = "Gold";
      //   await updateDoc(userRef, { Level: 3 });

      //   if (!userData.LevelsUpdate[4]) {
      //     await updateDoc(userRef, { [`LevelsUpdate.4`]: today });
      //   }
      // }
      // Level 6 → Platinum Earner
      // else if (
      //   childrenReachedLevel2 >= settings.l5Multiplier &&
      //   totalGrandChildrenFromLevel2 >=
      //     settings.l3Total * settings.l5Multiplier &&
      //   level3Count <= settings.l3LeveledUps * settings.l5Multiplier
      // ) {
      else if (
        level3Count >= settings.l5Multiplier * settings.l3LeveledUps &&
        level3Count < settings.l6Multiplier * settings.l3LeveledUps
      ) {
        userLevelStr = 5;
        memberLevel = "Gold";
        // memberLevel = memberLevel + level3Count;
        requiredChildrenToNext = Math.max(0, settings.l6Multiplier * MNR - RCA);
        requiredGrandChildrenToNext =
          settings.l6Multiplier * RCA - totalGrandChildrenFromLevel2;
        nextLevelName = "Platinum";
        await updateDoc(userRef, { Level: 5 });
        if (!userData.LevelsUpdate[6]) {
          await updateDoc(userRef, { [`LevelsUpdate.5`]: today });
        }
      }
      // else if (RCA <= settings.l6Multiplier * MNR) {
      //   userLevelStr = 5;
      //   memberLevel = "Gold";
      //   requiredChildrenToNext = Math.max(0, settings.l4Multiplier * MNR - RCA);
      //   requiredGrandChildrenToNext =
      //     settings.l4Multiplier * RCA - totalGrandChildrenFromLevel2;
      //   nextLevelName = "Platinum";
      //   await updateDoc(userRef, { Level: 3 });

      //   if (!userData.LevelsUpdate[4]) {
      //     await updateDoc(userRef, { [`LevelsUpdate.5`]: today });
      //   }
      // }
      // Max Level
      // else if (
      //   childrenReachedLevel2 >= settings.l6Multiplier &&
      //   totalGrandChildrenFromLevel2 >=
      //     settings.l3Total * settings.l6Multiplier &&
      //   level3Count <= settings.l5Total
      // ) {
      else if (level3Count >= settings.l6Multiplier * settings.l3LeveledUps) {
        userLevelStr = 6;
        memberLevel = "Platinum";
        // memberLevel = memberLevel + Number(Number(settings.l3LeveledUps) * MNR);
        requiredChildrenToNext = 0;
        requiredGrandChildrenToNext = 0;
        nextLevelName = "Max Level";
        await updateDoc(userRef, { Level: 6 });
        if (!userData.LevelsUpdate[6]) {
          await updateDoc(userRef, { [`LevelsUpdate.6`]: today });
        }
      } else {
        userLevelStr = 6;
        memberLevel = "Platinum";
        // memberLevel = memberLevel + Number(Number(settings.l3LeveledUps) * MNR);
        requiredChildrenToNext = 0;
        requiredGrandChildrenToNext = 0;
        nextLevelName = "Max Level";
        await updateDoc(userRef, { Level: 6 });
        if (!userData.LevelsUpdate[6]) {
          await updateDoc(userRef, { [`LevelsUpdate.6`]: today });
        }
      }

      //store level name and level number to firebase
      await updateDoc(userRef, {
        memberLevel: memberLevel,
        badgeLevel: userLevelStr,
      });

      // --- Logs ---
      // console.log("=== LEVEL RESULT ===");
      // console.log("User Level:", userLevelStr);
      // console.log("Member Level:", memberLevel);
      // console.log("Next Level:", nextLevelName);
      // console.log("Direct Children (RCA):", RCA);
      // console.log("Level-2 Children:", childrenReachedLevel2);
      // console.log("Total Grandchildren:", totalGrandChildrenAll);
      // console.log(
      //   "Grandchildren from Level-2:",
      //   totalGrandChildrenFromLevel2
      // );
      // console.log("Remaining Children:", requiredChildrenToNext);
      // console.log("Remaining Grandchildren:", requiredGrandChildrenToNext);

      // --- Set state ---
      setLevel?.(level3Count);
      const averageForLevelUp =
        level3Count > 0 ? Number(parentCount / level3Count) : 0;
      setAverageForLevelUp(averageForLevelUp);
      setMemberLevel?.(memberLevel);
      setCurrentChildren?.(RCA);
      setCurrentGrandChildren?.(totalGrandChildrenAll);
      setRemainingChildren?.(requiredChildrenToNext);
      // setRemainingGrandChildren?.(remainingGrandChildrenCorrect);
      setNextLevelNeed?.(remainingPoints);

      const settingRef = doc(db, "users", userId);
      const settingSnap = await getDoc(settingRef);
      if (!settingSnap.exists()) return;
      const setting = settingSnap.data();
      setRemainingGrandChildren?.(setting.l3Total);
      // if (userLevelStr <= 2) {
      //   setRemainingGrandChildren?.(0);
      // } else if (userLevelStr === 3) {
      //   setRemainingGrandChildren?.(setting.l3Total);
      // }
      // else if (userLevelStr == 4) {
      //   setRemainingGrandChildren?.(setting.l4Total);
      // } else if (userLevelStr === 5) {
      //   setRemainingGrandChildren?.(setting.l5Total);
      // } else if (userLevelStr === 6) {
      //   setRemainingGrandChildren?.(setting.l6Total);
      // }
      setLoading(false); // stop loader after success or error
    } catch (err) {
      console.error("Error fetching referral settings:", err);
    }
  };

  useEffect(() => {
    async function fetchCounts() {
      const userId = user?.uid;
      const parents = await countParents(userId);
      const children = await countChildren(userId);
      setParentCount(parents);
      setChildCount(children);
    }

    if (user && !hasFetchedSettings) {
      setIsLoading(true);
      fetchCounts();

      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchIp = async () => {
      const mapData = await buildReferralArray();
      setReferalMap(mapData);
      const averageForChild = Number(parentCount / childCount) ?? 0;
      setAverageForChild(averageForChild);
    };
    if (user) fetchSettings().then(() => setHasFetchedSettings(true));
    if (childCount > 0) {
      fetchIp();
    }
    // if (user) {
    //   setIsLoading(true);
    //   fetchIp();
    //   setIsLoading(false);
    // }
  }, [window.location, refBadgesLevel, parentCount, childCount]);

  const referrals = [
    {
      name: "Sarah Johnson",
      email: "sarah@example.com",
      level: "Level-2",
      referrals: 125,
      dateJoined: "May 15, 2025",
      avatar: "/lovable-uploads/logo_color_correct.png",
      location: {
        latitude: 40.7128,
        longitude: -74.006,
        city: "New York",
        country: "USA",
      },
    },
    {
      name: "Michael Chen",
      email: "michael@example.com",
      level: "Level-1",
      referrals: 45,
      dateJoined: "June 2, 2025",
      avatar: "/lovable-uploads/logo_color_correct.png",
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        city: "San Francisco",
        country: "USA",
      },
    },
    {
      name: "Emma Wilson",
      email: "emma@example.com",
      level: "Level-2",
      referrals: 156,
      dateJoined: "April 20, 2025",
      avatar:
        "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=150&h=150&fit=crop&crop=face",
      location: {
        latitude: 51.5074,
        longitude: -0.1278,
        city: "London",
        country: "UK",
      },
    },
  ];

  const stepCards = [
    {
      step: 1,
      title: "Share our cards",
      description: `1st, give-a-way referrer ${
        MNR * 1.5
      } + free business cards`,
    },
    {
      step: 2,
      title: "Tell others to share our cards too",
      description: `2nd, get ${MNR} of your recruits to referrer ${MNR}+ cards`,
    },
    {
      step: 3,
      title: "Level-up your account",
      description: `You = Level-2 when you recruit referrer ${MNR}+ users`,
    },
    {
      step: 4,
      title: "Your recruits level-up their account",
      description: `You = Level-3 when ${MNR} of your recruits = Level-2`,
    },
    {
      step: 5,
      title: "Earner status",
      description: "Level-3 = Earner, you can earn $2k-$10k/mo",
    },
  ];

  const metrics = [
    {
      title: "Child Referrals",
      value: childCount,
      required: MNR,
      average: `Avg. ${averageForChild.toFixed(2)} GC per Child`,
    },

    //required: nextLevelNeed
    {
      title: "Level-Up Referrals",
      value: level,
      required: MNR,
      average: `Avg. ${averageForLevelUp.toFixed(2)} GC per Level-Up`,
    },
    {
      title: "Grand-children Referrals",
      value: parentCount,
      required: 10000,
      average: `See Income Calculater for actual numbers`,
    },
  ];

  const targetLevels = [
    {
      level: "Level-1:",
      description: `< [${MNR}] referrals`,
      status: "Starter",
      progress: childEarnings,
      monetized: "Not Monetized",
      color: "bg-gray-400",
    },
    {
      level: "Level-2:",
      description: `≥ [${MNR}] Child referrals`,
      status: "Level-Up",
      progress: childEarnings,
      monetized: "Not Monetized",
      color: "bg-blue-400",
    },
    {
      level: "Level-3:",
      description: `≥ [${MNR}] of your Child referrals are Level 2`,
      status: "Bronze Earner",
      progress: grandchildEarnings,
      monetized: "Monetized",
      color: "bg-yellow-400",
    },
    {
      level: "Level-4:",
      description: `≥ L3 x [${l4Multiplier}]`,
      status: "Silver Earner",
      progress: grandchildEarnings,
      monetized: "Monetized",
      color: "bg-green-400",
    },
    {
      level: "Level-5:",
      description: `≥ L3 x [${l5Multiplier}]`,
      status: "Gold Earner",
      progress: grandchildEarnings,
      monetized: "Monetized",
      color: "bg-purple-400",
    },
    {
      level: "Level-6:",
      description: `≥ L3 x [${l6Multiplier}]`,
      status: "Platinum Earner",
      progress: grandchildEarnings,
      monetized: "Monetized",
      color: "bg-pink-400",
    },
  ];

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      showToast("Referral link copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const [enrichedReferrals, setEnrichedReferrals] = useState([]);

  const [grandChildenrichedReferrals, setGrandChildEnrichedReferrals] =
    useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isGrandChildModalOpen, setIsGrandChildModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  const totalPages = Math.ceil(enrichedReferrals.length / itemsPerPage);

  // Pagination logic
  const paginatedData = enrichedReferrals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const grandChildpaginatedData = grandChildenrichedReferrals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const firstTen = enrichedReferrals.slice(0, 10);

  /* ------------------------------------------------------------------
   * PAID GRANDCHILD ACCESS  (client points b, b1-b4)
   * ------------------------------------------------------------------
   * A paid user may open the card of the first GRANDCHILD_VIEW_LIMIT
   * grandchildren only. Clicking any beyond that shows the notice below
   * pointing them at Export CSV, which is a separate one-time purchase
   * priced at settings/LeadExportFee.perLeadFee x number of leads and
   * valid for accessDays afterwards.
   * ------------------------------------------------------------------ */
  const [showLeadLimitNotice, setShowLeadLimitNotice] = useState(false);
  const [showLeadPurchase, setShowLeadPurchase] = useState(false);
  const [leadExportSettings, setLeadExportSettings] = useState<{
    perLeadFee: number;
    accessDays: number;
  }>({ perLeadFee: 0.5, accessDays: 7 });
  const [activeLeadExport, setActiveLeadExport] = useState<any>(null);
  const [leadExportHistory, setLeadExportHistory] = useState<any[]>([]);

  const leadCount = grandChildenrichedReferrals.length;
  const leadExportTotal = leadCount * (leadExportSettings.perLeadFee || 0);

  const getLeadExportExpiryDate = (record: any): Date | null => {
    if (!record?.expiresAt) return null;
    const raw = record.expiresAt;
    if (raw.toDate) return raw.toDate();
    if (raw.seconds) return new Date(raw.seconds * 1000);
    if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
    if (typeof raw === "string" || typeof raw === "number") {
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  const activeExportExpiry = useMemo(
    () => getLeadExportExpiryDate(activeLeadExport),
    [activeLeadExport],
  );

  // An unexpired purchase lets the user re-download without paying again.
  const hasActiveLeadExport = useMemo(() => {
    return !!activeExportExpiry && activeExportExpiry.getTime() > Date.now();
  }, [activeExportExpiry]);

  const remainingAccessLabel = useMemo(() => {
    if (!activeExportExpiry) return null;
    const diffMs = activeExportExpiry.getTime() - Date.now();
    if (diffMs <= 0) return "Access expired";
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} left to download`;
    }
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} left to download`;
  }, [activeExportExpiry]);

  // Admin-set price + the user's purchase history for this list.
  const loadLeadExportState = async () => {
    try {
      const settingsSnap = await getDoc(doc(db, "settings", "LeadExportFee"));
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        const fee = Number(data.perLeadFee);
        setLeadExportSettings({
          perLeadFee: fee > 0 ? fee : 0.5,
          accessDays: Number(data.accessDays) || 7,
        });
      }

      if (!user?.uid) return;

      // Deliberately no orderBy: combining it with the uid filter needs a
      // composite index, and this project does not manage indexes as code -
      // it would be a manual console step per environment. A user has a
      // handful of purchases, so sorting here costs nothing.
      const exportsSnap = await getDocs(
        query(collection(db, "leadExports"), where("uid", "==", user.uid)),
      );
      const rows = exportsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as any)
        .sort((a, b) => {
          const aTime = getLeadExportExpiryDate(a)?.getTime() ?? 0;
          const bTime = getLeadExportExpiryDate(b)?.getTime() ?? 0;
          return bTime - aTime;
        });

      setLeadExportHistory(rows);
      // Rows are newest-first, so the first unexpired one is the live grant.
      const now = Date.now();
      const active = rows.find((r: any) => {
        const exp = getLeadExportExpiryDate(r);
        return exp && exp.getTime() > now;
      });
      setActiveLeadExport(active || null);
    } catch (error) {
      console.error("Error loading lead export state:", error);
    }
  };

  useEffect(() => {
    loadLeadExportState();
  }, [user?.uid]);

  /**
   * Records a completed purchase and opens the access window.
   * Called only after Stripe confirms payment.
   */
  const recordLeadExportPurchase = async (paymentIntentId: string) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (leadExportSettings.accessDays || 7));

    await addDoc(collection(db, "leadExports"), {
      uid: user?.uid,
      email: user?.email ?? null,
      leadCount,
      perLeadFee: leadExportSettings.perLeadFee,
      amount: leadExportTotal,
      currency: "usd",
      paymentIntentId,
      paidAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    });

    await loadLeadExportState();
  };

  useEffect(() => {
    const fetchLatestCards = async () => {
      const results = await Promise.all(
        sortedReferrals?.map(async (referral) => {
          const q = query(
            collection(db, "cards"),
            where("uid", "==", referral.userId),
            limit(1),
          );
          const referalRef = doc(db, "referrals", referral.userId);
          const refSnap = await getDoc(referalRef);

          let badgeLevel = 1;
          let memberLevel = "Starter";
          if (refSnap.exists()) {
            const refData = refSnap.data();
            if (refData.badgeLevel) {
              badgeLevel = refData.badgeLevel ?? 1;
            }
            if (refData.memberLevel) {
              memberLevel = refData.memberLevel ?? "Starter";
            }
          }
          const snapshot = await getDocs(q);
          if (snapshot.empty)
            return { ...referral, badgeLevel, memberLevel, isPublic: false };
          const cardData = snapshot.docs[0].data();
          const latestCardId = cardData?.urlName || null;
          const profilePhoto = cardData?.profilePhoto || null;
          const firstName = cardData?.profile?.firstName || null;
          const lastName = cardData?.profile?.lastName || null;
          const companyName = cardData?.profile?.company || null;

          const companySlogan = cardData?.profile?.companySlogan || null;
          const department = cardData?.profile?.department || null;
          const title = cardData?.profile?.title || null;

          const email = cardData?.business?.email || null;
          const phoneNumber = cardData?.business?.phone || null;
          const website = cardData?.business?.website || null;
          const street = cardData?.business?.address.street || null;
          const city = cardData?.business?.address.city || null;
          const state = cardData?.business?.address.state || null;
          const country = cardData?.business?.address.country || null;
          const zip = cardData?.business?.address.zip || null;
          const isPublic = cardData?.metadata?.isPublic != true ? true : false;
          const cardName = cardData?.id || null;

          return {
            ...referral,
            latestCardId,
            profilePhoto,
            firstName,
            lastName,
            companyName,
            companySlogan,
            department,
            title,
            email,
            phoneNumber,
            website,
            street,
            city,
            state,
            country,
            zip,
            cardName,
            badgeLevel,
            isPublic,
            memberLevel,
          };
        }),
      );
      //console.log("results", results);
      setEnrichedReferrals(results);
    };

    if (sortedReferrals.length > 0) fetchLatestCards();
  }, [sortedReferrals]);
  useEffect(() => {
    const fetchGrandChildrenLatestCards = async () => {
      if (!user?.uid) return;

      const grandChildResults: any[] = [];

      const referralRef = doc(db, "referrals", user.uid);
      const refSnap = await getDoc(referralRef);

      if (!refSnap.exists()) {
        setGrandChildEnrichedReferrals([]);
        return;
      }

      const refData = refSnap.data();

      const badgeLevel = refData?.badgeLevel ?? 1;
      const memberLevel = refData?.memberLevel ?? "Starter";
      const grandChildIds: string[] = refData?.grandchildren || [];

      for (const grandChildId of grandChildIds) {
        const q = query(
          collection(db, "cards"),
          where("uid", "==", grandChildId),
          limit(1),
        );

        const snapshot = await getDocs(q);

        // Defaults per grandchild
        let latestCardId = null;
        let profilePhoto = null;
        let firstName = null;
        let lastName = null;
        let cardName = null;
        let isPublic = false;
        let companyName = false;
        let companySlogan = false;
        let department = false;
        let title = false;
        let email = false;
        let phoneNumber = false;
        let website = false;
        let street = false;
        let city = false;
        let state = false;
        let country = false;
        let zip = false;

        if (!snapshot.empty) {
          const cardData = snapshot.docs[0].data();

          latestCardId = cardData?.urlName ?? null;
          profilePhoto = cardData?.profilePhoto ?? null;
          firstName = cardData?.profile?.firstName ?? null;
          lastName = cardData?.profile?.lastName ?? null;
          cardName = cardData?.id ?? null;
          isPublic = cardData?.metadata?.isPublic ?? false;

          companyName = cardData?.profile?.company || null;

          companySlogan = cardData?.profile?.companySlogan || null;
          department = cardData?.profile?.department || null;
          title = cardData?.profile?.title || null;
          email = cardData?.business?.email || null;
          phoneNumber = cardData?.business?.phone || null;
          website = cardData?.business?.website || null;
          street = cardData?.business?.address.street || null;
          city = cardData?.business?.address.city || null;
          state = cardData?.business?.address.state || null;
          country = cardData?.business?.address.country || null;
          zip = cardData?.business?.address.zip || null;
        }

        // ✅ PUSH PER GRANDCHILD
        grandChildResults.push({
          grandChildId,
          latestCardId,
          profilePhoto,
          firstName,
          lastName,
          companyName,
          companySlogan,
          department,
          title,
          email,
          phoneNumber,
          website,
          street,
          city,
          state,
          country,
          zip,
          cardName,
          badgeLevel,
          memberLevel,
          isPublic,
        });
      }

      //console.log("grandChildResults", grandChildResults);
      setGrandChildEnrichedReferrals(grandChildResults);
    };

    if (grandChildenrichedReferrals.length === 0) {
      fetchGrandChildrenLatestCards();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading....</div>
      </div>
    );
  }

  const levelImages = {
    Starter: "/badges/1-Starter.png",
    "Level-Up": "/badges/2-LevelUp.png",
    Bronze: "/badges/3-BronzeEarner.png",
    Silver: "/badges/4-SilverEarner.png",
    Gold: "/badges/5-GoldEarner.png",
    Platinum: "/badges/6-PlatinumEarner.png",
  };

  const imageSrc = levelImages[memberLevel] || null;

  const exportReferralsToCSV = () => {
    if (!enrichedReferrals.length) return;

    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Company Name",
      "Company Slogan",
      "Department",
      "Title",
      "Phone Number",
      "Website",
      "Address",
      "Card Visibility",
    ];

    const rows = enrichedReferrals.map((r) => {
      const isPrivate = r.isPublic === true;
      //console.log("r", r);
      const address = [r.street, r.city, r.state, r.country, r.zip]
        .filter(Boolean)
        .join(", ");

      return [
        isPrivate
          ? "Private"
          : !r.hasOwnProperty("cardName")
            ? "No Card"
            : r.firstName || "",
        isPrivate
          ? "Private"
          : !r.hasOwnProperty("cardName")
            ? "No Card"
            : r.lastName || "",
        isPrivate
          ? "Private"
          : !r.hasOwnProperty("cardName")
            ? "No Card"
            : r.email || "",
        isPrivate
          ? "Private"
          : !r.hasOwnProperty("cardName")
            ? "No Card"
            : r.companyName || "",
        isPrivate
          ? "Private"
          : !r.hasOwnProperty("cardName")
            ? "No Card"
            : r.companySlogan || "",
        isPrivate
          ? "Private"
          : !r.hasOwnProperty("cardName")
            ? "No Card"
            : r.department || "",
        isPrivate
          ? "Private"
          : !r.hasOwnProperty("cardName")
            ? "No Card"
            : r.title || "",
        isPrivate
          ? "Private"
          : !r.hasOwnProperty("cardName")
            ? "No Card"
            : r.phoneNumber || "",
        isPrivate
          ? "Private"
          : !r.hasOwnProperty("cardName")
            ? "No Card"
            : r.website || "",
        isPrivate
          ? "Private"
          : !r.hasOwnProperty("cardName")
            ? "No Card"
            : address || "",
        isPrivate
          ? "Private"
          : !r.hasOwnProperty("cardName")
            ? "No Card"
            : "Public",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "referrals.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportGrandChildReferralsToCSV = () => {
    if (!grandChildenrichedReferrals.length) return;

    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Company Name",
      "Company Slogan",
      "Department",
      "Title",
      "Phone Number",
      "Website",
      "Address",
      "Card Visibility",
    ];

    const rows = grandChildenrichedReferrals.map((ref) => {
      const isPrivate = ref.isPublic === true;
      console.log("ref", ref);
      const address = [ref.street, ref.city, ref.state, ref.country, ref.zip]
        .filter(Boolean)
        .join(", ");

      return [
        isPrivate
          ? "Private"
          : ref.cardName === null
            ? "No Card"
            : ref.firstName || "",
        isPrivate
          ? "Private"
          : ref.cardName === null
            ? "No Card"
            : ref.lastName || "",
        isPrivate
          ? "Private"
          : ref.cardName === null
            ? "No Card"
            : ref.email || "",
        isPrivate
          ? "Private"
          : ref.cardName === null
            ? "No Card"
            : ref.companyName || "",
        isPrivate
          ? "Private"
          : ref.cardName === null
            ? "No Card"
            : ref.companySlogan || "",
        isPrivate
          ? "Private"
          : ref.cardName === null
            ? "No Card"
            : ref.department || "",
        isPrivate
          ? "Private"
          : ref.cardName === null
            ? "No Card"
            : ref.title || "",
        isPrivate
          ? "Private"
          : ref.cardName === null
            ? "No Card"
            : ref.phoneNumber || "",
        isPrivate
          ? "Private"
          : ref.cardName === null
            ? "No Card"
            : ref.website || "",
        isPrivate
          ? "Private"
          : ref.cardName === null
            ? "No Card"
            : address || "",
        isPrivate ? "Private" : ref.cardName === null ? "No Card" : "Public",
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `grandchild-referrals-${new Date().toISOString().slice(0, 10)}.csv`,
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Alert Card */}

      {refBadgesLevel < 3 && (
        <Alert className="border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle className="text-lg font-semibold">
            Earn Passive Income with SoloBizCards
          </AlertTitle>
          <AlertDescription className="text-base mt-2">
            Earning is easy! Get to Level-3. Refer 100+ = Level-2. When your
            referrals also refer 100+ = Level-3 for you. Start earning at
            Level-3.
          </AlertDescription>
        </Alert>
      )}

      {/* Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {refBadgesLevel < 3 &&
          stepCards.map((step) => (
            <Card
              key={step.step}
              className="relative card-hover cursor-pointer"
            >
              <CardHeader className="pb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <span className="text-blue-600 font-semibold">
                    {step.step}
                  </span>
                </div>
                <CardTitle className="text-sm font-medium">
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Member Level & Metrics - 4 Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="card-hover cursor-pointer">
          <CardHeader>
            <CardTitle className="text-sm font-medium border-b pb-2">
              Your Member Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-6">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{memberLevel}</div>
                  <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors">
                    {imageSrc && (
                      <img
                        src={imageSrc}
                        alt={`${memberLevel} Earner`}
                        className="w-10 h-10 mx-auto rounded-lg"
                      />
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <Badge variant="secondary">{formatted}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {metrics.map((metric, index) => (
          <Card
            key={index}
            className="card-hover cursor-pointer relative overflow-hidden"
          >
            <CardHeader>
              <CardTitle className="text-sm font-medium border-b pb-2">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                // Loader section
                <div className="flex justify-center items-center py-6">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : (
                // Actual metric data
                <div>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold">{metric.value}</div>
                    <div className="text-sm text-muted-foreground">
                      {metric.required} {metric.required >= 0 ? "Required" : ""}
                      <br></br>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground text-end">
                    {metric.average} {Number(metric.average) >= 0 ? "" : ""}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        <YourParent className="h-full" />
        {/* <Card className="card-hover cursor-pointer">
          <CardHeader>
            <CardTitle className="text-sm font-medium border-b pb-2">
              Your Parent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-6">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={() => {
                      if (defaultCard) navigate(`/card/${defaultCard}`);
                    }}
                    disabled={!defaultCard}
                    className={`group ${
                      !defaultCard
                        ? "pointer-events-none cursor-default opacity-50"
                        : ""
                    }`}
                  >
                    <span className="relative flex shrink-0 overflow-hidden rounded-full w-12 h-12 cursor-pointer transition-transform duration-200 group-hover:scale-110">
                      <img
                        style={{ backgroundColor: "#8080805e" }}
                        className="aspect-square h-full w-full"
                        alt="John Anderson"
                        src={
                          cardDetails?.profilePhoto
                            ? cardDetails?.profilePhoto
                            : "/lovable-uploads/logo_color_correct.png"
                        }
                      />
                    </span>
                  </button>

                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {cardDetails
                        ? cardDetails?.profile?.firstName ?? ""
                        : parentInfo?.displayName ?? ""}{" "}
                      {cardDetails
                        ? cardDetails?.profile?.lastName ?? ""
                        : parentInfo?.lastName ?? ""}{" "}
                      {cardDetails?.profile?.company &&
                        `| ${cardDetails?.profile?.company}`}
                    </div>
                  </div>

                  {cardDetails?.appointments?.appointmentType == "booking" &&
                    cardDetails?.appointments?.platform == "calendly" &&
                    cardDetails?.appointments?.calendlyUrl && (
                      <button
                        style={{
                          backgroundColor: cardDetails?.brandColor,
                          color: "#FFFFFF",
                        }}
                        onClick={() => {
                          navigate(cardDetails?.appointments?.calendlyUrl);
                        }}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                      >
                        Schedule Meeting
                      </button>
                    )}

                  {cardDetails?.appointments?.appointmentType == "booking" &&
                    cardDetails?.appointments?.platform == "google" &&
                    cardDetails?.appointments?.googleUrl && (
                      <button
                        style={{
                          backgroundColor: cardDetails?.brandColor,
                          color: "#FFFFFF",
                        }}
                        onClick={() => {
                          navigate(cardDetails?.appointments?.googleUrl);
                        }}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                      >
                        <Calendar size={20} /> Schedule Meeting
                      </button>
                    )}

                  {cardDetails?.appointments?.appointmentType ==
                    "call-to-action" &&
                    cardDetails?.appointments?.ctaUrl && (
                      <button
                        style={{
                          backgroundColor: cardDetails?.brandColor,
                          color: "#FFFFFF",
                        }}
                        onClick={() => {
                          navigate(cardDetails?.appointments?.ctaUrl);
                        }}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                      >
                        <Calendar size={20} />{" "}
                        {cardDetails?.appointments?.ctaLabel}
                      </button>
                    )}

                  {cardDetails?.appointments?.directAds?.image &&
                    cardDetails?.appointments?.appointmentType ==
                      "direct-ads" &&
                    cardDetails?.appointments?.directAds.type != "none" && (
                      <button
                        style={{
                          backgroundColor: cardDetails?.brandColor,
                          color: "#FFFFFF",
                        }}
                        onClick={() => {
                          cardDetails && setShowLightbox(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                      >
                        <Eye size={20} /> View Our{" "}
                        {cardDetails?.appointments?.directAds.type}
                      </button>
                    )}
                </div>

                {cardDetails?.appointments?.directAds?.image &&
                  cardDetails?.appointments?.appointmentType == "direct-ads" &&
                  cardDetails?.appointments?.directAds.type != "none" && (
                    <Lightbox
                      isOpen={showLightbox}
                      onClose={() => setShowLightbox(false)}
                      imageSrc={cardDetails.appointments.directAds.image}
                      title={cardDetails.appointments.directAds.title}
                      description={
                        cardDetails.appointments.directAds.description
                      }
                      price={cardDetails.appointments.directAds.price}
                      url={cardDetails.appointments.directAds.url}
                      theme={cardDetails.brandColor}
                    />
                  )}
              </>
            )}
          </CardContent>
        </Card> */}
      </div>

      {/* Two Column Grid: Referrals List & Referral Link */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Your List of Referrals */}
        <Card className="card-hover cursor-pointer">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-lg font-semibold">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span>List of Child-Referrals</span>

                <span
                  onClick={() => {
                    if (user?.role === "admin" || user?.planType === "paid") {
                      setIsGrandChildModalOpen(true);
                    } else {
                      setShowPermissionModal(true);
                    }
                  }}
                  className="cursor-pointer font-normal text-sm text-blue-600 whitespace-nowrap"
                >
                  [Grandchild-Referrals]
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMapOpen(true)}
                className="w-fit"
              >
                <Users className="h-4 w-4 mr-2" />
                Show Map
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-start gap-4 py-6 px-4 overflow-hidden">
              <div className="max-w-full py-1.5 scrollbar-none w-full">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10 w-full">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                ) : enrichedReferrals.length > 0 ? (
                  <>
                    {/* First row (10 avatars + More button) */}
                    <div className="flex flex-wrap -space-x-4 sm:-space-x-6 items-center gap-y-3 pl-4 sm:pl-6">
                      {firstTen.map((referral, index) => (
                        <Avatar
                          key={index}
                          className="w-12 h-12 sm:w-16 sm:h-16 border-2 sm:border-4 border-background cursor-pointer hover:scale-110 transition-transform duration-200 z-10"
                          style={{
                            zIndex: 10 - index,
                            backgroundColor: "#808080db",
                            boxShadow:
                              "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
                          }}
                          onClick={() => {
                            if (!referral?.latestCardId) {
                              setPrivateCardMessage("No card found!");
                              setPrivateCardSubMessage(
                                "Looks like a card has not been created yet.",
                              );
                              setShowLoginAlert(true);
                            } else if (referral?.isPublic) {
                              setPrivateCardMessage("Private Card");
                              setPrivateCardSubMessage(
                                "Oops! This card is private. You don’t have permission to view it.",
                              );
                              setShowLoginAlert(true);
                            } else {
                              referral?.latestCardId &&
                                navigate("/" + referral?.latestCardId);
                            }
                          }}
                        >
                          <AvatarImage
                            src={
                              referral?.isPublic
                                ? "/lovable-uploads/private_card_logo.png"
                                : referral?.profilePhoto
                                  ? referral.profilePhoto
                                  : "/lovable-uploads/logo_color_correct.png"
                            }
                            alt={referral?.name}
                          />

                          <AvatarFallback>
                            {referral?.name
                              ?.split(" ")
                              ?.map((n) => n[0])
                              ?.join("")}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>

                    {/* Referrals Modal (Updated Design) */}
                    <Dialog
                      open={isModalOpen}
                      onOpenChange={(open) => {
                        setIsModalOpen(open);
                        if (!open) setCurrentPage(1);
                      }}
                    >
                      <DialogPortal>
                        {/* Overlay */}
                        <DialogOverlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

                        {/* Modal Content */}
                        <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bottom-auto z-50 grid gap-4 border bg-background p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out rounded-lg max-w-5xl w-[calc(100%-2rem)] sm:w-full max-h-[85vh] overflow-y-auto">
                          {/* Header */}
                          <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">
                              Your Complete List of Referrals
                            </DialogTitle>
                            <p className="text-base text-muted-foreground mt-2">
                              Total Referrals:{" "}
                              <span className="font-semibold text-foreground">
                                {enrichedReferrals.length}
                              </span>
                            </p>
                            <div className="flex items-center gap-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 px-3.5 py-2 text-xs text-blue-800 dark:text-blue-300 mt-2">
                              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                              <p>
                                <span className="font-semibold text-blue-900 dark:text-blue-100">Note:</span> Only cards listed as public will display information.
                              </p>
                            </div>
                          </DialogHeader>

                          <div className="space-y-4">
                            {/* Referrals Grid */}
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4 py-4 max-h-[50vh] overflow-y-auto">
                              {paginatedData.length > 0 ? (
                                paginatedData.map((referral, index) => (
                                  <div
                                    key={index}
                                    className="flex flex-col items-center gap-2 group cursor-pointer"
                                    // onClick={() =>
                                    //   referral?.latestCardId &&
                                    //   navigate(
                                    //     "/card/" + referral?.latestCardId
                                    //   )
                                    // }
                                    onClick={() => {
                                      if (!referral?.latestCardId) {
                                        setIsModalOpen(false);
                                        setPrivateCardMessage("No card found!");
                                        setPrivateCardSubMessage(
                                          "Looks like a card has not been created yet.",
                                        );
                                        setShowLoginAlert(true);
                                      } else if (referral?.isPublic) {
                                        setIsModalOpen(false);
                                        setPrivateCardMessage("Private Card");
                                        setPrivateCardSubMessage(
                                          "Oops! This card is private. You don’t have permission to view it.",
                                        );
                                        setShowLoginAlert(true);
                                      } else {
                                        referral?.latestCardId &&
                                          navigate(
                                            "/" + referral?.latestCardId,
                                          );
                                      }
                                    }}
                                  >
                                    {/* Avatar */}
                                    <Avatar className="w-12 h-12 cursor-pointer hover:scale-110 transition-transform duration-200 border-2 border-muted hover:border-primary">
                                      <AvatarImage
                                        style={{
                                          backgroundColor:
                                            "rgba(128, 128, 128, 0.86)",
                                        }}
                                        src={
                                          // referral?.profilePhoto ||
                                          // "/lovable-uploads/logo_color_correct.png"

                                          referral?.isPublic
                                            ? "/lovable-uploads/private_card_logo.png"
                                            : referral?.profilePhoto
                                              ? referral.profilePhoto
                                              : "/lovable-uploads/logo_color_correct.png"
                                        }
                                        alt={referral?.firstName || "User"}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {referral?.firstName
                                          ?.split(" ")
                                          ?.map((n) => n[0])
                                          ?.join("") || "?"}
                                      </AvatarFallback>
                                    </Avatar>

                                    {/* Name + Level */}
                                    <div className="text-center">
                                      <p className="text-xs font-medium truncate max-w-[60px] group-hover:text-primary transition-colors">
                                        {referral?.isPublic
                                          ? "Private"
                                          : referral?.firstName || "No card"}
                                      </p>
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] px-1 py-0 mt-1"
                                      >
                                        {referral?.memberLevel}
                                      </Badge>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-full text-center py-4 text-muted-foreground">
                                  No referrals found
                                </div>
                              )}
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
                              <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto text-sm text-muted-foreground">
                                <span>
                                  Showing {(currentPage - 1) * itemsPerPage + 1}-
                                  {Math.min(
                                    currentPage * itemsPerPage,
                                    enrichedReferrals.length,
                                  )}{" "}
                                  of {enrichedReferrals.length}
                                </span>
                                <Button
                                  className="w-fit"
                                  onClick={() => {
                                    if (
                                      user?.role === "admin" ||
                                      user?.planType === "paid"
                                    ) {
                                      exportReferralsToCSV();
                                    } else {
                                      setIsModalOpen(false);
                                      setShowPermissionModal(true);
                                    }
                                  }}
                                  disabled={
                                    user?.role === "admin" ||
                                    user?.planType === "paid"
                                      ? !enrichedReferrals.length
                                      : false
                                  }
                                >
                                  Export CSV
                                </Button>
                              </div>

                              <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
                                {/* Previous */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.max(prev - 1, 1),
                                    )
                                  }
                                  disabled={currentPage === 1}
                                >
                                  Previous
                                </Button>

                                {/* Page Numbers */}
                                <div className="flex items-center gap-1">
                                  {Array.from(
                                    { length: Math.min(5, totalPages) },
                                    (_, i) => {
                                      let pageNum;
                                      if (totalPages <= 5) {
                                        pageNum = i + 1;
                                      } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                      } else if (
                                        currentPage >=
                                        totalPages - 2
                                      ) {
                                        pageNum = totalPages - 4 + i;
                                      } else {
                                        pageNum = currentPage - 2 + i;
                                      }

                                      return (
                                        <Button
                                          key={pageNum}
                                          variant={
                                            currentPage === pageNum
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          className="w-8 h-8 p-0"
                                          onClick={() =>
                                            setCurrentPage(pageNum)
                                          }
                                        >
                                          {pageNum}
                                        </Button>
                                      );
                                    },
                                  )}
                                </div>

                                {/* Next */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.min(totalPages, prev + 1),
                                    )
                                  }
                                  disabled={currentPage === totalPages}
                                >
                                  Next
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </DialogPortal>
                    </Dialog>

                    <Dialog
                      open={isGrandChildModalOpen}
                      onOpenChange={(open) => {
                        setIsGrandChildModalOpen(open);
                        if (!open) setCurrentPage(1);
                      }}
                    >
                      <DialogPortal>
                        {/* Overlay */}
                        <DialogOverlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

                        {/* Modal Content */}
                        <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bottom-auto z-50 grid gap-4 border bg-background p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out rounded-lg max-w-5xl w-[calc(100%-2rem)] sm:w-full max-h-[85vh] overflow-y-auto">
                          {/* Header */}
                          <DialogHeader>
                            <DialogTitle className="text-lg font-semibold">
                              Complete List of Grandchild-Referrals
                            </DialogTitle>
                            <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                              <p className="text-base text-muted-foreground">
                                Total Grandchild Referrals:{" "}
                                <span className="font-semibold text-foreground">
                                  {grandChildenrichedReferrals.length}
                                </span>
                              </p>

                              {hasActiveLeadExport ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2.5 py-1 flex items-center gap-1.5 font-medium shadow-none hover:bg-emerald-50">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  {remainingAccessLabel}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs px-2.5 py-1 text-muted-foreground bg-muted/40 font-normal">
                                  Download Access: Not Active
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 px-3.5 py-2 text-xs text-blue-800 dark:text-blue-300 mt-2">
                              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                              <p>
                                <span className="font-semibold text-blue-900 dark:text-blue-100">Note:</span> Only cards listed as public will display information.
                              </p>
                            </div>
                          </DialogHeader>

                          <div className="space-y-4">
                            {/* Referrals Grid */}
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4 py-4 max-h-[50vh] overflow-y-auto">
                              {grandChildpaginatedData.length > 0 ? (
                                grandChildpaginatedData.map(
                                  (referral, index) => {
                                    // Client point (b): only the first 10
                                    // grandchildren are viewable. `index` is
                                    // page-local, so offset it by the page to
                                    // get the position in the whole list -
                                    // otherwise page 2 would unlock another 10.
                                    const globalIndex =
                                      (currentPage - 1) * itemsPerPage + index;
                                    const isBeyondViewLimit =
                                      globalIndex >= GRANDCHILD_VIEW_LIMIT;

                                    return (
                                    <div
                                      key={index}
                                      className={`flex flex-col items-center gap-2 group cursor-pointer ${
                                        isBeyondViewLimit ? "opacity-50" : ""
                                      }`}
                                      onClick={() => {
                                        if (isBeyondViewLimit) {
                                          setShowLeadLimitNotice(true);
                                        } else if (!referral?.latestCardId) {
                                          setIsGrandChildModalOpen(false);
                                          setPrivateCardMessage(
                                            "No card found!",
                                          );
                                          setPrivateCardSubMessage(
                                            "Looks like a card has not been created yet.",
                                          );
                                          setShowLoginAlert(true);
                                        } else if (referral?.isPublic) {
                                          setIsGrandChildModalOpen(false);
                                          setPrivateCardMessage("Private Card");
                                          setPrivateCardSubMessage(
                                            "Oops! This card is private. You don’t have permission to view it.",
                                          );
                                          setShowLoginAlert(true);
                                        } else {
                                          referral?.latestCardId &&
                                            navigate(
                                              "/" + referral?.latestCardId,
                                            );
                                        }
                                      }}
                                    >
                                      {/* Avatar */}
                                      <Avatar className="w-12 h-12 cursor-pointer hover:scale-110 transition-transform duration-200 border-2 border-muted hover:border-primary">
                                        <AvatarImage
                                          style={{
                                            backgroundColor:
                                              "rgba(128, 128, 128, 0.86)",
                                          }}
                                          src={
                                            // referral?.profilePhoto ||
                                            // "/lovable-uploads/logo_color_correct.png"

                                            referral?.isPublic
                                              ? "/lovable-uploads/private_card_logo.png"
                                              : referral?.profilePhoto
                                                ? referral.profilePhoto
                                                : "/lovable-uploads/logo_color_correct.png"
                                          }
                                          alt={referral?.firstName || "User"}
                                        />
                                        <AvatarFallback className="text-xs">
                                          {referral?.firstName
                                            ?.split(" ")
                                            ?.map((n) => n[0])
                                            ?.join("") || "?"}
                                        </AvatarFallback>
                                      </Avatar>

                                      {/* Name + Level */}
                                      <div className="text-center">
                                        <p className="text-xs font-medium truncate max-w-[60px] group-hover:text-primary transition-colors">
                                          {referral?.isPublic
                                            ? "Private"
                                            : referral?.firstName || "No card"}
                                        </p>
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] px-1 py-0 mt-1"
                                        >
                                          {referral?.memberLevel}
                                        </Badge>
                                      </div>
                                    </div>
                                    );
                                  },
                                )
                              ) : (
                                <div className="col-span-full text-center py-4 text-muted-foreground">
                                  No referrals found
                                </div>
                              )}
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
                              <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto text-sm text-muted-foreground">
                                <span>
                                  Showing {(currentPage - 1) * itemsPerPage + 1}-
                                  {Math.min(
                                    currentPage * itemsPerPage,
                                    grandChildenrichedReferrals.length,
                                  )}{" "}
                                  of {grandChildenrichedReferrals.length}
                                </span>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    className="w-fit"
                                    onClick={() => {
                                      // Not paid-plan -> the existing Pro gate.
                                      if (
                                        !(
                                          user?.role === "admin" ||
                                          user?.planType === "paid"
                                        )
                                      ) {
                                        setIsGrandChildModalOpen(false);
                                        setShowPermissionModal(true);
                                        return;
                                      }

                                      // Client points (b1/b2/b4): the grandchild
                                      // list is a separate one-time purchase.
                                      // Anyone inside an unexpired access window downloads straight away.
                                      if (hasActiveLeadExport) {
                                        exportGrandChildReferralsToCSV();
                                        return;
                                      }

                                      setShowLeadPurchase(true);
                                    }}
                                    disabled={!grandChildenrichedReferrals.length}
                                  >
                                    Export CSV
                                  </Button>

                                  {hasActiveLeadExport ? (
                                    <span className="text-xs text-emerald-600 font-medium">
                                      ({remainingAccessLabel})
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      (${leadExportTotal.toFixed(2)} · {leadExportSettings.accessDays || 7} days access)
                                    </span>
                                  )}

                                  {user?.role === "admin" && !hasActiveLeadExport && (
                                    <button
                                      type="button"
                                      onClick={() => exportGrandChildReferralsToCSV()}
                                      className="text-[11px] text-muted-foreground underline hover:text-foreground ml-1"
                                      title="Admin override to download without purchase"
                                    >
                                      (Admin bypass)
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
                                {/* Previous */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.max(prev - 1, 1),
                                    )
                                  }
                                  disabled={currentPage === 1}
                                >
                                  Previous
                                </Button>

                                {/* Page Numbers */}
                                <div className="flex items-center gap-1">
                                  {Array.from(
                                    { length: Math.min(5, totalPages) },
                                    (_, i) => {
                                      let pageNum;
                                      if (totalPages <= 5) {
                                        pageNum = i + 1;
                                      } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                      } else if (
                                        currentPage >=
                                        totalPages - 2
                                      ) {
                                        pageNum = totalPages - 4 + i;
                                      } else {
                                        pageNum = currentPage - 2 + i;
                                      }

                                      return (
                                        <Button
                                          key={pageNum}
                                          variant={
                                            currentPage === pageNum
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          className="w-8 h-8 p-0"
                                          onClick={() =>
                                            setCurrentPage(pageNum)
                                          }
                                        >
                                          {pageNum}
                                        </Button>
                                      );
                                    },
                                  )}
                                </div>

                                {/* Next */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.min(totalPages, prev + 1),
                                    )
                                  }
                                  disabled={currentPage === totalPages}
                                >
                                  Next
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </DialogPortal>
                    </Dialog>
                  </>
                ) : (
                  <p className="text-muted-foreground">No data found</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">
                  [ {enrichedReferrals.length} ]
                </span>
                {/* "More >" button */}
                {enrichedReferrals.length > 1 && (
                  <span
                    className="!ml-[15px] text-sm font-medium text-blue-600 cursor-pointer"
                    onClick={() => setIsModalOpen(true)}
                  >
                    ... more &gt;&gt;
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Referral Link */}
        <Card className="card-hover cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Copy and share this URL. Anyone who signs up via it becomes your
              [child] recruit. And anyone they recruit becomes you [grandchild]
              recruit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="flex-1" />
              <Button size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads chart + download history - client point (c). Sits directly
          under the Child-Referrals / Referral Link row, where the client's
          mock-up marks it NEW. */}
      <ReferralLeadsChart uid={user?.uid} history={leadExportHistory} />


      {/* Your Suggested Target Levels - Full Width */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Your Suggested Target Levels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mb-4">
            <div className="text-sm mb-1">
              Everyone starts a "Level-1", the goal is to become monetized if
              earning passive income is your desire.
              <Accordion type="single" collapsible className="mt-2">
                <AccordionItem value="learn-more" className="border-none">
                  <AccordionTrigger className="text-primary p-0 text-sm font-normal hover:no-underline">
                    Learn more...
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pt-2">
                    The first task is to meet and exceed the L2 minimum
                    requirement [100-referrals] by at least 50%. Next, encourage
                    at least [100] of your referrals to "Level-Up"; they may
                    just do it without your encouragement because the offer is
                    so good. Your ultimate target is "Level-3", at L3, you are
                    monetized and can start earning 10% and 50% on your
                    Child-referrals and your Grandchild-referrals, respectively.
                    When your Child refers someone, that member becomes your
                    Grandchild, you make 50% of anything your grandchild
                    purchases on the site. Choose your track and start earning
                    passive income now.{" "}
                    <a
                      href="/opportunities"
                      className="text-primary hover:underline"
                    >
                      Learn more...
                    </a>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
          {targetLevels.map((level, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${level.color}`} />
                  <div className="text-sm">
                    <span className="font-semibold">{level.level}</span>{" "}
                    {level.description} |{" "}
                    <span
                      className={
                        level.status === "Top Earner" ? "text-blue-600" : ""
                      }
                    >
                      {level.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    <span className="font-semibold">{level.progress}%</span> |{" "}
                    <span
                      className={
                        level.monetized === "Monetized"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {level.monetized}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Referrals Map Dialog */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-4xl w-[calc(100%-2rem)] sm:w-full h-[80vh]">
          <DialogHeader>
            <DialogTitle>Referral Locations Map</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full">
            <WorldMap contacts={referalMap} />
          </div>
        </DialogContent>
      </Dialog>

      {showLoginAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 !mt-0">
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
              {privateCardMessage}
            </h2>

            {/* Message */}
            <p className="text-gray-700 mb-8 leading-relaxed">
              {privateCardSubMessage}
            </p>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowLoginAlert(false)}
                className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Client point (b): clicking a grandchild past the view limit. Copy is
          the client's, verbatim.

          A Radix Dialog rather than a plain fixed div, because this one opens
          ON TOP of the already-open grandchild dialog. Radix puts modal content
          in a portal at the end of <body> and sets pointer-events:none on the
          body while a modal is open, so a hand-rolled overlay rendered inside
          the page tree is both painted under it and unclickable. Nesting Radix
          dialogs is supported; the later-opened portal stacks above, and z-[60]
          keeps this one above the z-50 grandchild dialog explicitly. */}
      <Dialog open={showLeadLimitNotice} onOpenChange={setShowLeadLimitNotice}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" />
          <DialogContent className="fixed top-1/2 left-1/2 bottom-auto z-[60] -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm rounded-lg bg-background p-6 text-center shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                Lead preview limit
              </DialogTitle>
            </DialogHeader>

            <p className="mb-2 text-muted-foreground">
              You must download the entire list to view more, select the
              &ldquo;export CSV&rdquo; button below.
            </p>

            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLeadLimitNotice(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowLeadLimitNotice(false);
                  if (hasActiveLeadExport) {
                    exportGrandChildReferralsToCSV();
                  } else {
                    setShowLeadPurchase(true);
                  }
                }}
              >
                Export CSV
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      <LeadExportPurchaseModal
        open={showLeadPurchase}
        onOpenChange={setShowLeadPurchase}
        uid={user?.uid}
        leadCount={leadCount}
        perLeadFee={leadExportSettings.perLeadFee}
        total={leadExportTotal}
        accessDays={leadExportSettings.accessDays}
        onPaid={async (paymentIntentId) => {
          await recordLeadExportPurchase(paymentIntentId);
          exportGrandChildReferralsToCSV();
        }}
      />

      {showPermissionModal && (
        <div
          style={{ margin: 0 }}
          className={cn("fixed inset-0 z-50 flex items-center justify-center")}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal Box */}
          <div className="relative z-50 w-full max-w-sm mx-4 rounded-lg bg-white p-6 text-center shadow-xl">
            <h1 className="mb-4 text-xl font-bold">Pro Feature</h1>

            <p className="mb-6 text-gray-600">
              This feature is available only for{" "}
              <span className="font-semibold text-primary">Pro users</span>.
              Please purchase a Pro plan to continue.
            </p>

            <div className="flex justify-center gap-3 text-sm text-muted-foreground">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPermissionModal(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={() => {
                  setShowPermissionModal(false);
                  setTimeout(() => router.replace("/pricing"), 100);
                }}
              >
                Upgrade
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
