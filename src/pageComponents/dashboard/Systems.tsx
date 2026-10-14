"use client";

import { useState, useEffect } from "react";
import {
  Users,
  CreditCard,
  MessageSquare,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import {
  SystemStatCard,
  MembersChart,
  MemberLevelCount,
  ReferralsRequirements,
  PricingCalculations,
  SystemInfo,
  CardPreviewUpload,
  CardBackupUpload,
  SliderImagesUpload,
  OGWebsiteImageUpload,
  ReferralEarningRate,
  LeadExportFee,
  SoloCardsInAction,
  SocialMediaShare,
  SyncCardSection,
  CardClassicTemplateUpload,
  CardTraditionalTemplateUpload,
  SoloCardsSiteMap,
  ActivationRequests,
  ApprovedUsersList,
  PaymentDueUsersList,
  PaymentDueSummary,
} from "@/components/dashboard/systems";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Users1 from "@/app/all-users/page";
import UsersListing from "@/app/all-users/page";
import { AccessoriesPricingManagement } from "@/components/dashboard/systems/AccessoriesPricingManagement";
import Orders from "./Orders";
import { AccessoriesReport } from "@/components/dashboard/systems/AccessoriesReport";
import NFCCardManagement from "@/components/dashboard/systems/NFCCardManagement";
import MarketplaceAdsManager from "./MarketplaceAdsManager";
import { CardmodernTemplateUpload } from "@/components/dashboard/systems/CardModernTemplateUpload";

export default function Systems() {
  const [l2Child, setL2Child] = useState("");
  const [l3LeveledUps, setL3LeveledUps] = useState("");
  const [l4Multiplier, setL4Multiplier] = useState("");
  const [l5Multiplier, setL5Multiplier] = useState("");
  const [l6Multiplier, setL6Multiplier] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  // Auto-populate L3 from L2 value
  useEffect(() => {
    setL3LeveledUps(l2Child);
  }, [l2Child]);

  const [proUpgradeMonthly, setProUpgradeMonthly] = useState("");
  const [addOneCardMonthly, setAddOneCardMonthly] = useState("");
  const [addFiveCardsMonthly, setAddFiveCardsMonthly] = useState("");
  const [discount, setDiscount] = useState("");
  const [freeTrialPeriod, setFreeTrialPeriod] = useState("");

  const [adminMessageCount, setAdminMessageCount] = useState(0);
  const [publicMessageCount, setPublicMessageCount] = useState(0);
  const [allMessagesCount, setAllMessagesCount] = useState(0);

  const [allPublicMessagesPerce, setAllPublicMessagesPerce] = useState(0);
  const [alladminMessagesPerce, setAllAdminMessagesPerce] = useState(0);

  const [loadDataLoading, setLoadDataLoading] = useState(true);

  // Calculations for Referrals Requirements
  const l3Total = l2Child ? parseInt(l2Child) * parseInt(l2Child) : 0;
  const l4Total =
    l3Total && l4Multiplier ? l3Total * parseInt(l4Multiplier) : 0;
  const l5Total =
    l3Total && l5Multiplier ? l3Total * parseInt(l5Multiplier) : 0;
  const l6Total =
    l3Total && l6Multiplier ? l3Total * parseInt(l6Multiplier) : 0;

  // Calculations for Pricing
  const discountPercent = parseFloat(discount) || 0;

  // Pro Upgrade calculations
  const proUpgradeAmount = parseFloat(proUpgradeMonthly) || 0;
  const proUpgradePerYear = proUpgradeAmount * 12;
  const proUpgradeYearlyWithDiscount =
    proUpgradePerYear * (1 - discountPercent / 100);
  const proUpgradeMonthlyEquivalent = proUpgradeYearlyWithDiscount / 12;

  // Add 1 Card calculations
  const addOneCardAmount = parseFloat(addOneCardMonthly) || 0;
  const addOneCardPerYear = addOneCardAmount * 12;
  const addOneCardYearlyWithDiscount =
    addOneCardPerYear * (1 - discountPercent / 100);
  const addOneCardMonthlyEquivalent = addOneCardYearlyWithDiscount / 12;

  // Add 5 Cards calculations
  const addFiveCardsAmount = parseFloat(addFiveCardsMonthly) || 0;
  const addFiveCardsPerYear = addFiveCardsAmount * 12;
  const addFiveCardsYearlyWithDiscount =
    addFiveCardsPerYear * (1 - discountPercent / 100);
  const addFiveCardsMonthlyEquivalent = addFiveCardsYearlyWithDiscount / 12;
  const { user } = useAuth();
  const [userCount, setUserCount] = useState(0);

  const [planCounts, setPlanCounts] = useState({
    free: 0,
    paid: 0,
    freePercentage: 0,
    paidPercentage: 0,
  });

  const [cardCounts, setCardCounts] = useState({
    total: 0,
    free: 0,
    paid: 0,
    freePercentage: 0,
    paidPercentage: 0,
    cardViewsCount: 0,
    cardViewPercentage: 0,
    cardInteractionCount: 0,
    cardInteractionPercentage: 0,
  });

  const [referralCounts, setReferralCounts] = useState({
    total: 0,
    admin: 0,
    normal: 0,
    adminPercentage: 0,
    normalPercentage: 0,
  });

  useEffect(() => {
    async function fetchCardCounts() {
      try {
        const cardsSnapshot = await getDocs(collection(db, "cards"));

        let freeCount = 0;
        let paidCount = 0;
        let cardViews = 0;
        let interaction = 0;
        const totalAnalytics =
          Number(cardCounts?.cardViewsCount) +
          Number(cardCounts?.cardInteractionCount);
        cardsSnapshot.forEach((cardDoc) => {
          const cardData = cardDoc.data();
          const cardType = cardData.metadata?.cardType;

          cardViews += cardData.cardView || 0;

          interaction +=
            Number(cardData.adsView ?? 0) +
            Number(cardData.cardShare ?? 0) +
            Number(cardData.leadsGenerated ?? 0) +
            Number(cardData.linkClick ?? 0) +
            Number(cardData.saveContact ?? 0);

          if (cardType === "free") {
            freeCount++;
          } else if (cardType === "paid") {
            paidCount++;
          }
        });

        const totalCards = freeCount + paidCount;
        const freePercentage =
          totalCards > 0 ? (freeCount / totalCards) * 100 : 0;
        const paidPercentage =
          totalCards > 0 ? (paidCount / totalCards) * 100 : 0;

        const cardViewPercentage =
          totalCards > 0 ? (cardViews / totalAnalytics) * 100 : 0;

        const cardInteractionPercentage =
          totalCards > 0 ? (interaction / totalAnalytics) * 100 : 0;

        setCardCounts({
          total: totalCards,
          free: freeCount,
          paid: paidCount,
          freePercentage,
          paidPercentage,
          cardViewsCount: cardViews,
          cardViewPercentage,
          cardInteractionCount: interaction,
          cardInteractionPercentage,
        });
      } catch (error) {
        console.error("Error fetching card counts:", error);
      }
    }

    async function fetchUsersCount() {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        let freeCount = 0;
        let paidCount = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.planType === "free" || data.planType === null) {
            freeCount++;
          } else if (data.planType === "paid") {
            paidCount++;
          }
        });
        const totalUsers = freeCount + paidCount;
        const freePercentage =
          totalUsers > 0 ? (freeCount / totalUsers) * 100 : 0;
        const paidPercentage =
          totalUsers > 0 ? (paidCount / totalUsers) * 100 : 0;
        setUserCount(totalUsers);
        setPlanCounts({
          free: freeCount,
          paid: paidCount,
          freePercentage,
          paidPercentage,
        });
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }

    async function fetchReferralCounts() {
      try {
        let totalReferalUsers = 0;
        // Get all users and their roles
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = {};
        usersSnapshot.forEach((doc) => {
          usersData[doc.id] = doc.data().role;
        });

        const users = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Get all referrals
        const referralsSnapshot = await getDocs(collection(db, "referrals"));

        let adminCount = 0;
        let normalCount = 0;

        referralsSnapshot.forEach((doc) => {
          const data = doc.data();
          const referrerUid = data.uid;
          totalReferalUsers += data.children.length;
          if (referrerUid && usersData[referrerUid]) {
            if (data.referralCode === "ROBPTF2") {
              if (data.children) {
                adminCount = data.children.length;
              }
            } else if (data.children) {
              normalCount += data.children.length;
            }
          }
        });

        // adminCount = users.length - 1 - normalCount;
        const totalReferrals = totalReferalUsers;

        const adminPercentage =
          adminCount > 0 ? (adminCount / (users.length - 1)) * 100 : 0;

        const normalPercentage =
          totalReferrals > 0 ? (normalCount / (users.length - 1)) * 100 : 0;

        setReferralCounts({
          total: totalReferrals,
          admin: adminCount,
          normal: normalCount,
          adminPercentage,
          normalPercentage,
        });
      } catch (error) {
        console.error("Error fetching referral counts:", error);
      }
    }

    async function fetchMessagesCounts() {
      const userRef = doc(db, "support", "admin");
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
      const userData = userSnap.data() as any;

      const userPublic = doc(db, "support", "public");
      const userSnapPublic = await getDoc(userPublic);
      if (!userSnapPublic.exists()) throw new Error("User not found");
      const userPublicData = userSnapPublic.data() as any;

      const allAdmPubMessagesCount =
        Number(adminMessageCount) + Number(publicMessageCount);

      // const publicMshPerc =
      //   (userPublicData.count * 100) / allAdmPubMessagesCount;

      const publicMshPerc =
        allAdmPubMessagesCount > 0
          ? (userPublicData.count * 100) / allAdmPubMessagesCount
          : 0;

      setAllPublicMessagesPerce(publicMshPerc);

      // const adminMshPerc = (userData.count * 100) / allAdmPubMessagesCount;

      const adminMshPerc =
        allAdmPubMessagesCount > 0
          ? (userData.count * 100) / allAdmPubMessagesCount
          : 0;

      setAllAdminMessagesPerce(adminMshPerc);

      setAdminMessageCount(userData.count);
      setPublicMessageCount(userPublicData.count);
      setAllMessagesCount(allAdmPubMessagesCount);
    }

    if (user) {
      setIsLoading(true);
      fetchReferralCounts();
      fetchCardCounts();
      fetchUsersCount();
      setIsLoading(false);
      fetchMessagesCounts();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-x-4 gap-y-4">
        <SystemStatCard
          title="Accounts"
          icon={<Users className="h-4 w-4" />}
          totalValue={userCount}
          metrics={[
            {
              label: "Free",
              value: planCounts.free,
              percentage: parseFloat(planCounts.freePercentage.toFixed(0)),
              color: "bg-blue-100 text-blue-700",
            },
            {
              label: "Paid",
              value: planCounts.paid,
              percentage: parseFloat(planCounts.paidPercentage.toFixed(0)),
              color: "bg-green-100 text-green-700",
            },
          ]}
        />

        <SystemStatCard
          title="Cards"
          icon={<CreditCard className="h-4 w-4" />}
          totalValue={cardCounts.total}
          metrics={[
            {
              label: "Free",
              value: cardCounts.free,
              percentage: parseFloat(cardCounts.freePercentage.toFixed(0)),
              color: "bg-blue-100 text-blue-700",
            },
            {
              label: "Paid",
              value: cardCounts.paid,
              percentage: parseFloat(cardCounts.paidPercentage.toFixed(0)),
              color: "bg-green-100 text-green-700",
            },
          ]}
        />

        <SystemStatCard
          title="Messages"
          icon={<MessageSquare className="h-4 w-4" />}
          totalValue={allMessagesCount}
          metrics={[
            {
              label: "Members",
              value: adminMessageCount,
              percentage: parseFloat(alladminMessagesPerce.toFixed(0)),
              color: "bg-purple-100 text-purple-700",
            },
            {
              label: "Public",
              value: publicMessageCount,
              percentage: parseFloat(allPublicMessagesPerce.toFixed(0)),
              color: "bg-orange-100 text-orange-700",
            },
          ]}
        />

        <SystemStatCard
          title="Analytics"
          icon={<BarChart3 className="h-4 w-4" />}
          totalValue={
            Number(cardCounts?.cardViewsCount) +
            Number(cardCounts?.cardInteractionCount)
          }
          metrics={[
            {
              label: "Total Views",
              value: cardCounts?.cardViewsCount,
              percentage: parseFloat(cardCounts?.cardViewPercentage.toFixed(0)),
              color: "bg-indigo-100 text-indigo-700",
            },
            {
              label: "Interactions",
              value: cardCounts?.cardInteractionCount,
              percentage: parseFloat(
                cardCounts?.cardInteractionPercentage.toFixed(0),
              ),
              color: "bg-yellow-100 text-yellow-700",
            },
          ]}
        />

        <SystemStatCard
          title="Referrals"
          icon={<ArrowUpRight className="h-4 w-4" />}
          totalValue={referralCounts.admin + referralCounts.normal}
          metrics={[
            {
              label: "Default User",
              value: referralCounts.admin,
              percentage: parseFloat(referralCounts.adminPercentage.toFixed(0)),
              color: "bg-red-100 text-red-700",
            },
            {
              label: "Members",
              value: referralCounts.normal,
              percentage: parseFloat(
                referralCounts.normalPercentage.toFixed(0),
              ),
              color: "bg-green-100 text-green-700",
            },
          ]}
        />
      </div>

      {/* Members Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-4">
        <MembersChart
        // freePlan={planCounts.free}
        // freePercentage={planCounts.freePercentage}
        // paidPlan={planCounts.paid}
        // paidPercentage={planCounts.paidPercentage}
        />
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm lg:col-span-2 card-hover">
        <div className="p-6">
          <UsersListing />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-4 gap-y-4">
        <div className="order-1 lg:order-1 lg:col-span-2">
          <ActivationRequests />

          <div className="mt-4">
            <ApprovedUsersList />
            <div className="mt-4">
              <AccessoriesReport />
            </div>
          </div>
        </div>

        <div className="order-3 lg:order-2 lg:col-span-2">
          <PaymentDueSummary
            setLoadDataLoading={setLoadDataLoading}
            loadDataLoading={loadDataLoading}
          />
        </div>
      </div>

      <div className="lg:col-span-1"></div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm lg:col-span-2 card-hover">
        <Orders isAdmin={true} />
      </div>

      {/* Accessories Pricing Management */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-x-4 gap-y-4">
        <NFCCardManagement />
      </div>

      <div className="sgrid grid-cols-1 lg:grid-cols-1 gap-x-4 gap-y-4">
        <MarketplaceAdsManager />
      </div>

      {/* Member Level Count */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-x-4 gap-y-4">
        <MemberLevelCount
          l2Child={l2Child}
          l4Multiplier={l4Multiplier}
          l5Multiplier={l5Multiplier}
          l6Multiplier={l6Multiplier}
        />
        <ReferralEarningRate />
        <LeadExportFee />
        <SoloCardsInAction />
        <SoloCardsSiteMap />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-x-4 gap-y-4">
        <SyncCardSection />
      </div>

      {/* Referrals Requirements and Pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-x-4 gap-y-4">
        <ReferralsRequirements
          l2Child={l2Child}
          setL2Child={setL2Child}
          l3LeveledUps={l3LeveledUps}
          setL3LeveledUps={setL3LeveledUps}
          l4Multiplier={l4Multiplier}
          setL4Multiplier={setL4Multiplier}
          l5Multiplier={l5Multiplier}
          setL5Multiplier={setL5Multiplier}
          l6Multiplier={l6Multiplier}
          setL6Multiplier={setL6Multiplier}
          l3Total={l3Total}
          l4Total={l4Total}
          l5Total={l5Total}
          l6Total={l6Total}
        />

        <PricingCalculations
          proUpgradeMonthly={proUpgradeMonthly}
          setProUpgradeMonthly={setProUpgradeMonthly}
          addOneCardMonthly={addOneCardMonthly}
          setAddOneCardMonthly={setAddOneCardMonthly}
          addFiveCardsMonthly={addFiveCardsMonthly}
          setAddFiveCardsMonthly={setAddFiveCardsMonthly}
          discount={discount}
          setDiscount={setDiscount}
          freeTrialPeriod={freeTrialPeriod}
          setFreeTrialPeriod={setFreeTrialPeriod}
          proUpgradePerYear={proUpgradePerYear}
          proUpgradeYearlyWithDiscount={proUpgradeYearlyWithDiscount}
          proUpgradeMonthlyEquivalent={proUpgradeMonthlyEquivalent}
          addOneCardPerYear={addOneCardPerYear}
          addOneCardYearlyWithDiscount={addOneCardYearlyWithDiscount}
          addOneCardMonthlyEquivalent={addOneCardMonthlyEquivalent}
          addFiveCardsPerYear={addFiveCardsPerYear}
          addFiveCardsYearlyWithDiscount={addFiveCardsYearlyWithDiscount}
          addFiveCardsMonthlyEquivalent={addFiveCardsMonthlyEquivalent}
        />
      </div>

      {/* Image Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-4">
        <CardPreviewUpload />
        <CardBackupUpload />
        <SliderImagesUpload />
        <OGWebsiteImageUpload />
        <CardClassicTemplateUpload />
        <CardTraditionalTemplateUpload />
        <CardmodernTemplateUpload />
      </div>

      {/* Accessories Pricing Management */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-x-4 gap-y-4">
        <AccessoriesPricingManagement />
      </div>

      {/* System Health and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-4">
        <SystemInfo />
        <SocialMediaShare />
      </div>
    </div>
  );
}
