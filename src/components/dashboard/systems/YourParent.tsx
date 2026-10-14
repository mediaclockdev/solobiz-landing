"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Eye,
  Info,
  Copy,
  Users,
  TrendingUp,
  Target,
  Star,
  Gift,
  Clock,
  User,
  CreditCard,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useNavigate } from "@/lib/navigation";
import { BusinessCard } from "@/types/businessCard";
import { Lightbox } from "@/components/ui/lightbox";
import { getActiveAppointmentLabel } from "@/utils/appointments";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface YourParentProps {
  className?: string;
}

export function YourParent({ className }: YourParentProps = {}) {
  const { user, isLoading: authLoading } = useAuth();
  const [showLightbox, setShowLightbox] = useState(false);
  const [showGrandparentLightbox, setShowGrandparentLightbox] = useState(false);
  const [showGrandParentInfo, setShowGrandParentInfo] = useState(false);
  const createdAt = user?.metadata?.creationTime ?? new Date();
  const date = new Date(createdAt);
  const pathname = usePathname();

  const handleOpenLink = (url?: string) => {
    if (!url) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    if (/^https?:\/\//i.test(trimmed)) {
      window.open(trimmed, "_blank", "noopener,noreferrer");
    } else if (trimmed.startsWith("/")) {
      navigate(trimmed);
    } else {
      window.open(`https://${trimmed}`, "_blank", "noopener,noreferrer");
    }
  };

  const options = { day: "2-digit", month: "short", year: "numeric" };
  //@ts-ignore
  let formatted = date.toLocaleDateString("en-GB", options);
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

  const [MNR, setMNR] = useState(0);

  const [childCount, setChildCount] = useState(0);
  const [parentCount, setParentCount] = useState(0);
  const [level, setLevel] = useState(0);
  const [memberLevel, setMemberLevel] = useState("");
  const [cardDetails, setCardDetails] = useState<BusinessCard>(null);
  const [grandparentCardDetails, setGrandparentCardDetails] =
    useState<BusinessCard>(null);
  const navigate = useNavigate();
  const [parentInfo, setParentInfo] = useState(null);

  const [grandParentData, setGrandParentData] = useState(null);
  const [defaultCard, setDefaultCard] = useState<string>(null);

  const [grandparentDefaultCard, setGrandparentDefaultCard] =
    useState<string>(null);

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

  async function countParents(userId: string) {
    const userRef = doc(db, "referrals", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const grandchildren = userData.grandchildren || [];
      const parent = userData.parentUid || null;
      if (parent) {
        const parentRef = doc(db, "users", parent);
        const parentSnap = await getDoc(parentRef);
        if (parentSnap.exists()) {
          const parentData = parentSnap.data();

          const grandParentRef = query(
            collection(db, "referrals"),
            where("referralCode", "==", parentData.referralCode),
          );
          const grandRefSnap = await getDocs(grandParentRef);
          let grandParent = { email: "", firstName: "", referralCode: "" };
          if (!grandRefSnap.empty) {
            const granduserData = grandRefSnap.docs[0].data() as any;
            if (granduserData.parentUid) {
              const grandUserRef = doc(db, "users", granduserData.parentUid);

              const grandUserSnap = await getDoc(grandUserRef);
              if (grandUserSnap.exists()) {
                const grandUserInfo = grandUserSnap.data() as any;
                setGrandParentData(grandUserInfo);
                grandParent.email = grandUserInfo?.email ?? "";
                grandParent.referralCode = grandUserInfo?.referralCode ?? "";
                grandParent.firstName = grandUserInfo?.displayName ?? "";
              }
              const q = query(
                collection(db, "cards"),
                where("uid", "==", granduserData.parentUid),
                limit(1),
              );
              const querySnapshot = await getDocs(q);
              const latestCard = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))[0];
              if (latestCard) {
                //@ts-ignore
                setGrandparentCardDetails(latestCard);
                //@ts-ignore
                setGrandparentDefaultCard(latestCard?.metadata?.id);
              }
            } else {
              const q = query(
                collection(db, "users"),
                where("email", "==", "rob@solobizcards.com"),
              );
              const querySnapshot = await getDocs(q);
              const userData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))[0];
              if (!querySnapshot.empty) {
                setGrandParentData(userData);
              }
              const cq = query(
                collection(db, "cards"),
                where("uid", "==", userData.id),
                limit(1),
              );
              const cquerySnapshot = await getDocs(cq);
              const latestCard = cquerySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))[0];
              setGrandparentDefaultCard("sb-example-card");

              if (latestCard) {
                //@ts-ignore
                setGrandparentCardDetails(latestCard);
              }
            }
          } else {
            const q = query(
              collection(db, "users"),
              where("email", "==", "rob@solobizcards.com"),
            );
            const querySnapshot = await getDocs(q);
            const userData = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))[0];
            if (!querySnapshot.empty) {
              setGrandParentData(userData);
            }
            const cq = query(
              collection(db, "cards"),
              where("uid", "==", userData.id),
              limit(1),
            );
            const cquerySnapshot = await getDocs(cq);
            const latestCard = cquerySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))[0];
            if (latestCard) {
              //@ts-ignore
              setGrandparentCardDetails(latestCard);
              setGrandparentDefaultCard("sb-example-card");
            }
          }
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
          if (latestCard) {
            //@ts-ignore
            setCardDetails(latestCard);
            //@ts-ignore
            setDefaultCard("sb-example-card");
            //setDefaultCard(latestCard?.metadata?.id);
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
          setParentInfo(userData);
          setGrandParentData(userData);
          setGrandparentDefaultCard("sb-example-card");
          setDefaultCard("sb-example-card");
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
            //@ts-ignore
            setGrandparentCardDetails(latestCard);
          }
        }
      }
      return grandchildren.length;
    }
    return 0;
  }

  useEffect(() => {
    async function fetchCounts() {
      const userId = user?.uid;
      const children = await countChildren(userId);
      const parents = await countParents(userId);
      setParentCount(parents);
      setChildCount(children);
    }

    if (user && memberLevel == "") {
      fetchCounts();
    }
  }, [user, MNR, memberLevel]);

  return (
    <>
      <Card
        className={cn(
          "card-hover cursor-pointer h-full flex flex-col",
          className,
        )}
      >
        <CardHeader>
          <CardTitle className="text-sm font-medium border-b pb-2">
            <div className="flex items-center gap-3">
              Your Parent{" "}
              <span
                onClick={() => {
                  setShowGrandParentInfo(true);
                }}
                className="cursor-pointer font-normal text-sm text-blue-600"
              >
                [Grandparent]
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center">
          <div className="flex flex-col items-center justify-center gap-3 w-full">
              <button
                onClick={() => {
                  localStorage.setItem("currentPath", pathname);
                  if (defaultCard) navigate(`/${defaultCard}`);
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
                    ? (cardDetails?.profile?.firstName ?? "")
                    : (parentInfo?.displayName ?? "")}{" "}
                  {cardDetails
                    ? (cardDetails?.profile?.lastName ?? "")
                    : (parentInfo?.lastName ?? "")}{" "}
                  {cardDetails?.profile?.company &&
                    `| ${cardDetails?.profile?.company}`}
                </div>
              </div>

              {(() => {
                const activeCta = cardDetails
                  ? getActiveAppointmentLabel(cardDetails)
                  : null;

                if (activeCta === "Calendly" && cardDetails?.appointments?.calendlyUrl) {
                  return (
                    <button
                      style={{
                        backgroundColor: cardDetails?.brandColor,
                        color: "#FFFFFF",
                      }}
                      onClick={() => {
                        handleOpenLink(cardDetails.appointments?.calendlyUrl);
                      }}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                    >
                      Schedule Meeting
                    </button>
                  );
                }

                if (activeCta === "Google Calendar" && cardDetails?.appointments?.googleUrl) {
                  return (
                    <button
                      style={{
                        backgroundColor: cardDetails?.brandColor,
                        color: "#FFFFFF",
                      }}
                      onClick={() => {
                        handleOpenLink(cardDetails.appointments?.googleUrl);
                      }}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                    >
                      <Calendar size={20} /> Schedule Meeting
                    </button>
                  );
                }

                if (
                  activeCta === "Call-to-Action" &&
                  cardDetails?.appointments?.ctaUrl
                ) {
                  return (
                    <button
                      style={{
                        backgroundColor: cardDetails?.brandColor,
                        color: "#FFFFFF",
                      }}
                      onClick={() => {
                        handleOpenLink(cardDetails.appointments?.ctaUrl);
                      }}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                    >
                      <Calendar size={20} />{" "}
                      {cardDetails.appointments?.ctaLabel?.trim() || "Learn More"}
                    </button>
                  );
                }

                if (
                  activeCta === "Direct Ads" &&
                  cardDetails?.appointments?.directAds?.image &&
                  cardDetails?.appointments?.directAds.type !== "none"
                ) {
                  return (
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
                  );
                }

                return null;
              })()}
            </div>

            {cardDetails &&
              getActiveAppointmentLabel(cardDetails) === "Direct Ads" &&
              cardDetails?.appointments?.directAds?.image &&
              cardDetails?.appointments?.directAds.type !== "none" && (
                <Lightbox
                  isOpen={showLightbox}
                  onClose={() => setShowLightbox(false)}
                  imageSrc={cardDetails.appointments.directAds.image}
                  title={cardDetails.appointments.directAds.title}
                  description={cardDetails.appointments.directAds.description}
                  price={cardDetails.appointments.directAds.price}
                  url={cardDetails.appointments.directAds.url}
                  theme={cardDetails.brandColor}
                />
              )}
          </CardContent>
        </Card>
      {showGrandParentInfo && (
        <AlertDialog
          open={showGrandParentInfo}
          onOpenChange={setShowGrandParentInfo}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              {/* Close Button */}
              <button
                onClick={() => setShowGrandParentInfo(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <AlertDialogTitle className="text-sm font-medium pb-2">
                Your Grandparent
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-2 rounded-lg border bg-card text-card-foreground shadow-sm card-hover cursor-pointer p-6">
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={() => {
                      if (grandparentDefaultCard)
                        navigate(`/${grandparentDefaultCard}`);
                    }}
                    disabled={!grandparentDefaultCard}
                    className={`group ${
                      !grandparentDefaultCard
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
                          grandparentCardDetails?.profilePhoto
                            ? grandparentCardDetails?.profilePhoto
                            : "/lovable-uploads/logo_color_correct.png"
                        }
                      />
                    </span>
                  </button>

                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {grandparentCardDetails
                        ? (grandparentCardDetails?.profile?.firstName ?? "")
                        : (grandParentData?.displayName ?? "")}{" "}
                      {grandparentCardDetails
                        ? (grandparentCardDetails?.profile?.lastName ?? "")
                        : (grandParentData?.lastName ?? "")}{" "}
                      {grandparentCardDetails?.profile?.company &&
                        `| ${grandparentCardDetails?.profile?.company}`}
                    </div>
                  </div>

                  {(() => {
                    const activeCta = grandparentCardDetails
                      ? getActiveAppointmentLabel(grandparentCardDetails)
                      : null;

                    if (
                      activeCta === "Calendly" &&
                      grandparentCardDetails?.appointments?.calendlyUrl
                    ) {
                      return (
                        <button
                          style={{
                            backgroundColor: grandparentCardDetails?.brandColor,
                            color: "#FFFFFF",
                          }}
                          onClick={() => {
                            handleOpenLink(
                              grandparentCardDetails?.appointments?.calendlyUrl,
                            );
                          }}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                        >
                          Schedule Meeting
                        </button>
                      );
                    }

                    if (
                      activeCta === "Google Calendar" &&
                      grandparentCardDetails?.appointments?.googleUrl
                    ) {
                      return (
                        <button
                          style={{
                            backgroundColor: grandparentCardDetails?.brandColor,
                            color: "#FFFFFF",
                          }}
                          onClick={() => {
                            handleOpenLink(
                              grandparentCardDetails?.appointments?.googleUrl,
                            );
                          }}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                        >
                          <Calendar size={20} /> Schedule Meeting
                        </button>
                      );
                    }

                    if (
                      activeCta === "Call-to-Action" &&
                      grandparentCardDetails?.appointments?.ctaUrl
                    ) {
                      return (
                        <button
                          style={{
                            backgroundColor: grandparentCardDetails?.brandColor,
                            color: "#FFFFFF",
                          }}
                          onClick={() => {
                            handleOpenLink(
                              grandparentCardDetails?.appointments?.ctaUrl,
                            );
                          }}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                        >
                          <Calendar size={20} />{" "}
                          {grandparentCardDetails?.appointments?.ctaLabel?.trim() ||
                            "Learn More"}
                        </button>
                      );
                    }

                    if (
                      activeCta === "Direct Ads" &&
                      grandparentCardDetails?.appointments?.directAds?.image &&
                      grandparentCardDetails?.appointments?.directAds.type !==
                        "none"
                    ) {
                      return (
                        <button
                          style={{
                            backgroundColor: grandparentCardDetails?.brandColor,
                            color: "#FFFFFF",
                          }}
                          onClick={() => {
                            setShowGrandparentLightbox(true);
                          }}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                        >
                          <Eye size={20} /> View Our{" "}
                          {grandparentCardDetails?.appointments?.directAds.type}
                        </button>
                      );
                    }

                    return null;
                  })()}
                </div>

                {grandparentCardDetails &&
                  getActiveAppointmentLabel(grandparentCardDetails) === "Direct Ads" &&
                  grandparentCardDetails?.appointments?.directAds?.image &&
                  grandparentCardDetails?.appointments?.directAds.type !==
                    "none" && (
                    <Lightbox
                      isOpen={showGrandparentLightbox}
                      onClose={() => setShowGrandparentLightbox(false)}
                      imageSrc={
                        grandparentCardDetails.appointments.directAds.image
                      }
                      title={
                        grandparentCardDetails.appointments.directAds.title
                      }
                      description={
                        grandparentCardDetails.appointments.directAds
                          .description
                      }
                      price={
                        grandparentCardDetails.appointments.directAds.price
                      }
                      url={grandparentCardDetails.appointments.directAds.url}
                      theme={grandparentCardDetails.brandColor}
                    />
                  )}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
