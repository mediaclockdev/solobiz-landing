"use client";
import { deleteObject } from "firebase/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import imageCompression from "browser-image-compression";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { generateQRCodeWithLogo } from "@/utils/qrCodeGenerator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Check,
  CreditCard,
  Mail,
  User,
  Camera,
  Building2,
  Calendar,
  Crown,
  Shield,
  Clock,
  Download,
  Plus,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
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
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  ref as storageRef,
} from "firebase/storage";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

import { Eye, EyeOff, X as Cross } from "lucide-react";
import {
  loadInvoices,
  AccessoryInvoice,
  updateOrderTracking,
  TrackingStage,
} from "@/utils/invoiceGenerator";
import Link from "next/link";
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
import { colorSchemes } from "@/utils/cardFilters";

type Theme = "light" | "dark";
export default function Settings() {
  const formatDate = (d: any) =>
    d?.toDate ? d.toDate().toLocaleString() : "-";
  const [nfcCardsCount, setNfcCardsCount] = useState(0);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [invoices, setInvoices] = useState<AccessoryInvoice[]>([]);
  const [nfcCards, setNfcCards] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedNfc, setSelectedNfc] = useState("");
  const [selectedCard, setSelectedCard] = useState("");
  const [setuserId, setOrderUserID] = useState("");
  const [qrCodes, setQrCodes] = useState([]);
  const [nfcStatus, setNfcStatus] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [count, setCount] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  //const [searchParams, setSearchParams] = useSearchParams();
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const { user, isLoading: authLoading } = useAuth();
  const tabFromParams = searchParams.get("tab");
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [companyName, setCompanyName] = useState(user?.companyName ?? "");
  const [clientsPreference, setClientsPreference] = useState(
    user?.clientsPreference ?? ""
  );
  const [businessCategory, setBusinessCategory] = useState(
    user?.businessCategory ?? ""
  );

  const [planDuration, setPlanDuration] = useState(null);
  const [planName, setPlanName] = useState(null);
  const [planPrice, setPlanPrice] = useState(null);
  const [planStartDate, setPlanStartDate] = useState(null);
  const [planEndDate, setPlanEndDate] = useState(null);
  const [isPast, setIsPast] = useState(false);
  const [addons, setAddons] = useState([]);
  const [initials, setInitials] = useState("");
  const [qrCodesForStickers, setQrCodesForStickers] = useState([]);
  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Show/Hide password
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Set default tab based on URL parameter if present
  const currentTab =
    tabFromParams === "subscriptions" ||
    tabFromParams === "my-accessories" ||
    tabFromParams === "nfc_cards" ||
    tabFromParams === "appearance" ||
    tabFromParams === "notifications"
      ? tabFromParams === "nfc_cards"
        ? "my-accessories"
        : tabFromParams
      : "account";

  useEffect(() => {
    if (tabFromParams === "nfc_cards") {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("tab", "my-accessories");
      router.replace(`?${newParams.toString()}`);
    }
  }, [tabFromParams, searchParams, router]);

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value === "account") {
      newParams.delete("tab");
    } else {
      newParams.set("tab", value);
    }

    router.push(`?${newParams.toString()}`);
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user?.uid) return;

    try {
      setIsLoading(true);
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();

      // Delete previous avatar if exists
      if (data?.avatarUrl) {
        const oldRef = ref(getStorage(), data.avatarUrl);
        await deleteObject(oldRef).catch((err) => {
          console.warn("Old avatar not found or already deleted", err);
        });
      }

      // Compress to target <= 25KB
      let compressedFile = file;
      let options = {
        maxSizeMB: 0.025, // target ~25KB
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };

      compressedFile = await imageCompression(file, options);

      // If still above 25KB, recompress
      let iteration = 0;
      while (compressedFile.size > 25 * 1024 && iteration < 3) {
        options.maxSizeMB *= 0.8; // slightly reduce quality
        compressedFile = await imageCompression(compressedFile, options);
        iteration++;
      }

      // Upload to Firebase Storage
      const storage = getStorage();
      const fileRef = ref(
        storage,
        `avatars/${user.uid}/${compressedFile.name}`
      );
      await uploadBytes(fileRef, compressedFile);

      const downloadURL = await getDownloadURL(fileRef);
      setAvatarUrl(downloadURL);

      // Update Firestore
      await updateDoc(userRef, { avatarUrl: downloadURL });

      showToast("Avatar updated successfully", "success");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      showToast("Failed to upload avatar", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // const loadQRCodes = async () => {
    //   const codes = await Promise.all(
    //     selectedInvoice?.items?.flatMap((item) =>
    //       item?.cardDetails?.assignedDigitalCard?.map((ass) => {
    //         return generateQRForItem(ass, item?.color);
    //       })
    //     )
    //   );
    //   setQrCodes(codes);
    // };

    const loadQRCodes = async () => {
      if (!invoices?.length) return;

      const promises = invoices.flatMap((invoiceDoc: any) =>
        (invoiceDoc?.accessory_invoices || [])
          .filter((item: any) => item?.productType !== "sticker")
          .map((item: any) =>
            generateQRForItem(item?.color, item?.cardDetails?.tapStickerLogo)
          )
      );

      const codes = await Promise.all(promises);
      setQrCodes(codes);
    };

    const loadQRCodesForStickers = async () => {
      const promises = invoices.flatMap((invoiceDoc: any) =>
        (invoiceDoc?.accessory_invoices || [])
          .filter((item: any) => item?.productType !== "sticker")
          .map((item: any) =>
            generateQRForItem(item?.cardDetails?.tapStickerColor)
          )
      );

      // const codes = await Promise.all(
      //   selectedInvoice?.items?.map(
      //     async (item) =>
      //       generateQRForItem(
      //         item?.cardDetails?.assignedDigitalCard,
      //         item?.cardDetails?.tapStickerColor
      //       )
      //     // await generateQRForSticker(
      //     //   item?.cardDetails?.assignedDigitalCard,
      //     //   item?.cardDetails?.tapStickerColor,
      //     //   item?.cardDetails?.tapStickerLogo
      //     // )
      //   )
      // );
      const codes = await Promise.all(promises);

      setQrCodesForStickers(codes);
    };
    loadQRCodesForStickers();
    loadQRCodes();
  }, [invoices]);
  const generateQRForItem = async (
    // cardId: string,
    selectedColor: string,
    tapStickerLogo?: string | null
  ) => {
    try {
      const colorHexMap: Record<string, string> = {
        red: "#EF4444",
        pink: "#EC4899",
        yellow: "#EAB308",
        green: "#059669",
        blue: "#3B82F6",
        purple: "#8B5CF6",
        white: "#FFFFFF",
        black: "#000000",
        gray: "#4f4e4f",
      };

      const qrColor = colorHexMap[selectedColor] || "#000000";
      const qrBackground = selectedColor === "white" ? "#1F2937" : "#FFFFFF";
      // ONLY card ID – NOT user URL
      const scanUrl = `${process.env.NEXT_PUBLIC_API_LIVE_URL}`;

      const qrUrl = await generateQRCodeWithLogo(scanUrl, null, {
        width: 300,
        margin: 1,
        //@ts-ignore
        useDefaultLogo: false,
        color: {
          dark: qrColor,
          light: qrBackground,
        },
      });

      return qrUrl;
    } catch (error) {
      console.error("QR Generate Error:", error);
      return null;
    }
  };

  const formatAddress = (
    address: string,
    city: string,
    state: string,
    zipCode: string
  ): string => {
    const parts: string[] = [];

    if (address?.trim()) {
      parts.push(address.trim());
    }

    if (city?.trim()) {
      parts.push(city.trim());
    }

    const stateZip = [state?.trim(), zipCode?.trim()].filter(Boolean).join(" ");

    if (stateZip) {
      parts.push(stateZip);
    }

    return parts.join(", ");
  };
  useEffect(() => {
    const handleThemeUpdate = (e: any) => {
      setTheme(e.detail);
    };

    window.addEventListener("themeChanged", handleThemeUpdate);

    return () => {
      window.removeEventListener("themeChanged", handleThemeUpdate);
    };
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    setTheme(savedTheme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
    localStorage.setItem("theme", theme === "light" ? "dark" : "light");
  };

  // const handleAvatarUpload = async (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = event.target.files?.[0];
  //   if (!file || !user?.uid) return;

  //   try {
  //     setIsLoading(true);
  //     const userRef = doc(db, "users", user.uid);
  //     const userSnap = await getDoc(userRef);
  //     const data = userSnap.data();

  //     // Delete previous avatar if exists
  //     if (data?.avatarUrl) {
  //       const oldRef = ref(getStorage(), data.avatarUrl);
  //       await deleteObject(oldRef).catch((err) => {
  //         console.warn("Old avatar not found or already deleted", err);
  //       });
  //     }

  //     // Compress new avatar (~50KB)
  //     const options = {
  //       maxSizeMB: 0.05,
  //       maxWidthOrHeight: 500,
  //       useWebWorker: true,
  //     };
  //     const compressedFile = await imageCompression(file, options);

  //     const storage = getStorage();
  //     const fileRef = ref(
  //       storage,
  //       `avatars/${user.uid}/${compressedFile.name}`
  //     );
  //     await uploadBytes(fileRef, compressedFile);

  //     const downloadURL = await getDownloadURL(fileRef);
  //     setAvatarUrl(downloadURL);

  //     // Update Firestore
  //     await updateDoc(userRef, { avatarUrl: downloadURL });

  //     showToast("Avatar updated successfully", "success");
  //     setIsLoading(false);
  //   } catch (error) {
  //     console.error("Error uploading avatar:", error);
  //     showToast("Failed to upload avatar", "error");
  //   }
  // };

  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        if (!user?.uid) return; // Only block if non-admin and no userId

        // Build query dynamically
        const ordersCollection = collection(db, "orders");
        const ordersQuery = query(
          ordersCollection,
          where("userId", "==", user?.uid)
        ); // Non-admin: fetch only their orders

        const querySnapshot = await getDocs(ordersQuery);

        const orders: any[] = [];
        querySnapshot.forEach((doc) => {
          orders.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        // Sort by date or createdAt
        const sortedInvoices = orders.sort((a, b) => {
          const timeA = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : new Date(a.date).getTime();

          const timeB = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : new Date(b.date).getTime();

          return timeB - timeA; // latest first
        });
        console.log("sortedInvoices", sortedInvoices);

        setInvoices(sortedInvoices);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    if (invoices?.length <= 0) {
      fetchUserOrders();
    }
  }, [user]);

  const handleAvatarDelete = async () => {
    if (!user?.uid || !avatarUrl) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const storageReference = ref(getStorage(), avatarUrl);

      // Delete from Storage
      await deleteObject(storageReference);

      // Remove from Firestore
      await updateDoc(userRef, { avatarUrl: "" });
      setAvatarUrl("");

      showToast("Avatar deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting avatar:", error);
      showToast("Failed to delete avatar", "error");
    }
  };

  const createdAt = user?.metadata?.creationTime ?? new Date();
  const date = new Date(createdAt);

  const options = { day: "2-digit", month: "short", year: "numeric" };
  //@ts-ignore
  let formatted = date.toLocaleDateString("en-GB", options);

  // Add suffix for day (st, nd, rd, th)
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";

  formatted = formatted.replace(/^\d+/, `${day}${suffix}`);

  const passwordChecks = {
    length: newPassword.length >= 8,
    maxLength: newPassword.length <= 15,
    lowercase: /[a-z]/.test(newPassword),
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  };

  const [plan, setPlan] = useState<any>(null);
  const [subscriptionData, setsubscriptionData] = useState<any>(null);
  const [leadExportsData, setLeadExportsData] = useState<any[]>([]);

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

  const { showToast } = useToast();

  const handleSavePersonalInfo = async () => {
    if (!user?.uid) return;
    try {
      if (!displayName || displayName.trim() === "") {
        showToast("First Name is required", "error");
        return;
      }

      if (!lastName || lastName.trim() === "") {
        showToast("Last Name is required", "error");
        return;
      }
      setIsLoading(true);
      let avatarDownloadURL = avatarUrl;

      const fileInput = document.getElementById(
        "avatar-upload"
      ) as HTMLInputElement;
      const file = fileInput?.files?.[0];

      if (file) {
        const storage = getStorage();
        const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
        await uploadBytes(storageRef, file);
        avatarDownloadURL = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, "users", user.uid), {
        lastName,
        displayName,
        bio,
        email: user.email,
        companyName,
        clientsPreference,
        businessCategory,
        avatarUrl: avatarDownloadURL,
      });

      setAvatarUrl(avatarDownloadURL);
      showToast("Info saved successfully", "success");
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving personal info:", error);
      showToast("Error saving personal info", "error");
    }
  };

  const handleChangePassword = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const passwordChecks = {
      length: newPassword.length >= 8,
      maxLength: newPassword.length <= 15,
      lowercase: /[a-z]/.test(newPassword),
      uppercase: /[A-Z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
    };

    const allRulesPassed = Object.values(passwordChecks).every(Boolean);

    if (newPassword !== confirmPassword) {
      showToast("New password and confirm password do not match", "error");
      return;
    }

    if (!allRulesPassed) {
      showToast(
        "Password must have: 1 uppercase, 1 lowercase, 1 number, 8-15 characters",
        "error"
      );
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      await updatePassword(currentUser, newPassword);
      const { success, error } = await logout();
      if (success) {
        const userRef = doc(db, "users", currentUser.uid);
        updateDoc(userRef, { isLoggedIn: false });
        showToast("Password updated successfully", "success");

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        router.replace("/");
      }
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === "auth/wrong-password") {
        showToast("Current password is incorrect", "error");
      } else if (error.code === "auth/requires-recent-login") {
        showToast("Please logout and login again to update password", "error");
      } else {
        showToast("Failed to update password", "error");
      }
    }
  };

  const [freeTrialPeriod, setFreeTrialPeriod] = useState<number>(0);
  const [remainingDays, setRemainingDays] = useState<number>(0);

  useEffect(() => {
    const pricingRequirementSettings = async () => {
      try {
        const settingsRef = doc(db, "users", user?.uid);
        const settingsSnap = await getDoc(settingsRef);

        if (!settingsSnap.exists()) return;

        const settingsData = settingsSnap.data();
        const trialDays = settingsData.freeTrialPeriod ?? 0;
        setFreeTrialPeriod(trialDays);

        // Get user's account creation date
        const createdAt = user?.metadata?.creationTime
          ? new Date(user.metadata.creationTime)
          : new Date();

        // Calculate days since account creation
        const now = new Date();
        const diffTime = now.getTime() - createdAt.getTime();
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Calculate remaining trial days
        const remaining = Math.max(trialDays - daysPassed, 0);
        setRemainingDays(remaining);
      } catch (error) {
        console.error("Error fetching pricing settings:", error);
      }
    };

    if (user) pricingRequirementSettings();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.avatarUrl) {
          setAvatarUrl(data.avatarUrl);
        }
        setPaymentId(data.paymentId);
        setLastName(data.lastName || "");
        setDisplayName(data.displayName || "");
        setBio(data.bio || "");
        setCompanyName(data.companyName || "");
        setClientsPreference(data.clientsPreference || "");
        setBusinessCategory(data.businessCategory || "");
        setAddons(data.addons);
        setIsLoading(false);

        // ✅ Create initials from displayName + lastName
        const firstName = data.displayName || "";
        const lastName = data.lastName || "";
        const initials =
          (firstName.charAt(0) || "").toUpperCase() +
          (lastName.charAt(0) || "").toUpperCase();
        setInitials(initials);
      }
    };

    fetchUserData();
  }, [authLoading]);

  useEffect(() => {
    async function fetchPlan() {
      setLoading(true);

      await fetch("/api/stripe/sync-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: user?.subscriptionId,
        }),
      });

      const res = await fetch("/api/create-subscription", {
        method: "POST",
        body: JSON.stringify({ userId: user?.uid, action: "get" }),
      });

      const data = await res.json();

      setPaymentMethod(data.paymentMethod);
      setPlan(data);
      setLoading(false);
    }

    async function getUserSubscriptions() {
      try {
        const subsRef = collection(db, "subscriptions");
        const q = query(subsRef, where("userId", "==", user?.uid));
        const querySnapshot = await getDocs(q);
        const subscriptions = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const getTime = (sub: any) => {
          if (sub.startDate?.toDate) return sub.startDate.toDate().getTime();
          if (sub.startDate?.seconds) return sub.startDate.seconds * 1000;
          if (sub.createdAt?.toDate) return sub.createdAt.toDate().getTime();
          if (sub.createdAt?.seconds) return sub.createdAt.seconds * 1000;
          if (sub.startDate) return new Date(sub.startDate).getTime() || 0;
          if (sub.createdAt) return new Date(sub.createdAt).getTime() || 0;
          if (sub.date) return new Date(sub.date).getTime() || 0;
          return 0;
        };

        const sortedSubscriptions = subscriptions.sort(
          (a, b) => getTime(b) - getTime(a)
        );

        setsubscriptionData(sortedSubscriptions);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return [];
      }
    }

    async function getUserLeadExports() {
      if (!user?.uid) return;
      try {
        const exportsRef = collection(db, "leadExports");
        const q = query(exportsRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const rows = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLeadExportsData(rows);
      } catch (error) {
        console.error("Error fetching lead exports:", error);
      }
    }

    if (user && !plan) {
      fetchPlan();
    }
    if (user && !subscriptionData) {
      getUserSubscriptions();
    }
    if (user) {
      getUserLeadExports();
    }
  }, [user]);

  const formatDateWithOrdinal = (dateVal: any) => {
    if (!dateVal) return "N/A";
    let date: Date;
    if (dateVal.toDate) {
      date = dateVal.toDate();
    } else if (dateVal instanceof Date) {
      date = dateVal;
    } else if (dateVal?.seconds) {
      date = new Date(dateVal.seconds * 1000);
    } else {
      date = new Date(dateVal);
    }

    if (isNaN(date.getTime())) return "N/A";

    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();

    const getOrdinal = (n: number) => {
      if (n > 3 && n < 21) return "th";
      switch (n % 10) {
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

    return `${day}${getOrdinal(day)} ${month} ${year}`;
  };

  const resolvedStartDate =
    plan?.startDate ||
    (plan?.subscription?.current_period_start
      ? new Date(plan.subscription.current_period_start * 1000)
      : null) ||
    user?.subscriptionStartDate ||
    user?.createdAt ||
    null;

  const resolvedEndDate =
    plan?.endDate ||
    (plan?.subscription?.current_period_end
      ? new Date(plan.subscription.current_period_end * 1000)
      : null) ||
    user?.subscriptionEndDate ||
    planEndDate ||
    null;

  const startDate = formatDateWithOrdinal(resolvedStartDate);
  const endDate = formatDateWithOrdinal(resolvedEndDate);

  const combinedBilling = useMemo(() => {
    const items: any[] = [];

    (subscriptionData || []).forEach((sub: any) => {
      const rawDate =
        sub.startDate?.toDate?.() ||
        (sub.startDate?.seconds ? new Date(sub.startDate.seconds * 1000) : null) ||
        (sub.startDate ? new Date(sub.startDate) : null) ||
        sub.createdAt?.toDate?.() ||
        (sub.createdAt?.seconds ? new Date(sub.createdAt.seconds * 1000) : null) ||
        (sub.createdAt ? new Date(sub.createdAt) : null);
      const planPriceStr = sub.planPrice != null ? String(sub.planPrice).trim() : "";
      const formattedPrice = planPriceStr
        ? planPriceStr.startsWith("$")
          ? planPriceStr
          : `$${planPriceStr}`
        : "$0.00";
      items.push({
        id: sub.id || sub.subscriptionId || sub.paymentIntentId,
        title: sub.planName || "SoloBizCards PRO",
        amount: formattedPrice,
        date: rawDate,
        invoicePdf: sub.invoicePdf,
        type: "subscription",
      });
    });

    (leadExportsData || []).forEach((exp: any) => {
      const rawDate =
        exp.paidAt?.toDate?.() ||
        (exp.paidAt?.seconds ? new Date(exp.paidAt.seconds * 1000) : null) ||
        (exp.paidAt ? new Date(exp.paidAt) : null);
      items.push({
        id: exp.id || exp.paymentIntentId,
        title: `Grandchild Leads (${exp.leadCount ?? 0} leads)`,
        amount: `$${Number(exp.amount || 0).toFixed(2)}`,
        date: rawDate,
        type: "leadExport",
      });
    });

    return items.sort((a, b) => {
      const aTime =
        a.date instanceof Date && !Number.isNaN(a.date.getTime())
          ? a.date.getTime()
          : 0;
      const bTime =
        b.date instanceof Date && !Number.isNaN(b.date.getTime())
          ? b.date.getTime()
          : 0;
      return bTime - aTime;
    });
  }, [subscriptionData, leadExportsData]);

  const subscriptionStartDate = user?.subscriptionStartDate
    ? new Date(user.subscriptionStartDate)
    : null;

  const isWithin30Days = subscriptionStartDate
    ? (new Date().getTime() - subscriptionStartDate.getTime()) /
        (1000 * 60 * 60 * 24) <=
      30
    : false;

  useEffect(() => {
    if (!planEndDate) return;
    const endDate = planEndDate.toDate
      ? planEndDate.toDate()
      : new Date(planEndDate);
    if (endDate < new Date()) {
      setIsPast(true);
    }
  }, [planEndDate]);

  /* ----------------------------------
   * Load preferences on mount
   * ---------------------------------- */
  useEffect(() => {
    if (!user?.uid) return;

    const fetchPreferences = async () => {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const prefs = snap.data()?.notificationPreferences;
        if (prefs) {
          setEmailNotifs(prefs.email ?? true);
          setOrderUpdates(prefs.orderUpdates ?? true);
          setMarketing(prefs.marketing ?? false);
        }
      }
    };

    fetchPreferences();
  }, [user?.uid]);

  const savePreferences = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      const userRef = doc(db, "users", user.uid);

      const preferences = {
        email: emailNotifs,
        orderUpdates,
        marketing,
      };

      await updateDoc(userRef, {
        notificationPreferences: preferences,
        updatedAt: serverTimestamp(),
      });

      // Notify admin
      await fetch("/api/notify-admin/preferences-changed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || "Unknown User",
          preferences,
        }),
      });

      showToast("Preferences saved successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to save preferences", "error");
    } finally {
      setLoading(false);
    }
  };

  const hasNfcCards = nfcCards.length > 0;
  const isNfcSelected = Boolean(selectedNfc);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchNfcCards = async () => {
      const q = query(
        collection(db, "nfc_cards"),
        where("userId", "==", user?.uid),
        where("userId", "==", user?.uid),
        where("status", "in", ["active", "disabled"])
      );

      const snap = await getDocs(q);

      const result = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNfcCardsCount(result.length);

      setNfcCards(result);
    };

    fetchNfcCards();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchCards = async () => {
      const q = query(collection(db, "cards"), where("uid", "==", user.uid));

      const snap = await getDocs(q);

      const result = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCards(result);
    };

    fetchCards();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !selectedNfc) return;

    const fetchNfcDetails = async () => {
      try {
        const q = query(
          collection(db, "nfc_cards"),
          where("card_id", "==", selectedNfc),
          where("userId", "==", user.uid)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
          setSelectedCard("");
          setSelectedStatus("");
          return;
        }

        const nfcData = snap.docs[0].data();

        setSelectedCard(nfcData.business_card_url || "");
        setSelectedStatus(nfcData.status || "inactive");
      } catch (error) {
        console.error(error);
      }
    };

    fetchNfcDetails();
  }, [selectedNfc, user?.uid]);

  useEffect(() => {
    if (isNfcSelected) {
      document.getElementById("nfc-details")?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [selectedNfc]);

  const handleSaveNFCCardsInfo = async () => {
    if (!user?.uid || !selectedNfc || !selectedCard || !selectedStatus) {
      showToast("Please select NFC card, Business card and status", "error");
      return;
    }

    try {
      setLoading(true);

      const q = query(
        collection(db, "nfc_cards"),
        where("card_id", "==", selectedNfc),
        where("userId", "==", user.uid)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        showToast("NFC card not found", "error");
        return;
      }

      const nfcDocRef = snap.docs[0].ref;

      await updateDoc(nfcDocRef, {
        business_card_url: selectedCard,
        status: selectedStatus,
        updatedAt: serverTimestamp(),
      });

      showToast("NFC card updated successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to update NFC card", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    const fetchAccessoriesCount = async () => {
      try {
        setLoading(true);

        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid)
        );

        const snapshot = await getDocs(q);

        let totalQuantity = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();

          if (Array.isArray(data.items)) {
            data.items.forEach((item: any) => {
              totalQuantity += Number(item.quantity || 0);
            });
          }
        });

        setCount(totalQuantity);
      } catch (error) {
        console.error("Failed to fetch accessories quantity", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccessoriesCount();
  }, [user?.uid]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full sm:w-[500px] h-auto p-1.5 sm:p-1 gap-2 sm:gap-0 bg-muted rounded-lg">
          <TabsTrigger value="account" className="shrink-0">Account</TabsTrigger>
          <TabsTrigger value="subscriptions" className="shrink-0">Subscriptions</TabsTrigger>
          <TabsTrigger value="appearance" className="shrink-0">Appearance</TabsTrigger>
          <TabsTrigger value="notifications" className="shrink-0">Notifications</TabsTrigger>
          <TabsTrigger value="my-accessories" className="shrink-0 col-span-2 sm:col-span-1">Accessory</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="account" className="space-y-6">
            {/* Profile Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Profile
                </CardTitle>
                <CardDescription>
                  Manage your profile information and account settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="text-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      {/* Upload Icon */}
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors"
                      >
                        <Camera className="h-3 w-3" />
                      </label>

                      {/* Delete Icon */}
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleAvatarDelete}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                        >
                          <Cross className="h-3 w-3" />
                        </button>
                      )}

                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("avatar-upload")?.click()
                      }
                    >
                      Change Photo
                    </Button>
                  </div>

                  {/* Account Info */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Member Since
                      </Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatted}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Account Status
                      </Label>
                      <Badge variant="secondary" className="w-fit">
                        <Shield className="h-3 w-3 mr-1" />
                        {user
                          ? user.status.charAt(0).toUpperCase() +
                            user.status.slice(1)
                          : null}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                          Account Type:
                        </Label>

                        <Badge
                          variant="outline"
                          className="w-fit text-green-600 border-green-200 whitespace-nowrap"
                        >
                          {user ? (
                            user?.planType === "free" ? (
                              <>Free plan</>
                            ) : user.planType === "paid" ? (
                              <>Paid plan</>
                            ) : (
                              <>Local</>
                            )
                          ) : null}
                        </Badge>
                        {user && user?.planType === "free" && (
                          <Badge
                            variant="outline"
                            className="w-fit text-green-600 border-green-200 whitespace-nowrap"
                          >
                            {freeTrialPeriod} day PRO Trial
                          </Badge>
                        )}

                        {user?.planType === "free" && (
                          <Badge
                            variant="outline"
                            className="w-fit text-green-600 border-green-200 whitespace-nowrap"
                          >
                            {remainingDays > 0 ? (
                              <>{remainingDays} days left</>
                            ) : (
                              <>Trial expired</>
                            )}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      {/* <Label className="text-sm font-medium text-muted-foreground">
                        Billing Status
                      </Label>
                      <Badge
                        variant="outline"
                        className="w-fit text-green-600 border-green-200"
                      >
                        Active
                      </Badge> */}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display-name">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="display-name"
                      defaultValue={user?.displayName ?? ""}
                      placeholder="Enter your display name"
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last-name">
                      Last name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="last-name"
                      placeholder="Enter your last name"
                      defaultValue={user?.lastName ?? ""}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={user?.email || ""} readOnly />
                </div>
                {/* <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Write a short bio about yourself"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div> */}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                {/* <Button variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button> */}
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleSavePersonalInfo}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Manage your business details and preferences.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    placeholder="Enter your company name"
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-category">Business Category</Label>
                  <Select
                    value={businessCategory}
                    onValueChange={setBusinessCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARTS/MUSIC/WRITING">
                        ARTS/MUSIC/WRITING
                      </SelectItem>
                      <SelectItem value="BANKING/FINANCE">
                        BANKING/FINANCE
                      </SelectItem>
                      <SelectItem value="BUSINESS MGT">BUSINESS MGT</SelectItem>
                      <SelectItem value="COMMUNICATION">
                        COMMUNICATION
                      </SelectItem>
                      <SelectItem value="CONSTRUCTION">CONSTRUCTION</SelectItem>
                      <SelectItem value="EDUCATION">EDUCATION</SelectItem>
                      <SelectItem value="ENGINEERING">Engineering</SelectItem>
                      <SelectItem value="ENTERTAINMENT">
                        ENTERTAINMENT
                      </SelectItem>
                      <SelectItem value="FARMING">FARMING</SelectItem>
                      <SelectItem value="GOV/POLITICS">GOV/POLITICS</SelectItem>
                      <SelectItem value="HEALTHCARE">HEALTHCARE</SelectItem>
                      <SelectItem value="HOSPITALITY">HOSPITALITY</SelectItem>
                      <SelectItem value="IT/SOFTWARE">IT/SOFTWARE</SelectItem>
                      <SelectItem value="LEGAL">LEGAL</SelectItem>
                      <SelectItem value="MANUFACTURING">
                        MANUFACTURING
                      </SelectItem>
                      <SelectItem value="MILITARY">MILITARY</SelectItem>
                      <SelectItem value="NON-PROFIT">NON-PROFIT</SelectItem>
                      <SelectItem value="REAL ESTATE">REAL ESTATE</SelectItem>
                      <SelectItem value="RETAIL">RETAIL</SelectItem>
                      <SelectItem value="SALES/MARKETING">
                        SALES/MARKETING
                      </SelectItem>
                      <SelectItem value="SCIENCE/RESEARCH">
                        SCIENCE/RESEARCH
                      </SelectItem>
                      <SelectItem value="SELF-EMPLOYED">
                        SELF-EMPLOYED
                      </SelectItem>
                      <SelectItem value="STUDENT">STUDENT</SelectItem>
                      <SelectItem value="TRANSPORTATION">
                        TRANSPORTATION
                      </SelectItem>
                      <SelectItem value="RETIRED">RETIRED</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leads-preference">Leads Preference</Label>
                  {user && (
                    <RadioGroup
                      value={clientsPreference}
                      onValueChange={setClientsPreference}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="both" id="all-leads" />
                        <Label htmlFor="all-leads">Accept all leads</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="local" id="filtered-leads" />
                        <Label htmlFor="filtered-leads">Local leads</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="non-local" id="no-leads" />
                        <Label htmlFor="no-leads">Non-Local leads</Label>
                      </div>
                    </RadioGroup>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                {/* <Button variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button> */}
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleSavePersonalInfo}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password associated with your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2 relative">
                  <Label htmlFor="current">Current password</Label>
                  <Input
                    id="current"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    placeholder="Enter your current password"
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-9 text-gray-500"
                    onClick={() => setShowCurrent((prev) => !prev)}
                  >
                    {showCurrent ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* New Password */}
                <div className="space-y-2 relative">
                  <Label htmlFor="new">New password</Label>
                  <Input
                    id="new"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    placeholder="Enter your new password"
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-9 text-gray-500"
                    onClick={() => setShowNew((prev) => !prev)}
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2 relative">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    placeholder="Enter your confirm password"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-9 text-gray-500"
                    onClick={() => setShowConfirm((prev) => !prev)}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword.length > 0 && (
                  <div>
                    <div className="w-full bg-gray-200 rounded h-2 mb-2">
                      <div
                        className={`h-2 rounded ${progressColor} transition-all duration-300`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <ul className="text-sm space-y-1">
                      <li
                        className={`flex items-center ${
                          passwordChecks.length
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {passwordChecks.length ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Cross className="w-4 h-4 mr-1" />
                        )}
                        Minimum 8 characters
                      </li>
                      <li
                        className={`flex items-center ${
                          passwordChecks.maxLength
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {passwordChecks.maxLength ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Cross className="w-4 h-4 mr-1" />
                        )}
                        Maximum 15 characters
                      </li>
                      <li
                        className={`flex items-center ${
                          passwordChecks.lowercase
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {passwordChecks.lowercase ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Cross className="w-4 h-4 mr-1" />
                        )}
                        At least 1 lowercase
                      </li>
                      <li
                        className={`flex items-center ${
                          passwordChecks.uppercase
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {passwordChecks.uppercase ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Cross className="w-4 h-4 mr-1" />
                        )}
                        At least 1 uppercase
                      </li>
                      <li
                        className={`flex items-center ${
                          passwordChecks.number
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {passwordChecks.number ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Cross className="w-4 h-4 mr-1" />
                        )}
                        At least 1 number
                      </li>
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                {/* <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Cancel
                </Button> */}
                <Button onClick={handleChangePassword}>Save password</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Subscription Plans */}
              <div className="lg:col-span-2 space-y-4">
                {/* FREE Plan */}
                {user?.planType === "free" ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <CreditCard className="h-6 w-6 text-muted-foreground shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold text-lg leading-tight">
                              FREE!! - SoloBizCards Membership
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              No Billing
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 justify-end sm:justify-start w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-dashed border-border">
                          <Link href="/pricing" passHref className="w-full sm:w-auto">
                            <Button
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto justify-center"
                            >
                              Upgrade
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : user?.planType === "paid" && !isPast ? (
                  // Current active paid plan
                  <Card>
                    <CardContent className="p-6">
                      {loading ? (
                        <div className="flex justify-center items-center py-6">
                          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <CreditCard className="h-6 w-6 text-muted-foreground shrink-0 mt-1" />
                              <div>
                                <h3 className="font-semibold text-lg leading-tight">
                                  PAID!! - SoloBizCards PRO Membership
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Pro Upgrade + Lead Billing History
                                </p>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {plan?.status === "trialing" ? (
                                    <div>
                                      Trial Period: {startDate} - {endDate}
                                      <br />
                                      <b className="text-xs">
                                        Note: The subscription will start once
                                        the trial period is completed.
                                      </b>
                                    </div>
                                  ) : (
                                    <p>
                                      {startDate !== "N/A" && endDate !== "N/A" ? (
                                        <>
                                          Subscription Period: {startDate} - {endDate}
                                        </>
                                      ) : startDate !== "N/A" ? (
                                        <>Subscription Started: {startDate}</>
                                      ) : (
                                        <>Status: Active Membership</>
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 justify-end sm:justify-start w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-dashed border-border">
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700 border-green-200"
                              >
                                Current
                              </Badge>

                              {plan?.subscription
                                ?.canceledAtPeriodEnd ? null : (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      Cancel
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {!isWithin30Days
                                          ? "Cancel Subscription?"
                                          : "Cannot Cancel Subscription"}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {!isWithin30Days
                                          ? "Are you sure you want to cancel this subscription? You’ll still have access until the end of the billing period."
                                          : "You cannot cancel the subscription because 30 days have passed since your plan started. Contact admin for further info."}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Close
                                      </AlertDialogCancel>
                                      {!isWithin30Days ? (
                                        <AlertDialogAction
                                          onClick={async () => {
                                            setIsLoading(true);
                                            try {
                                              const res = await fetch(
                                                "/api/create-subscription",
                                                {
                                                  method: "POST",
                                                  headers: {
                                                    "Content-Type":
                                                      "application/json",
                                                  },
                                                  body: JSON.stringify({
                                                    userId: user.uid,
                                                    action: "cancel",
                                                  }),
                                                }
                                              );
                                              const data = await res.json();
                                              if (data.error)
                                                throw new Error(data.error);
                                              setIsLoading(false);
                                              showToast(
                                                data.message ||
                                                  "Subscription canceled successfully!",
                                                "success"
                                              );
                                            } catch (err: any) {
                                              alert(
                                                err.message ||
                                                  "Failed to cancel subscription"
                                              );
                                            }
                                          }}
                                        >
                                          Yes, Cancel
                                        </AlertDialogAction>
                                      ) : (
                                        <AlertDialogAction
                                          onClick={() => {
                                            router.push("/dashboard/support");
                                          }}
                                        >
                                          Contact Admin
                                        </AlertDialogAction>
                                      )}
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  // Past/expired subscription
                  isPast && (
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <CreditCard className="h-6 w-6 text-muted-foreground shrink-0 mt-1" />
                            <div>
                              <h3 className="font-semibold text-lg leading-tight">
                                PAID!! - SoloBizCards PRO Membership
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Pro Upgrade, No Billing
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 justify-end sm:justify-start w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-dashed border-border">
                            <Badge
                              variant="destructive"
                              className="bg-red-100 text-red-700 border-red-200"
                            >
                              Past Due
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const res = await fetch(
                                    "/api/create-subscription",
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        userId: user.uid,
                                        action: "renew",
                                      }),
                                    }
                                  );
                                  const data = await res.json();
                                  if (data.error) throw new Error(data.error);
                                  alert(
                                    data.message ||
                                      "Subscription renewed successfully!"
                                  );
                                  window.location.reload();
                                } catch (err: any) {
                                  alert(
                                    err.message ||
                                      "Failed to renew subscription"
                                  );
                                }
                              }}
                            >
                              Renew
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}

                {/* Grandchild Lead Exports Purchases */}
                {leadExportsData && leadExportsData.length > 0 && (
                  <div className="space-y-4 pt-1">
                    {leadExportsData.map((leadExp) => {
                      const paidAtDate = leadExp.paidAt?.toDate
                        ? leadExp.paidAt.toDate()
                        : leadExp.paidAt?.seconds
                        ? new Date(leadExp.paidAt.seconds * 1000)
                        : leadExp.paidAt
                        ? new Date(leadExp.paidAt)
                        : null;
                      const expiresAtDate = leadExp.expiresAt?.toDate
                        ? leadExp.expiresAt.toDate()
                        : leadExp.expiresAt?.seconds
                        ? new Date(leadExp.expiresAt.seconds * 1000)
                        : leadExp.expiresAt
                        ? new Date(leadExp.expiresAt)
                        : null;
                      const isValidExpiry =
                        expiresAtDate instanceof Date &&
                        !isNaN(expiresAtDate.getTime());
                      const isActive =
                        isValidExpiry && expiresAtDate.getTime() > Date.now();
                      const diffMs = isActive
                        ? expiresAtDate.getTime() - Date.now()
                        : 0;
                      const daysRemaining = Math.max(
                        0,
                        Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                      );

                      return (
                        <Card key={leadExp.id} className="border border-border">
                          <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <Download className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-semibold text-lg leading-tight">
                                      Grandchild Leads Export
                                    </h3>
                                    {isActive ? (
                                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2.5 py-0.5 font-medium shadow-none hover:bg-emerald-50">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                                        Active · {daysRemaining}{" "}
                                        {daysRemaining === 1 ? "day" : "days"} left
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-xs px-2 py-0.5 text-muted-foreground bg-muted/30"
                                      >
                                        Access Expired
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {leadExp.leadCount || 0} Leads Exported · $
                                    {Number(leadExp.amount || 0).toFixed(2)}
                                  </p>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    <p>
                                      Access Window:{" "}
                                      {paidAtDate ? formatDateWithOrdinal(paidAtDate) : "N/A"}{" "}
                                      -{" "}
                                      {expiresAtDate
                                        ? formatDateWithOrdinal(expiresAtDate)
                                        : "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 justify-end sm:justify-start w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-dashed border-border">
                                <Link href="/dashboard/referrals">
                                  <Button size="sm" variant={isActive ? "default" : "outline"}>
                                    {isActive ? "Download in Referrals" : "Repurchase in Referrals"}
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column - Account Details */}
              <div className="space-y-4">
                {/* Current Plan */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="flex justify-center items-center py-6">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        <div className="pb-3">
                          <h3 className="font-semibold">
                            {plan?.planName ? plan.planName : "Free Plan"}
                          </h3>

                          <p className="text-sm text-muted-foreground">
                            {plan?.billing === "year" ? (
                              <>${plan?.price} / Yearly</>
                            ) : plan?.billing === "month" ? (
                              <>${plan?.price} / Monthly</>
                            ) : (
                              <></>
                            )}
                          </p>

                          {/* Show addons only if plan is not free */}
                          {plan?.planName?.toLowerCase() !== "free plan" &&
                            Array.isArray(addons) &&
                            addons.length > 0 && (
                              <>
                                {addons.map((addon, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2"
                                  >
                                    <div>
                                      <h3 className="font-semibold">
                                        {addon.name}
                                      </h3>
                                      <p className="text-sm text-muted-foreground">
                                        {addon.price
                                          ? `$${addon.price} / ${
                                              addon.billing === "annual"
                                                ? "Yearly"
                                                : "Monthly"
                                            }`
                                          : ""}
                                      </p>
                                    </div>

                                    {/* Cancel Addon Button with AlertDialog */}
                                    {/* Cancel Addon Button with AlertDialog */}
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="outline">
                                          Cancel
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            {!isWithin30Days
                                              ? `Cancel Addon?`
                                              : `Cannot Cancel Addon`}
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            {!isWithin30Days
                                              ? `Are you sure you want to cancel the addon "${addon.name}"? You’ll still have access until the end of the billing period.`
                                              : `You cannot cancel the addon "${addon.name}" because 30 days have passed since it was added.`}
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Close
                                          </AlertDialogCancel>
                                          {!isWithin30Days && (
                                            <AlertDialogAction
                                              onClick={async () => {
                                                if (!addon.subscriptionId)
                                                  return;
                                                setIsLoading(true);
                                                try {
                                                  const res = await fetch(
                                                    "/api/create-subscription",
                                                    {
                                                      method: "POST",
                                                      headers: {
                                                        "Content-Type":
                                                          "application/json",
                                                      },
                                                      body: JSON.stringify({
                                                        userId: user.uid,
                                                        action: "cancel-addon",
                                                        addonSubscriptionId:
                                                          addon.subscriptionId,
                                                      }),
                                                    }
                                                  );
                                                  const data = await res.json();
                                                  if (data.error)
                                                    throw new Error(data.error);
                                                  setIsLoading(false);
                                                  showToast(
                                                    data.message ||
                                                      "Addon canceled successfully!",
                                                    "success"
                                                  );
                                                  window.location.reload();
                                                } catch (err: any) {
                                                  setIsLoading(false);
                                                  alert(
                                                    err.message ||
                                                      "Failed to cancel addon"
                                                  );
                                                }
                                              }}
                                            >
                                              Yes, Cancel
                                            </AlertDialogAction>
                                          )}
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                ))}
                              </>
                            )}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className={`w-full ${
                            user?.planType !== "free" &&
                            user?.subscriptionEndDate?.toDate() > new Date()
                              ? "cursor-not-allowed"
                              : ""
                          }`}
                          onClick={async () => {
                            if (user?.planType === "free") {
                              window.location.href = "/pricing";
                              return;
                            }
                          }}
                        >
                          Change Plan
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Method</CardTitle>
                    <CardDescription>
                      Manage your payment details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="flex justify-center items-center py-6">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                      </div>
                    ) : paymentMethod?.card?.exp_month &&
                      paymentMethod?.card?.exp_year ? (
                      <>
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {paymentMethod?.card?.brand} ending in{" "}
                              {paymentMethod?.card?.last4}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Expires {paymentMethod?.card?.exp_month}/
                              {paymentMethod?.card?.exp_year}
                            </p>
                          </div>
                        </div>
                        {/* <Button
        size="sm"
        variant="link"
        className="p-0 h-auto text-primary"
      >
        Manage
      </Button> */}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No payment method available
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Billing History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Billing History</CardTitle>
                    <CardDescription>Recent payments.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loading ? (
                      <div className="flex justify-center items-center py-6">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        {plan?.status === "trialing" ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  {startDate}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  $0.00
                                </p>
                              </div>
                            </div>
                            <a href={plan?.invoicePdf} download>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                          </div>
                        ) : combinedBilling && combinedBilling.length > 0 ? (
                          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                            {combinedBilling.map((bill: any, index: number) => {
                              const formatDate = (date: any) => {
                                if (!date || isNaN(date.getTime())) return "N/A";
                                const day = date.getDate();
                                const month = date.toLocaleString("default", {
                                  month: "long",
                                });
                                const year = date.getFullYear();

                                const ordinal = (n: number) => {
                                  if (n > 3 && n < 21) return "th";
                                  switch (n % 10) {
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

                                return `${day}${ordinal(day)} ${month} ${year}`;
                              };

                              return (
                                <div
                                  key={bill.id || index}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm font-medium">
                                        {bill.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatDate(bill.date)} · {bill.amount}
                                      </p>
                                    </div>
                                  </div>
                                  {bill.invoicePdf ? (
                                    <a href={bill.invoicePdf} target="_blank" rel="noopener noreferrer" download>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </a>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No billing history.</p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the appearance of the app.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="theme">Dark Mode</Label>
                    <Switch
                      id="theme"
                      checked={theme === "dark"}
                      onClick={toggleTheme}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Turn on dark mode to reduce eye strain and save battery.
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="density">Compact Mode</Label>
                    <Switch id="density" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Make the UI more compact to fit more content on the screen.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">
                  Notification Preferences
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configure how and when you want to be notified.
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Email Notifications */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <Label>Email Notifications</Label>
                    </div>
                    <Switch
                      checked={emailNotifs}
                      onCheckedChange={setEmailNotifs}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email.
                  </p>
                </div>

                <Separator />

                {/* Order Updates */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <Label>Order Updates</Label>
                    </div>
                    <Switch
                      checked={orderUpdates}
                      onCheckedChange={setOrderUpdates}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your orders.
                  </p>
                </div>

                <Separator />

                {/* Marketing */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <Label>Marketing Emails</Label>
                    </div>
                    <Switch
                      checked={marketing}
                      onCheckedChange={setMarketing}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new products and features.
                  </p>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  onClick={savePreferences}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save preferences"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="my-accessories" className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* NFC Cards / Accessories Container */}
              <div className="flex-1 w-full min-w-0">
                <Card>
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6">
                    <div>
                      <CardTitle className="text-xl">
                        Accessories{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          ({nfcCardsCount})
                        </span>
                      </CardTitle>
                      <CardDescription>Update your NFC Cards & Accessories Details</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/dashboard/accessories")}
                      className="gap-2 self-start sm:self-auto shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Accessories Page</span>
                    </Button>
                  </CardHeader>

              <CardContent className="space-y-4">
                {/* NFC CARD */}

                {/* Front and Back Cards - Inline Layout */}

                <div className="flex flex-col sm:flex-row gap-4 grid grid-cols-1 sm:grid-cols-4 gap-4 hidden">
                  {/* Front Card */}
                  <div className="flex-1 space-y-2">
                    {invoices?.map((invoiceDoc: any) => {
                      return invoiceDoc?.accessory_invoices?.map((allitem) => {
                        return allitem.items?.map((item, itemIndex) => {
                          // if (item.cardDetails.assignedDigitalCard) {
                          // return item.cardDetails?.map(
                          //   (ass, assIndex) => {
                          if (item?.productType === "sticker") return null;
                          return (
                            <>
                              <div key={`${itemIndex}`}>
                                {/* <Label className="text-sm font-medium">Front</Label> */}
                                <div
                                  style={{
                                    borderRadius: "12px",
                                  }}
                                >
                                  <div
                                    className="rounded-2xl p-0 aspect-[1.6/1] flex items-center justify-center shadow-xl"
                                    style={{
                                      background:
                                        colorSchemes[item?.color]?.bg ||
                                        colorSchemes.black.bg,
                                    }}
                                  >
                                    {/* ESSENTIAL */}
                                    {item?.selectedCard === "essential" && (
                                      <div className="flex items-center justify-center">
                                        <div
                                          className="text-3xl font-bold"
                                          style={{
                                            color:
                                              colorSchemes[item?.color]?.text ||
                                              colorSchemes.black.text,
                                          }}
                                        >
                                          Solo
                                        </div>
                                      </div>
                                    )}

                                    {/* INFINITE */}
                                    {item?.selectedCard === "infinite" && (
                                      <div className="relative w-full h-full flex flex-col p-6">
                                        <div className="absolute top-6 right-6 w-12 h-12 rounded-lg flex items-center justify-center">
                                          {item?.cardDetails.useLogoImage &&
                                          item?.cardDetails?.personalizeLogo ? (
                                            <img
                                              src={`/api/image-proxy?url=${encodeURIComponent(
                                                item?.cardDetails
                                                  ?.personalizeLogo
                                              )}`}
                                              // src={}
                                              alt="Logo"
                                              className="max-w-full max-h-full object-contain rounded-lg"
                                            />
                                          ) : !item?.cardDetails
                                              .useLogoImage ? (
                                            <div
                                              className="text-xs font-bold text-center"
                                              style={{
                                                color:
                                                  colorSchemes[item?.color]
                                                    ?.text ||
                                                  colorSchemes.black.text,
                                              }}
                                            >
                                              {item?.cardDetails.logoText}
                                            </div>
                                          ) : null}
                                        </div>

                                        <div
                                          className="absolute bottom-6 left-6 flex flex-col"
                                          style={{
                                            color:
                                              colorSchemes[item?.color]?.text ||
                                              colorSchemes.black.text,
                                          }}
                                        >
                                          <div
                                            className="text-base font-medium"
                                            dangerouslySetInnerHTML={{
                                              __html:
                                                item?.cardDetails.companyName,
                                            }}
                                          />
                                          <div
                                            className="text-xl font-semibold"
                                            dangerouslySetInnerHTML={{
                                              __html:
                                                item?.cardDetails.firstName,
                                            }}
                                          />
                                          <div
                                            className="text-base"
                                            dangerouslySetInnerHTML={{
                                              __html:
                                                item?.cardDetails
                                                  .additionalInfo,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* CUSTOM - IMAGE + TEXT */}
                                    {item?.selectedCard === "custom" &&
                                      item?.cardDetails.customCardDesignType ===
                                        "image-text" && (
                                        <div className="relative w-full h-full">
                                          {item?.cardDetails?.customLogo ? (
                                            <img
                                              src={`/api/image-proxy?url=${encodeURIComponent(
                                                item?.cardDetails.customLogo
                                              )}`}
                                              // src={item?.cardDetails.customLogo}
                                              alt="Custom Design"
                                              className="w-full h-full object-contain rounded-xl"
                                            />
                                          ) : (
                                            <div
                                              className="w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center"
                                              style={{
                                                borderColor:
                                                  "rgba(255,255,255,0.3)",
                                                color:
                                                  item?.color === "black"
                                                    ? "#FFFFFF"
                                                    : colorSchemes[item?.color]
                                                        ?.text,
                                              }}
                                            >
                                              <div className="text-xl font-bold mb-2">
                                                CUSTOM
                                              </div>
                                              <div className="text-sm mb-3">
                                                Upload your design here
                                              </div>
                                              <div className="text-xs opacity-70">
                                                Aspect ratio 1.6:1
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                    {/* CUSTOM - IMAGE + IMAGE */}
                                    {item?.selectedCard === "custom" &&
                                      item?.cardDetails.customCardDesignType ===
                                        "image-image" && (
                                        <div className="relative w-full h-full">
                                          {item?.cardDetails?.frontLogo ? (
                                            <img
                                              src={`/api/image-proxy?url=${encodeURIComponent(
                                                item?.cardDetails?.frontLogo
                                              )}`}
                                              //src={item?.cardDetails?.frontLogo}
                                              alt="Custom Design"
                                              className="w-full h-full object-cover rounded-xl"
                                            />
                                          ) : (
                                            <div
                                              className="w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center"
                                              style={{
                                                borderColor:
                                                  "rgba(255,255,255,0.3)",
                                                color:
                                                  item?.color === "black"
                                                    ? "#FFFFFF"
                                                    : colorSchemes[item?.color]
                                                        ?.text,
                                              }}
                                            >
                                              <div className="text-xl font-bold mb-2">
                                                CUSTOM
                                              </div>
                                              <div className="text-sm mb-3">
                                                Upload your design here
                                              </div>
                                              <div className="text-xs opacity-70">
                                                Aspect ratio 1.6:1
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        });
                      });
                    })}
                  </div>

                  {/* Back Card */}
                  <div className="flex-1 space-y-2">
                    {invoices?.map((invoiceDoc: any) => {
                      return invoiceDoc?.accessory_invoices?.map((allitem) => {
                        return allitem.items?.map((item, index) => {
                          // if (item?.cardDetails?.assignedDigitalCard) {
                          // return item.cardDetails.assignedDigitalCard?.map(
                          //   (ass, assIndex) => {
                          const qrCode = qrCodes[index];
                          if (item?.productType != "sticker") {
                            return (
                              <>
                                <div key={`${index}`}>
                                  <div
                                    style={{
                                      borderRadius: "12px",
                                    }}
                                  >
                                    <div
                                      key={index}
                                      className="rounded-2xl p-6 aspect-[1.6/1] flex flex-col justify-between shadow-xl relative overflow-hidden"
                                      style={{
                                        background:
                                          colorSchemes[item?.color]?.bg ||
                                          colorSchemes.black.bg,
                                        color:
                                          colorSchemes[item?.color]?.text ||
                                          colorSchemes.black.text,
                                      }}
                                    >
                                      {item?.selectedCard === "essential" && (
                                        // Solo Essential
                                        <div className="flex items-center justify-center h-full">
                                          <div className="bg-white p-[0.2rem] rounded-lg">
                                            <img
                                              src={
                                                qrCode ||
                                                "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                              }
                                              alt="QR Code"
                                              className="w-16 h-16"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {item?.selectedCard === "infinite" && (
                                        <>
                                          <div className="flex justify-end">
                                            <div className="bg-white p-[0.2rem] rounded-lg">
                                              <img
                                                src={
                                                  qrCode ||
                                                  "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                                }
                                                alt="QR Code"
                                                className="w-16 h-16"
                                              />
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 justify-start">
                                            {item?.cardDetails?.optionalText ? (
                                              <span className="text-lg font-semibold">
                                                {
                                                  item?.cardDetails
                                                    ?.optionalText
                                                }
                                              </span>
                                            ) : (
                                              <span className="text-lg font-semibold">
                                                Solo
                                              </span>
                                            )}
                                          </div>
                                        </>
                                      )}

                                      {/* 🔵 CUSTOM BACK – IMAGE + TEXT */}
                                      {item?.selectedCard === "custom" &&
                                      item?.cardDetails
                                        ?.customCardDesignType !==
                                        "image-image" ? (
                                        item?.cardDetails?.hideTextOnBack ? (
                                          // If hideTextOnBack is true → show only QR code on blank background
                                          <div className="absolute inset-0 rounded-2xl overflow-hidden">
                                            <div className="absolute top-2 right-2 bg-white p-[0.2rem] rounded-lg">
                                              <img
                                                src={
                                                  qrCode ||
                                                  "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                                }
                                                alt="QR Code"
                                                className="w-16 h-16"
                                              />
                                            </div>
                                          </div>
                                        ) : (
                                          // Else show the full text + QR code layout
                                          <div className="flex justify-between h-full">
                                            <div className="flex flex-col justify-between text-xs h-full">
                                              <div className="space-y-0.5">
                                                <div
                                                  className="font-semibold text-sm"
                                                  dangerouslySetInnerHTML={{
                                                    __html:
                                                      item?.cardDetails
                                                        .firstName,
                                                  }}
                                                />
                                                <div
                                                  className="font-medium"
                                                  dangerouslySetInnerHTML={{
                                                    __html:
                                                      item?.cardDetails
                                                        .additionalInfo,
                                                  }}
                                                />
                                              </div>

                                              <div className="space-y-0.5 text-[10px]">
                                                <div
                                                  className="opacity-90"
                                                  dangerouslySetInnerHTML={{
                                                    __html:
                                                      item?.cardDetails
                                                        .companyName,
                                                  }}
                                                />
                                                <div>
                                                  {item?.cardDetails.phone}
                                                </div>
                                                <div>
                                                  {item?.cardDetails.email}
                                                </div>
                                                <div>
                                                  {item?.cardDetails.website}
                                                </div>
                                                <div>
                                                  {formatAddress(
                                                    item?.cardDetails.address,
                                                    item?.cardDetails.city,
                                                    item?.cardDetails.state,
                                                    item?.cardDetails.zipCode
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            <div className="bg-white p-[0.2rem] rounded-lg self-start">
                                              <img
                                                src={
                                                  qrCode ||
                                                  "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                                }
                                                alt="QR Code"
                                                className="w-16 h-16"
                                              />
                                            </div>
                                          </div>
                                        )
                                      ) : null}

                                      {item?.selectedCard === "custom" &&
                                      item?.cardDetails
                                        ?.customCardDesignType ===
                                        "image-image" ? (
                                        <div className="absolute inset-0 rounded-2xl overflow-hidden">
                                          {item?.cardDetails?.backLogo ? (
                                            <img
                                              src={`/api/image-proxy?url=${encodeURIComponent(
                                                item?.cardDetails?.backLogo
                                              )}`}
                                              //src={item?.cardDetails?.backLogo}
                                              alt="Back Card Design"
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div
                                              className="w-full h-full border-2 border-dashed flex flex-col items-center justify-center text-center"
                                              style={{
                                                borderColor:
                                                  "rgba(255,255,255,0.3)",
                                                color:
                                                  item?.color === "black"
                                                    ? "#FFFFFF"
                                                    : colorSchemes[item?.color]
                                                        ?.text,
                                              }}
                                            >
                                              <div className="text-xl font-bold mb-2">
                                                BACK
                                              </div>
                                              <div className="text-sm mb-3">
                                                Upload back design
                                              </div>
                                              <div className="text-xs opacity-70">
                                                Aspect ratio 1.6:1
                                              </div>
                                            </div>
                                          )}

                                          {/* QR Positioning */}
                                          {item?.cardDetails
                                            ?.showQRCodeOnBack && (
                                            <div
                                              className={`absolute bg-white p-[0.2rem] rounded-lg ${
                                                item?.cardDetails
                                                  ?.qrCodePosition ===
                                                "top-left"
                                                  ? "top-6 left-6"
                                                  : item?.cardDetails
                                                      ?.qrCodePosition ===
                                                    "top-right"
                                                  ? "top-6 right-6"
                                                  : item?.cardDetails
                                                      ?.qrCodePosition ===
                                                    "bottom-left"
                                                  ? "bottom-6 left-6"
                                                  : item?.cardDetails
                                                      ?.qrCodePosition ===
                                                    "bottom-right"
                                                  ? "bottom-6 right-6"
                                                  : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                              }`}
                                            >
                                              <img
                                                src={
                                                  qrCode ||
                                                  "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                                }
                                                alt="QR Code"
                                                className="w-16 h-16"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </>
                            );
                          }
                          return null;
                        });
                        // }
                        //   );
                        // }
                        // return null;
                      });
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  {hasNfcCards ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {nfcCards.map((nfc, index) => {
                        const isSelected = selectedNfc === nfc.card_id;
                        const item = invoices
                          .flatMap(
                            (invoice) => invoice.accessory_invoices ?? []
                          )
                          .flatMap((item) => item.items ?? [])
                          .find((item) =>
                            item.orderItemId?.includes(nfc.orderItemId)
                          );
                        const qrCodes =
                          item?.productType == "sticker"
                            ? qrCodesForStickers[index]
                            : "";
                        return (
                          <button
                            key={nfc.id}
                            type="button"
                            onClick={() => setSelectedNfc(nfc.card_id)}
                            className={`border rounded-xl p-4 text-left transitionhover:border-blue-500
                                ${
                                  isSelected
                                    ? "ring-2 ring-blue-500 border-blue-500"
                                    : "border-gray-200"
                                }
                              `}
                          >
                            {item?.productType == "sticker" ? (
                              <>
                                <div key={`${nfc.orderItemId}`}>
                                  <div
                                    style={{
                                      borderRadius: "12px",
                                    }}
                                  >
                                    {/* Bottom Sticker Layout */}
                                    {/* <div className="w-auto md:w-auto lg:w-1/2 xl:w-1/2 mb-6"> */}
                                    <div className="w-[227px] h-[151px] aspect-[3/2]">
                                      <div
                                        className="bg-gray-900 rounded-2xl px-3 py-3 shadow-lg flex items-center justify-between h-full w-full gap-3"
                                        style={{
                                          background:
                                            colorSchemes[
                                              item?.cardDetails.tapStickerColor
                                            ]?.bg || colorSchemes.black.bg,
                                          color:
                                            colorSchemes[item?.color]?.text ||
                                            colorSchemes.black.text,
                                        }}
                                      >
                                        {/* Left side - Logo or Text */}
                                        <div className="flex h-full w-full gap-3 justify-center">
                                          <div className="flex-[7] flex items-center justify-center">
                                            {item?.cardDetails.useLogoImage &&
                                            item?.cardDetails.tapStickerLogo ? (
                                              <img
                                                src={`/api/image-proxy?url=${encodeURIComponent(
                                                  item?.cardDetails
                                                    .tapStickerLogo
                                                )}`}
                                                //src={item?.cardDetails.tapStickerLogo}
                                                alt="Logo"
                                                className="object-contain opacity-80 rounded-lg w-[200px] h-[140px]"
                                              />
                                            ) : // ) : item?.cardDetails.useLogoImage &&
                                            //   !item?.cardDetails.tapStickerLogo ? (
                                            //   <>
                                            //     <span className="text-[10px] font-bold text-gray-400 text-center text-lg font-semibold mt-6">
                                            //       SOLO
                                            //     </span>
                                            //   </>
                                            !item?.cardDetails.useLogoImage ? (
                                              <span className="text-[10px] font-bold text-gray-400 text-center text-lg font-semibold w-full">
                                                {item?.cardDetails
                                                  .tapStickerText || "SOLO"}
                                              </span>
                                            ) : null}
                                          </div>

                                          {/* Right side - Solo + QR Code */}
                                          <div className="flex flex-col items-center gap-3 justify-center">
                                            {item?.cardDetails.useLogoImage &&
                                              !item?.cardDetails
                                                .tapStickerLogo && (
                                                <span className="text-gray-400 text-sm font-medium tracking-wide">
                                                  Solo
                                                </span>
                                              )}
                                            <div className="bg-white p-[0.2rem] rounded-lg">
                                              <img
                                                src={
                                                  qrCodes ||
                                                  "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                                }
                                                alt="QR Code"
                                                className="w-12 h-12 opacity-80"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* </div> */}
                                </div>
                              </>
                            ) : (
                              <>
                                <div key={`${nfc.orderItemId}`}>
                                  {/* <Label className="text-sm font-medium">Front</Label> */}
                                  <div
                                    style={{
                                      borderRadius: "12px",
                                    }}
                                  >
                                    <div
                                      className="rounded-2xl p-0 aspect-[1.6/1] flex items-center justify-center shadow-xl"
                                      style={{
                                        background:
                                          colorSchemes[item?.color]?.bg ||
                                          colorSchemes.black.bg,
                                      }}
                                    >
                                      {/* ESSENTIAL */}
                                      {item?.selectedCard === "essential" && (
                                        <div className="flex items-center justify-center">
                                          <div
                                            className="text-3xl font-bold"
                                            style={{
                                              color:
                                                colorSchemes[item?.color]
                                                  ?.text ||
                                                colorSchemes.black.text,
                                            }}
                                          >
                                            Solo
                                          </div>
                                        </div>
                                      )}

                                      {/* INFINITE */}
                                      {item?.selectedCard === "infinite" && (
                                        <div className="relative w-full h-full flex flex-col p-6">
                                          <div className="absolute top-6 right-6 w-12 h-12 rounded-lg flex items-center justify-center">
                                            {item?.cardDetails.useLogoImage &&
                                            item?.cardDetails
                                              ?.personalizeLogo ? (
                                              <img
                                                src={`/api/image-proxy?url=${encodeURIComponent(
                                                  item?.cardDetails
                                                    ?.personalizeLogo
                                                )}`}
                                                // src={}
                                                alt="Logo"
                                                className="max-w-full max-h-full object-contain rounded-lg"
                                              />
                                            ) : !item?.cardDetails
                                                .useLogoImage ? (
                                              <div
                                                className="text-xs font-bold text-center"
                                                style={{
                                                  color:
                                                    colorSchemes[item?.color]
                                                      ?.text ||
                                                    colorSchemes.black.text,
                                                }}
                                              >
                                                {item?.cardDetails.logoText}
                                              </div>
                                            ) : null}
                                          </div>

                                          <div
                                            className="absolute bottom-6 left-6 flex flex-col"
                                            style={{
                                              color:
                                                colorSchemes[item?.color]
                                                  ?.text ||
                                                colorSchemes.black.text,
                                            }}
                                          >
                                            <div
                                              className="text-base font-medium"
                                              dangerouslySetInnerHTML={{
                                                __html:
                                                  item?.cardDetails.companyName,
                                              }}
                                            />
                                            <div
                                              className="text-xl font-semibold"
                                              dangerouslySetInnerHTML={{
                                                __html:
                                                  item?.cardDetails.firstName,
                                              }}
                                            />
                                            <div
                                              className="text-base"
                                              dangerouslySetInnerHTML={{
                                                __html:
                                                  item?.cardDetails
                                                    .additionalInfo,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* CUSTOM - IMAGE + TEXT */}
                                      {item?.selectedCard === "custom" &&
                                        item?.cardDetails
                                          .customCardDesignType ===
                                          "image-text" && (
                                          <div className="relative w-full h-full">
                                            {item?.cardDetails?.customLogo ? (
                                              <img
                                                src={`/api/image-proxy?url=${encodeURIComponent(
                                                  item?.cardDetails.customLogo
                                                )}`}
                                                // src={item?.cardDetails.customLogo}
                                                alt="Custom Design"
                                                className="w-full h-full object-contain rounded-xl"
                                              />
                                            ) : (
                                              <div
                                                className="w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center"
                                                style={{
                                                  borderColor:
                                                    "rgba(255,255,255,0.3)",
                                                  color:
                                                    item?.color === "black"
                                                      ? "#FFFFFF"
                                                      : colorSchemes[
                                                          item?.color
                                                        ]?.text,
                                                }}
                                              >
                                                <div className="text-xl font-bold mb-2">
                                                  CUSTOM
                                                </div>
                                                <div className="text-sm mb-3">
                                                  Upload your design here
                                                </div>
                                                <div className="text-xs opacity-70">
                                                  Aspect ratio 1.6:1
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                      {/* CUSTOM - IMAGE + IMAGE */}
                                      {item?.selectedCard === "custom" &&
                                        item?.cardDetails
                                          .customCardDesignType ===
                                          "image-image" && (
                                          <div className="relative w-full h-full">
                                            {item?.cardDetails?.frontLogo ? (
                                              <img
                                                src={`/api/image-proxy?url=${encodeURIComponent(
                                                  item?.cardDetails?.frontLogo
                                                )}`}
                                                //src={item?.cardDetails?.frontLogo}
                                                alt="Custom Design"
                                                className="w-full h-full object-cover rounded-xl"
                                              />
                                            ) : (
                                              <div
                                                className="w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center"
                                                style={{
                                                  borderColor:
                                                    "rgba(255,255,255,0.3)",
                                                  color:
                                                    item?.color === "black"
                                                      ? "#FFFFFF"
                                                      : colorSchemes[
                                                          item?.color
                                                        ]?.text,
                                                }}
                                              >
                                                <div className="text-xl font-bold mb-2">
                                                  CUSTOM
                                                </div>
                                                <div className="text-sm mb-3">
                                                  Upload your design here
                                                </div>
                                                <div className="text-xs opacity-70">
                                                  Aspect ratio 1.6:1
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            {/* CARD TITLE */}
                            <div className="space-y-1 mt-3">
                              <p className="font-medium">
                                {item?.productVariant}
                              </p>
                              <p className="text-sm text-gray-500 capitalize">
                                Status : {nfc.status}
                              </p>
                              <p className="text-sm text-gray-500 capitalize">
                                Activation Date : {formatDate(nfc.activated_at)}
                              </p>
                              <p className="text-sm text-gray-500 capitalize">
                                Tap/Scan Count : {nfc.view_count || 0}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No NFC cards available
                    </p>
                  )}
                </div>

                {hasNfcCards && isNfcSelected && (
                  <>
                    {/* STATUS */}
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={selectedStatus}
                        onValueChange={setSelectedStatus}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* BUSINESS CARD */}
                    <div className="space-y-2">
                      <Label>Business Card</Label>
                      <Select
                        value={selectedCard}
                        onValueChange={setSelectedCard}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Business Card" />
                        </SelectTrigger>
                        <SelectContent>
                          {cards.map((card) => (
                            <SelectItem key={card?.urlName} value={card?.urlName}>
                              {card?.urlName || "Untitled Card"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>

              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSaveNFCCardsInfo}
                  disabled={loading || !hasNfcCards || !isNfcSelected}
                >
                  {loading ? "Saving..." : "Save changes"}
                </Button>
              </CardFooter>
            </Card>
              </div>

              {/* Add Accessory Card */}
              <div className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-24">
                <div
                  onClick={() => router.push("/dashboard/accessories")}
                  className="bg-card rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group hover:shadow-md min-h-[180px] sm:min-h-[220px]"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Plus className="w-7 h-7 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-base">
                    Add Accessory
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Click here to add new accessory
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
