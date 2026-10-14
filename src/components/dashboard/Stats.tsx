"use client";

import { ArrowUpRight, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";

type StatCardProps = {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
};

export function StatCard({
  title,
  value,
  icon,
  change,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("card-hover", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground border-b pb-2 flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="flex items-center gap-1 mt-1 text-xs">
            {trend === "up" ? (
              <>
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-green-500">{change}</span>
              </>
            ) : trend === "down" ? (
              <>
                <ArrowUpRight className="h-3 w-3 rotate-90 text-red-500" />
                <span className="text-red-500">{change}</span>
              </>
            ) : (
              <>
                <span className="h-3 w-3" />
                <span className="text-muted-foreground">{change}</span>
              </>
            )}
            <span className="text-muted-foreground ml-1">from last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function Stats() {
  const { user } = useAuth();
  const [cardView, setCardView] = useState(0);
  const [thisMonthViews, setThisMonthViews] = useState(0);
  const [lastMonthViews, setLastMonthViews] = useState(0);
  const [percentageChangeViews, setPercentageChangeViews] = useState(0);

  const [cardShare, setCardShare] = useState(0);
  const [thisMonthShares, setThisMonthShares] = useState(0);
  const [lastMonthShares, setLastMonthShares] = useState(0);
  const [percentageChangeShares, setPercentageChangeShares] = useState(0);

  const [cardLeads, setCardLeads] = useState(0);
  const [thisMonthLeads, setThisMonthLeads] = useState(0);
  const [lastMonthLeads, setLastMonthLeads] = useState(0);
  const [percentageChangeLeads, setPercentageChangeLeads] = useState(0);

  const [cardLinkClicks, setCardLinkClicks] = useState(0);
  const [thisMonthLinkClicks, setThisMonthLinkClicks] = useState(0);
  const [lastMonthLinkClicks, setLastMonthLinkClicks] = useState(0);
  const [percentageChangeLinkClicks, setPercentageChangeLinkClicks] =
    useState(0);

  const [adsView, setAdsView] = useState(0);
  const [thisMonthAdsView, setThisMonthAdsView] = useState(0);
  const [lastMonthAdsView, setLastMonthAdsView] = useState(0);
  const [percentageChangeAdsView, setPercentageChangeAdsView] = useState(0);

  const [cardSaveContact, setCardSaveContact] = useState(0);
  const [thisMonthSaveContact, setThisMonthSaveContact] = useState(0);
  const [lastMonthSaveContact, setLastMonthSaveContact] = useState(0);
  const [percentageChangeSaveContact, setPercentageChangeSaveContact] =
    useState(0);

  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isFreePlan, setIsFreePlan] = useState(false);

  async function fetchUserCardStats(uid: string) {
    try {
      const now = new Date();

      const thisMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const formatMonthKey = (date: Date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      const thisMonthKey = formatMonthKey(thisMonthDate);
      const lastMonthKey = formatMonthKey(lastMonthDate);

      const cardsQuery = query(
        collection(db, "cards"),
        where("uid", "==", uid)
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      // Initialize totals
      let totalViews = 0,
        thisMonthViewsCount = 0,
        lastMonthViewsCount = 0;
      let totalShares = 0,
        thisMonthSharesCount = 0,
        lastMonthSharesCount = 0;
      let totalLeads = 0,
        thisMonthLeadsCount = 0,
        lastMonthLeadsCount = 0;
      let totalLinkClicks = 0,
        thisMonthLinkClicksCount = 0,
        lastMonthLinkClicksCount = 0;
      let totalAdsView = 0,
        thisMonthAdsViewCount = 0,
        lastMonthAdsViewCount = 0;
      let totalSaveContact = 0,
        thisMonthSaveContactCount = 0,
        lastMonthSaveContactCount = 0;

      cardsSnapshot.forEach((doc) => {
        const data = doc.data();

        // Views
        const views = data.cardView || 0;
        totalViews += views;
        const viewsByMonth = data.cardViewsByMonth || {};
        thisMonthViewsCount += viewsByMonth[thisMonthKey] || 0;
        lastMonthViewsCount += viewsByMonth[lastMonthKey] || 0;

        // console.log("thisMonthViewsCount", thisMonthViewsCount);
        // console.log("lastMonthViewsCount", lastMonthViewsCount);

        // Shares
        const shares = data.cardShare || 0;
        totalShares += shares;
        const sharesByMonth = data.cardSharesByMonth || {};
        thisMonthSharesCount += sharesByMonth[thisMonthKey] || 0;
        lastMonthSharesCount += sharesByMonth[lastMonthKey] || 0;

        // Leads
        const leads = data.leadsGenerated || 0;
        totalLeads += leads;
        const leadsByMonth = data.cardLeadsGeneratedByMonth || {};
        thisMonthLeadsCount += leadsByMonth[thisMonthKey] || 0;
        lastMonthLeadsCount += leadsByMonth[lastMonthKey] || 0;

        // console.log("thisMonthLeadsCount", thisMonthLeadsCount);
        // console.log("lastMonthLeadsCount", lastMonthLeadsCount);

        // Link Clicks
        const linkClicks = data.linkClick || 0;
        totalLinkClicks += linkClicks;
        const linkClicksByMonth = data.linkClicksByMonth || {};
        thisMonthLinkClicksCount += linkClicksByMonth[thisMonthKey] || 0;
        lastMonthLinkClicksCount += linkClicksByMonth[lastMonthKey] || 0;

        // Ads View
        const ads = data.adsView || 0;
        totalAdsView += ads;
        const adsByMonth = data.cardAdsViewByMonth || {};
        thisMonthAdsViewCount += adsByMonth[thisMonthKey] || 0;
        lastMonthAdsViewCount += adsByMonth[lastMonthKey] || 0;

        // Save Contact
        const saveContact = data.saveContact || 0;
        totalSaveContact += saveContact;
        const saveContactsByMonth = data.saveContactsByMonth || {};
        thisMonthSaveContactCount += saveContactsByMonth[thisMonthKey] || 0;
        lastMonthSaveContactCount += saveContactsByMonth[lastMonthKey] || 0;
      });

      const calcPercentChange = (current: number, last: number) =>
        last > 0 ? Number((((current - last) / last) * 100).toFixed(2)) : 0;

      // Update state for all metrics
      setCardView(totalViews);
      setThisMonthViews(thisMonthViewsCount);
      setLastMonthViews(lastMonthViewsCount);
      setPercentageChangeViews(
        calcPercentChange(thisMonthViewsCount, lastMonthViewsCount)
      );

      setCardShare(totalShares);
      setThisMonthShares(thisMonthSharesCount);
      setLastMonthShares(lastMonthSharesCount);
      setPercentageChangeShares(
        calcPercentChange(thisMonthSharesCount, lastMonthSharesCount)
      );

      setCardLeads(totalLeads);
      setThisMonthLeads(thisMonthLeadsCount);
      setLastMonthLeads(lastMonthLeadsCount);
      setPercentageChangeLeads(
        calcPercentChange(thisMonthLeadsCount, lastMonthLeadsCount)
      );

      setCardLinkClicks(totalLinkClicks);
      setThisMonthLinkClicks(thisMonthLinkClicksCount);
      setLastMonthLinkClicks(lastMonthLinkClicksCount);
      setPercentageChangeLinkClicks(
        calcPercentChange(thisMonthLinkClicksCount, lastMonthLinkClicksCount)
      );

      setAdsView(totalAdsView);
      setThisMonthAdsView(thisMonthAdsViewCount);
      setLastMonthAdsView(lastMonthAdsViewCount);
      setPercentageChangeAdsView(
        calcPercentChange(thisMonthAdsViewCount, lastMonthAdsViewCount)
      );

      // Save Contact
      setCardSaveContact(totalSaveContact);
      setThisMonthSaveContact(thisMonthSaveContactCount);
      setLastMonthSaveContact(lastMonthSaveContactCount);
      setPercentageChangeSaveContact(
        calcPercentChange(thisMonthSaveContactCount, lastMonthSaveContactCount)
      );
    } catch (error) {
      console.error("Error fetching card stats:", error);
    }
  }

  function parseCreatedAt(input: any) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  useEffect(() => {
    if (user) {
      const isFree = user?.planType === "free";
      setIsFreePlan(isFree);

      const createdAt = parseCreatedAt(user?.createdAt);
      const trialEnd = new Date(
        createdAt.getTime() + user?.freeTrialPeriod * 24 * 60 * 60 * 1000
      );
      const trialActive = new Date() <= trialEnd;
      setIsTrialActive(trialActive);
      fetchUserCardStats(user?.uid);
    }
  }, [user]);
  const isProLocked = isFreePlan && !isTrialActive;

  return (
    //     <div
    //   className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 transition-all duration-300 ${
    //     isProLocked ? "opacity-60 blur-[2px] pointer-events-none" : ""
    //   }`}
    // >

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 transition-all duration-300">
      <StatCard
        title="Card Views"
        value={cardView}
        icon={null}
        change={`${percentageChangeViews.toFixed(0)}%`}
        trend={
          percentageChangeViews > 0
            ? "up"
            : percentageChangeViews < 0
            ? "down"
            : "neutral"
        }
      />

      <StatCard
        title="Card Saves"
        value={cardSaveContact}
        icon={null}
        change={`${percentageChangeSaveContact.toFixed(0)}%`}
        trend={
          percentageChangeSaveContact > 0
            ? "up"
            : percentageChangeSaveContact < 0
            ? "down"
            : "neutral"
        }
      />

      <StatCard
        title="Card Shares"
        value={cardShare}
        icon={null}
        change={`${percentageChangeShares.toFixed(0)}%`}
        trend={
          percentageChangeShares > 0
            ? "up"
            : percentageChangeShares < 0
            ? "down"
            : "neutral"
        }
      />

      <StatCard
        title="Link Clicks"
        value={cardLinkClicks}
        icon={null}
        change={`${percentageChangeLinkClicks.toFixed(0)}%`}
        trend={
          percentageChangeLinkClicks > 0
            ? "up"
            : percentageChangeLinkClicks < 0
            ? "down"
            : "neutral"
        }
      />

      <StatCard
        title="Ad Views"
        value={adsView}
        icon={<Crown size={12} className="text-yellow-500" />}
        change={`${percentageChangeAdsView.toFixed(0)}%`}
        trend={
          percentageChangeAdsView > 0
            ? "up"
            : percentageChangeAdsView < 0
            ? "down"
            : "neutral"
        }
      />

      <StatCard
        title="Leads Generated"
        value={cardLeads}
        icon={<Crown size={12} className="text-yellow-500" />}
        change={`${percentageChangeLeads.toFixed(0)}%`}
        trend={
          percentageChangeLeads > 0
            ? "up"
            : percentageChangeLeads < 0
            ? "down"
            : "neutral"
        }
      />
    </div>
  );
}
