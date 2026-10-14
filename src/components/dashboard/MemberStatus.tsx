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

export function MemberStatus() {
  const { user, isLoading: authLoading } = useAuth();
  const [showLightbox, setShowLightbox] = useState(false);
  const createdAt = user?.metadata?.creationTime ?? new Date();
  const date = new Date(createdAt);

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
  const [childEarnings, setchildEarnings] = useState(0);
  const [grandchildEarnings, setRgrandchildEarnings] = useState(0);
  const [currentChildren, setCurrentChildren] = useState(0);
  const [currentGrandChildren, setCurrentGrandChildren] = useState(0);
  const [remainingChildren, setRemainingChildren] = useState(0);
  const [remainingGrandChildren, setRemainingGrandChildren] = useState(0);
  const [nextLevelNeed, setNextLevelNeed] = useState(0);
  const [cardDetails, setCardDetails] = useState<BusinessCard>(null);
  const navigate = useNavigate();

  const [parentInfo, setParentInfo] = useState(null);
  const [defaultCard, setDefaultCard] = useState<string>(null);

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

  // async function countParents(userId: string) {
  //   const userRef = doc(db, "referrals", userId);
  //   const userSnap = await getDoc(userRef);
  //   if (userSnap.exists()) {
  //     const userData = userSnap.data();
  //     const grandchildren = userData.grandchildren || [];
  //     return grandchildren.length;
  //   }
  //   return 0;
  // }

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
          setParentInfo(parentData);
          const q = query(
            collection(db, "cards"),
            where("uid", "==", parent),
            limit(1)
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
            setDefaultCard(latestCard?.metadata?.id);
          }
        }
      } else {
        const q = query(
          collection(db, "users"),
          where("email", "==", "rob@solobizcards.com")
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
            limit(1)
          );

          const userQuerySnapshot = await getDocs(q);
          const latestCard = userQuerySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))[0];
          if (latestCard) {
            //console.log("Default latestCard", latestCard);
            //@ts-ignore
            setCardDetails(latestCard);
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
    const fetchSettings = async () => {
      try {
        const userId = user?.uid;
        if (!userId) return;

        //  console.log("=== FETCHING REFERRAL SETTINGS ===");

        // --- Fetch referral settings ---
        const settingsRef = doc(db, "users", userId);
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists()) return;
        const settings = settingsSnap.data();

        const settingsReferralEarningRate = doc(db, "users", userId);
        const settingssettingsReferralEarningRateSnap = await getDoc(
          settingsReferralEarningRate
        );
        if (!settingssettingsReferralEarningRateSnap.exists()) return;
        const settingsData = settingssettingsReferralEarningRateSnap.data();

        setchildEarnings(settingsData.childEarnings);
        setRgrandchildEarnings(settingsData.grandchildEarnings);

        const MNR = settings.l2Child;
        setMNR?.(MNR);
        //   console.log("Minimum Number of Referrals (MNR):", MNR);

        // --- Fetch user data ---
        const userRef = doc(db, "referrals", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;
        const userData = userSnap.data();
        const userLevel = userData.Level;
        let newMemberLevel = "Starter";

        //   console.log("UserLevel", userLevel);
        setMemberLevel(userData.memberLevel);
        // if (userLevel == 1) {
        //   setMemberLevel("Starter");
        // } else if (userLevel == 2) {
        //   setMemberLevel("Level-Up");
        // } else if (userLevel == 3) {
        //   setMemberLevel("Bronze");
        // } else if (userLevel == 4) {
        //   setMemberLevel("Silver");
        // } else if (userLevel == 5) {
        //   setMemberLevel("Gold");
        // } else if (userLevel == 6) {
        //   setMemberLevel("Platinum");
        // }

        const children = userData.children || [];
        const RCA = children.length;
        //    console.log("Direct children (RCA):", RCA);

        let childrenReachedLevel2 = 0;
        let totalGrandChildrenFromLevel2 = 0;
        let totalGrandChildrenAll = 0;
        let level3Count = 0;

        const nonLevel2Deficits = [];
        for (const childId of children) {
          const childRef = doc(db, "referrals", childId);
          const childSnap = await getDoc(childRef);

          if (!childSnap.exists()) {
            //    console.log(`Child ID ${childId} not found`);
            continue;
          }

          const childData = childSnap.data();
          const childChildren = childData.children || [];
          const childRCA = childChildren.length;
          const childLevel = Number(childData.Level ?? childData.Level) || 1;

          totalGrandChildrenAll += childRCA;

          // console.log(`Child ID: ${childId}`);
          // console.log("  - Child Level:", childLevel);
          // console.log("  - Child Direct Children (childRCA):", childRCA);

          if (childRCA >= MNR || childLevel >= 2) {
            childrenReachedLevel2++;
            totalGrandChildrenFromLevel2 += childRCA;
            //  console.log("  -> counts as Level-2 child");
          } else {
            const deficit = Math.max(0, MNR - childRCA);
            nonLevel2Deficits.push(deficit);
            // console.log(
            //   "  -> NOT Level-2 yet, deficit to reach Level-2:",
            //   deficit
            // );
          }

          if (childLevel >= 3) {
            level3Count++;
          }
        }

        // console.log(
        //   "Total grandchildren (all children):",
        //   totalGrandChildrenAll
        // );
        // console.log(
        //   "Total grandchildren (from Level-2 children):",
        //   totalGrandChildrenFromLevel2
        // );
        // console.log("Total Level-2 children (RLA):", childrenReachedLevel2);
        // console.log("Total Level-3 children:", level3Count);

        const missingLevel2Children = Math.max(0, MNR - childrenReachedLevel2);

        nonLevel2Deficits.sort((a, b) => a - b);

        let remainingGrandChildren = 0;
        for (let i = 0; i < missingLevel2Children; i++) {
          if (i < nonLevel2Deficits.length) {
            remainingGrandChildren += nonLevel2Deficits[i];
          } else {
            remainingGrandChildren += MNR;
          }
        }

        if (childrenReachedLevel2 >= MNR) {
          remainingGrandChildren = 0;
        }

        const childrenRemainingLevel2 = Math.max(
          0,
          MNR - childrenReachedLevel2
        );

        let remainingPoints = childrenRemainingLevel2;
        // console.log("Missing Level-2 children (count):", missingLevel2Children);
        // console.log("Deficits list (non-Level2 children):", nonLevel2Deficits);
        // console.log(
        //   "Remaining grandchildren required to get MNR Level-2 children:",
        //   remainingGrandChildren
        // );
        // console.log(
        //   "Children remaining to reach Level-2:",
        //   childrenRemainingLevel2
        // );
        // console.log(
        //   "RemainingPoints (children required to reach Level-2):",
        //   remainingPoints
        // );

        let userLevelStr = 1;
        let memberLevel = "Starter";
        let requiredChildrenToNext = 0;
        let requiredGrandChildrenToNext = 0;
        let nextLevelName = "";

        if (RCA < MNR) {
          userLevelStr = 1;
          memberLevel = "Starter";
          requiredChildrenToNext = Math.max(0, MNR - RCA);
          requiredGrandChildrenToNext = 0;
          nextLevelName = "Level-Up";
          remainingPoints = 0;
        } else if (childrenReachedLevel2 < MNR) {
          //   console.log("childrenReachedLevel2=", childrenReachedLevel2);
          userLevelStr = childrenReachedLevel2;
          memberLevel = "Level-Up";
          requiredChildrenToNext = childrenRemainingLevel2;
          requiredGrandChildrenToNext = remainingGrandChildren;
          // remainingPoints=0;
          nextLevelName = "Bronze";
          // await updateDoc(userRef, {
          //   Level: 2,
          // });
        } else if (
          childrenReachedLevel2 < MNR ||
          (childrenReachedLevel2 >= MNR &&
            totalGrandChildrenFromLevel2 < MNR * MNR)
        ) {
          userLevelStr = childrenReachedLevel2;
          memberLevel = "Level-Up";
          requiredChildrenToNext = 0;
          requiredGrandChildrenToNext = Math.max(
            0,
            MNR * MNR - totalGrandChildrenFromLevel2
          );
          nextLevelName = "Bronze";
          // await updateDoc(userRef, {
          //   Level: 2,
          // });
        } else if (
          childrenReachedLevel2 >= MNR &&
          totalGrandChildrenFromLevel2 >= MNR * MNR &&
          level3Count < 2 * MNR
        ) {
          userLevelStr = 3;
          memberLevel = "Bronze";
          requiredChildrenToNext = Math.max(0, 2 * MNR - level3Count);
          requiredGrandChildrenToNext = 0;
          nextLevelName = "Silver";
          // await updateDoc(userRef, {
          //   Level: 3,
          // });
        } else if (
          totalGrandChildrenFromLevel2 <
          settings.l4Multiplier * (MNR * MNR)
        ) {
          userLevelStr = 3;
          memberLevel = "Bronze Earner";
          requiredChildrenToNext = 0;
          requiredGrandChildrenToNext = Math.max(
            0,
            settings.l4Multiplier * (MNR * MNR) - totalGrandChildrenFromLevel2
          );
          nextLevelName = "Silver Earner";
          // await updateDoc(userRef, { Level: 3 });
        }
        // Level 5 → Gold Earner (L5-multiplier × L3 grandchildren)
        else if (
          totalGrandChildrenFromLevel2 <
          settings.l5Multiplier * (MNR * MNR)
        ) {
          userLevelStr = 4;
          memberLevel = "Silver Earner";
          requiredChildrenToNext = 0;
          requiredGrandChildrenToNext = Math.max(
            0,
            settings.l5Multiplier * (MNR * MNR) - totalGrandChildrenFromLevel2
          );
          nextLevelName = "Gold Earner";
          // await updateDoc(userRef, { Level: 4 });
        }
        // Level 6 → Platinum Earner (L6-multiplier × L3 grandchildren)
        else if (
          totalGrandChildrenFromLevel2 <
          settings.l6Multiplier * (MNR * MNR)
        ) {
          userLevelStr = 5;
          memberLevel = "Gold Earner";
          requiredChildrenToNext = 0;
          requiredGrandChildrenToNext = Math.max(
            0,
            settings.l6Multiplier * (MNR * MNR) - totalGrandChildrenFromLevel2
          );
          nextLevelName = "Platinum Earner";
          // await updateDoc(userRef, { Level: 5 });
        } else {
          userLevelStr = 6;
          memberLevel = "Platinum";
          requiredChildrenToNext = 0;
          requiredGrandChildrenToNext = 0;
          nextLevelName = "Max Level";
          // await updateDoc(userRef, {
          //   Level: 6,
          // });
        }

        // console.log("=== LEVEL RESULT ===");
        // console.log("User Level (label):", userLevelStr);
        // console.log("Member Level:", memberLevel);
        // console.log("Next Level:", nextLevelName);
        // console.log("Children reached Level-2 (RLA):", childrenReachedLevel2);
        // console.log(
        //   "Children remaining to reach Level-2:",
        //   childrenRemainingLevel2
        // );
        // console.log(
        //   "Total grandchildren (all children):",
        //   totalGrandChildrenAll
        // );
        // console.log(
        //   "Total grandchildren (from Level-2 children):",
        //   totalGrandChildrenFromLevel2
        // );
        // console.log(
        //   "Remaining grandchildren required to form MNR Level-2 children:",
        //   remainingGrandChildren
        // );
        // console.log(
        //   "Remaining points (children still to reach Level-2):",
        //   remainingPoints
        // );

        setLevel?.(childrenReachedLevel2);
        // setMemberLevel?.(memberLevel);
        setCurrentChildren?.(RCA);
        setCurrentGrandChildren?.(totalGrandChildrenAll);
        setRemainingChildren?.(requiredChildrenToNext);
        setRemainingGrandChildren?.(requiredGrandChildrenToNext);
        // setChildrenReachedLevel2?.(childrenReachedLevel2);
        // setChildrenRemainingLevel2?.(childrenRemainingLevel2);
        setNextLevelNeed?.(remainingPoints);
      } catch (err) {
        console.error("Error fetching referral settings:", err);
      }
    };

    if (user && memberLevel == "") {
      fetchCounts();
      fetchSettings();
    }
  }, [user, MNR, memberLevel]);

  const memberData = [
    {
      label: "Member Since",
      value: formatted,
      icon: Clock,
    },
    {
      label: "Membership Status",
      value: user?.planName ? user.planName : "Free",
      icon: User,
    },
    {
      label: "Member Level",
      value: memberLevel,
      icon: Users,
    },
    {
      label: "Card Free/Paid Status",
      value: user?.planType === "paid" ? "Paid" : "2-Free",
      icon: CreditCard,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-1">
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Member Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {memberData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Card (Duplicate of Member Status) */}
      {/* <Card className="card-hover cursor-pointer">
        <CardHeader>
          <CardTitle className="text-sm font-medium border-b pb-2">
            Your Parent
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                  : parentInfo?.lastName ?? ""}
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

            {cardDetails?.appointments?.appointmentType == "call-to-action" &&
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
                  <Calendar size={20} /> {cardDetails?.appointments?.ctaLabel}
                </button>
              )}

            {cardDetails?.appointments?.directAds?.image &&
              cardDetails?.appointments?.appointmentType == "direct-ads" &&
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
                description={cardDetails.appointments.directAds.description}
                price={cardDetails.appointments.directAds.price}
                url={cardDetails.appointments.directAds.url}
                theme={cardDetails.brandColor}
              />
            )}
        </CardContent>
      </Card> */}
    </div>
  );
}
