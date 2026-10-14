"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Eye, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
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
} from "@/components/ui/alert-dialog";

/* =======================
   TYPES
======================= */
type UserDoc = {
  referralCode?: string;
  displayName?: string;
  lastName?: string;
  email?: string;
};

type ParentItem = {
  parent: UserDoc & { id: string };
  card: BusinessCard;
  defaultCardId: string;
  grandParent?: UserDoc & { id: string };
  grandparentDefaultCard?: string;
  grandparentCardDetails?: BusinessCard;
};

export function YourAllParent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const ITEMS_PER_PAGE = 4; // change if needed
  const [currentPage, setCurrentPage] = useState(1);

  const [parents, setParents] = useState<ParentItem[]>([]);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showGrandparentLightbox, setShowGrandparentLightbox] =
    useState(false);
  const [activeLightboxCard, setActiveLightboxCard] =
    useState<BusinessCard | null>(null);
  const [grandparentDefaultCard, setGrandparentDefaultCard] =
    useState<string>(null);
  const [grandparentCardDetails, setGrandparentCardDetails] =
    useState<BusinessCard>(null);

  const [grandParentData, setGrandParentData] = useState(null);

  const [showGrandParentInfo, setShowGrandParentInfo] = useState(false);

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
  /* ==================================================
     FETCH ALL PARENTS (GLOBAL, ARRAY-BASED)
  ================================================== */
  async function fetchAllParentData() {
    setLoading(true);
    const referralSnap = await getDocs(collection(db, "referrals"));
    if (referralSnap.empty) return;

    const parentMap = new Map<string, ParentItem>();

    for (const refDoc of referralSnap.docs) {
      const { parentUid } = refDoc.data() as { parentUid?: string };
      if (!parentUid || parentMap.has(parentUid)) continue;

      // ---------- PARENT ----------
      let grandParent;
      let grandparentCardDetails;
      let grandparentDefaultCard;
      const parentSnap = await getDoc(doc(db, "users", parentUid));
      if (!parentSnap.exists()) continue;

      const parentData: UserDoc & { id: string } = {
        id: parentSnap.id,
        ...(parentSnap.data() as UserDoc),
      };

      // ---------- PARENT CARD ----------
      const parentCardSnap = await getDocs(
        query(collection(db, "cards"), where("uid", "==", parentUid), limit(1)),
      );

      if (parentCardSnap.empty) continue;
      const grandParentRef = query(
        collection(db, "referrals"),
        where("referralCode", "==", parentData.referralCode),
      );
      const grandRefSnap = await getDocs(grandParentRef);
      if (!grandRefSnap.empty) {
        const granduserData = grandRefSnap.docs[0].data() as any;
        if (granduserData.parentUid) {
          const grandUserRef = doc(db, "users", granduserData.parentUid);

          const grandUserSnap = await getDoc(grandUserRef);
          if (grandUserSnap.exists()) {
            const grandUserInfo = grandUserSnap.data() as any;
            grandParent = grandUserInfo;
            //   setGrandParentData(grandUserInfo);
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
            grandparentCardDetails = latestCard;
            //@ts-ignore
            grandparentDefaultCard = latestCard?.metadata?.id;
            // setGrandparentCardDetails(latestCard);
            // setGrandparentDefaultCard(latestCard?.metadata?.id);
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
            // setGrandParentData(userData);
            //@ts-ignore
            grandParent = userData;
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
          //@ts-ignore
          grandparentDefaultCard = "sb-example-card";
          // setGrandparentDefaultCard(
          //   "5615dfda-ce61-48cf-b8b5-02d98001125b?selectedTab=favorites&view=true"
          // );

          if (latestCard) {
            //@ts-ignore
            grandparentCardDetails = latestCard;
            //@ts-ignore
            // setGrandparentCardDetails(latestCard);
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
          grandParent = userData;
          // setGrandParentData(userData);
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
          grandparentCardDetails = latestCard;
          grandparentDefaultCard = "sb-example-card";
          // setGrandparentDefaultCard(
          //   "5615dfda-ce61-48cf-b8b5-02d98001125b?selectedTab=favorites&view=true"
          // );
        }
      }
      const parentCard = {
        id: parentCardSnap.docs[0].id,
        ...parentCardSnap.docs[0].data(),
      } as BusinessCard;

      parentMap.set(parentUid, {
        parent: parentData,
        card: parentCard,
        defaultCardId: parentCard?.metadata?.id ?? "",
        grandParent: grandParent,
        grandparentCardDetails: grandparentCardDetails,
        grandparentDefaultCard: grandparentDefaultCard,
      });
    }
    setLoading(false);
    setParents(Array.from(parentMap.values()));
  }
  async function fetchAllUsersWithCards() {
    setLoading(true);

    try {
      // 1️⃣ Fetch all users
      const usersSnap = await getDocs(collection(db, "users"));
      if (usersSnap.empty) {
        setParents([]);
        return;
      }

      const users = usersSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as UserDoc),
      }));

      // 2️⃣ Fetch all cards
      const cardsSnap = await getDocs(collection(db, "cards"));

      const cards = cardsSnap.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as BusinessCard),
        }))
        .filter((card) => card.metadata?.isPublic === true);

      // 3️⃣ Group cards by uid
      const cardsByUid = new Map<string, BusinessCard[]>();
      cards.forEach((card) => {
        if (!card.uid) return;
        if (card?.appointments?.ctaUrl) return;
        if (!cardsByUid.has(card.uid)) {
          cardsByUid.set(card.uid, []);
        }
        cardsByUid.get(card.uid)!.push(card);
      });

      // 4️⃣ Build final data
      const result: ParentItem[] = users.map((user) => {
        const userCards = cardsByUid.get(user.id) || [];
        const defaultCard = userCards[0]; // or apply your own logic

        return {
          parent: user,
          card: defaultCard,
          defaultCardId: defaultCard?.urlName ?? "",
          allCards: userCards, // 👈 optional but useful
        };
      });

      setParents(result);
    } catch (error) {
      console.error("Error fetching users & cards:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllUsersWithCards();
  }, []);

  const filteredParents = parents.filter(
    (item) => item?.card?.appointments?.directAds?.type,
  );

  const totalPages = Math.ceil(filteredParents.length / ITEMS_PER_PAGE);

  const paginatedParents = filteredParents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <>
      {loading && (
        <div className="flex justify-center items-center py-6">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      {!loading && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {paginatedParents.map((item, index) => {
            if (!item?.card?.appointments?.directAds?.type) return null;
            // if (item?.card?.appointments?.ctaUrl) return null;
            return (
              <Card
                key={item.card.id ?? index}
                className="card-hover cursor-pointer"
              >
                <CardHeader>
                  <CardTitle className="text-sm font-medium border-b pb-2">
                    <div className="pb-2">
                      <Badge className="bg-primary text-primary-foreground pt-1">
                        {item?.card?.appointments?.appointmentType ===
                        "direct-ads"
                          ? item?.card?.appointments?.directAds?.type
                          : item?.card?.appointments?.appointmentType}
                      </Badge>
                    </div>
                    {/* <div className="flex items-center gap-3">
                      <div>Your Parent </div>
                      <span
                        onClick={() => {
                          setGrandparentCardDetails(
                            item.grandparentCardDetails,
                          );
                          setGrandParentData(item.grandParent);
                          setGrandparentDefaultCard(
                            item.grandparentDefaultCard,
                          );
                          setShowGrandParentInfo(true);
                        }}
                        className="cursor-pointer font-normal text-sm text-blue-600"
                      >
                        [Grandparent]
                      </span>
                    </div> */}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-col items-center gap-3">
                    {/* Avatar */}
                    <button
                      onClick={() =>
                        item.defaultCardId && navigate(`/${item.defaultCardId}`)
                      }
                      className="group"
                    >
                      <span className="relative flex shrink-0 overflow-hidden rounded-full w-12 h-12 transition-transform duration-200 group-hover:scale-110">
                        <img
                          style={{ backgroundColor: "#8080805e" }}
                          className="aspect-square h-full w-full"
                          src={
                            item.card.profilePhoto ??
                            "/lovable-uploads/logo_color_correct.png"
                          }
                          alt="Parent"
                        />
                      </span>
                    </button>

                    {/* Name */}
                    <div className="text-center text-sm font-medium">
                      {item.card.profile?.firstName ??
                        item.parent.displayName ??
                        ""}{" "}
                      {item.card.profile?.lastName ?? ""}
                      {item.card.profile?.company &&
                        ` | ${item.card.profile.company}`}
                    </div>

                    {(() => {
                      const activeCta = item.card
                        ? getActiveAppointmentLabel(item.card)
                        : null;

                      if (
                        activeCta === "Calendly" &&
                        item.card.appointments?.calendlyUrl
                      ) {
                        return (
                          <button
                            style={{
                              backgroundColor: item.card.brandColor,
                              color: "#fff",
                            }}
                            onClick={() =>
                              handleOpenLink(item.card.appointments?.calendlyUrl)
                            }
                            className="inline-flex items-center justify-center gap-2 text-sm font-medium h-9 rounded-md px-3 w-full"
                          >
                            <Calendar size={18} /> Schedule Meeting
                          </button>
                        );
                      }

                      if (
                        activeCta === "Google Calendar" &&
                        item.card.appointments?.googleUrl
                      ) {
                        return (
                          <button
                            style={{
                              backgroundColor: item.card.brandColor,
                              color: "#fff",
                            }}
                            onClick={() =>
                              handleOpenLink(item.card.appointments?.googleUrl)
                            }
                            className="inline-flex items-center justify-center gap-2 text-sm font-medium h-9 rounded-md px-3 w-full"
                          >
                            <Calendar size={18} /> Schedule Meeting
                          </button>
                        );
                      }

                      if (
                        activeCta === "Call-to-Action" &&
                        item.card.appointments?.ctaUrl
                      ) {
                        return (
                          <button
                            style={{
                              backgroundColor: item.card.brandColor,
                              color: "#fff",
                            }}
                            onClick={() =>
                              handleOpenLink(item.card.appointments?.ctaUrl)
                            }
                            className="inline-flex items-center justify-center gap-2 text-sm font-medium h-9 rounded-md px-3 w-full"
                          >
                            <Calendar size={18} />{" "}
                            {item.card.appointments?.ctaLabel?.trim() || "Learn More"}
                          </button>
                        );
                      }

                      if (
                        activeCta === "Direct Ads" &&
                        item.card.appointments?.directAds?.image &&
                        item.card.appointments?.directAds?.type !== "none"
                      ) {
                        return (
                          <button
                            style={{
                              backgroundColor: item.card.brandColor,
                              color: "#fff",
                            }}
                            onClick={() => {
                              setActiveLightboxCard(item.card);
                              setShowLightbox(true);
                            }}
                            className="inline-flex items-center justify-center gap-2 text-sm font-medium h-9 rounded-md px-3 w-full"
                          >
                            <Eye size={18} /> View Our{" "}
                            {item.card.appointments.directAds.type}
                          </button>
                        );
                      }

                      return null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            );
          })}

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
                                backgroundColor:
                                  grandparentCardDetails?.brandColor,
                                color: "#FFFFFF",
                              }}
                              onClick={() => {
                                handleOpenLink(
                                  grandparentCardDetails?.appointments
                                    ?.calendlyUrl,
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
                                backgroundColor:
                                  grandparentCardDetails?.brandColor,
                                color: "#FFFFFF",
                              }}
                              onClick={() => {
                                handleOpenLink(
                                  grandparentCardDetails?.appointments
                                    ?.googleUrl,
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
                                backgroundColor:
                                  grandparentCardDetails?.brandColor,
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
                          grandparentCardDetails?.appointments?.directAds
                            ?.image &&
                          grandparentCardDetails?.appointments?.directAds
                            .type !== "none"
                        ) {
                          return (
                            <button
                              style={{
                                backgroundColor:
                                  grandparentCardDetails?.brandColor,
                                color: "#FFFFFF",
                              }}
                              onClick={() => {
                                setShowGrandparentLightbox(true);
                              }}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                            >
                              <Eye size={20} /> View Our{" "}
                              {
                                grandparentCardDetails?.appointments?.directAds
                                  .type
                              }
                            </button>
                          );
                        }

                        return null;
                      })()}
                    </div>

                    {grandparentCardDetails &&
                      getActiveAppointmentLabel(grandparentCardDetails) ===
                        "Direct Ads" &&
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
                          url={
                            grandparentCardDetails.appointments.directAds.url
                          }
                          theme={grandparentCardDetails.brandColor}
                        />
                      )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            variant="outline"
          >
            Previous
          </Button>

          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
      {/* LIGHTBOX */}
      {activeLightboxCard?.appointments?.directAds?.image && (
        <Lightbox
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
          imageSrc={activeLightboxCard.appointments.directAds.image}
          title={activeLightboxCard.appointments.directAds.title}
          description={activeLightboxCard.appointments.directAds.description}
          price={activeLightboxCard.appointments.directAds.price}
          url={activeLightboxCard.appointments.directAds.url}
          theme={activeLightboxCard.brandColor}
        />
      )}
    </>
  );
}
