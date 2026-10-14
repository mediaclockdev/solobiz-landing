"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ExternalLink, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
// shadcn dialog
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  setDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import UpgradeModal from "@/components/UpgradeModal";

export default function Support() {
  const [open, setOpen] = React.useState(true);
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [formData, setFormData] = useState({
    userName: "",
    userEmail: "",
    subject: "",
    issueDescription: "",
  });

  function parseCreatedAt(input: any) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  // ✅ Fetch user details from Firestore
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      const userRef = doc(db, "users", user?.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setFormData((prev) => ({
          ...prev,
          userName: data.displayName || "",
          userEmail: data.email || "",
        }));
      }
      setIsLoading(false);
    };

    const isFree = user?.planType === "free";

    setIsFreePlan(isFree);
    const createdAt = parseCreatedAt(user?.createdAt);
    const trialEnd = new Date(
      createdAt.getTime() + user?.freeTrialPeriod * 24 * 60 * 60 * 1000
    );
    const trialActive = new Date() <= trialEnd;
    setIsTrialActive(trialActive);

    fetchUserData();
  }, [authLoading, user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubjectChange = (value) => {
    setFormData({ ...formData, subject: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      // Store issue in Firestore
      await addDoc(collection(db, "support_data"), {
        userId: user?.uid || null,
        userName: formData.userName,
        userEmail: formData.userEmail,
        subject: formData.subject,
        issueDescription: formData.issueDescription,
        createdAt: serverTimestamp(),
      });

      // Send email (optional)
      const res = await fetch("/api/send-support-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // Update "public" count in the same collection
      const docRef = doc(db, "support", "admin");
      await setDoc(docRef, { count: increment(1) }, { merge: true });

      setLoading(false);

      if (res.ok) {
        showToast("Your issue has been submitted successfully!", "success");
        setFormData({
          userName: formData.userName,
          userEmail: formData.userEmail,
          subject: "",
          issueDescription: "",
        });
      } else {
        showToast("Failed to send email. Please try again later.", "error");
      }
    } catch (error) {
      console.error("Error submitting issue:", error);
      showToast("An error occurred while submitting the issue.", "error");
      setLoading(false);
    }
  };
  const isProLocked = isFreePlan && !isTrialActive;
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-card min-h-screen p-6">
      {/* Top section with two cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:border-gray-400 transition-colors">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div>
                <h3 className="text-base font-medium mb-1">
                  Have a question?
                </h3>
                <p className="text-sm text-gray-600">
                  Check out our Help Center!
                </p>
              </div>
              <Link
                href="https://www.solobizcards.com/support"
                passHref
              >
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  Visit Help Center
                  <ExternalLink size={14} />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-gray-400 transition-colors">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div>
                <h3 className="text-base font-medium mb-1">
                  Want to get the most out of DigiPro?
                </h3>
                <p className="text-sm text-gray-600">
                  Explore helpful tips and tricks in our blog
                </p>
              </div>
              <Link href="https://www.solobizcards.com/blog" passHref>
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  Visit Our Blog
                  <ExternalLink size={14} />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Support Articles Section */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          Top Support Articles
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Check out our quick start articles to get started fast.
        </p>

        {/* First row - 4 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Dashboard Platform card with Dialog */}
          <Card className="hover:border-gray-400 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium border-b border-border pb-2">
                Dashboard Platform
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-4">
                How to navigate the Dashboard as a Free or Paid card member.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 p-0 h-auto flex items-center gap-1"
                  >
                    View Article
                    <ArrowRight size={14} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="fixed left-[50%] bottom-0 z-50 grid w-full translate-x-[-50%] gap-4 border bg-background p-6 shadow-lg duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:rounded-t-lg max-w-4xl max-h-[90vh] overflow-hidden">
                  {/* Header */}
                  <DialogHeader className="flex flex-col space-y-1.5 text-center sm:text-left">
                    <DialogTitle className="font-semibold tracking-tight text-2xl">
                      Dashboard Platform
                    </DialogTitle>
                    <DialogDescription>
                      Learn how to navigate the SoloBizCards dashboard
                    </DialogDescription>
                  </DialogHeader>

                  {/* Scrollable Content */}
                  <div className="relative overflow-y-scroll h-[calc(90vh-100px)] pr-2">
                    <div className="prose prose-sm max-w-none space-y-4">
                      <h2 className="text-xl font-semibold mt-4">
                        How to Navigate the Dashboard as a Free or Paid Card
                        Member
                      </h2>
                      <p className="text-gray-700">
                        In today's fast-paced entrepreneurial world, networking
                        isn't just about exchanging paper business cards—it's
                        about creating lasting digital connections that drive
                        leads, foster collaborations, and fuel business growth.
                        At{" "}
                        <a
                          href="https://solobizcards.com"
                          className="text-blue-600 underline"
                        >
                          SoloBizCards.com
                        </a>
                        , we've revolutionized the way solo entrepreneurs,
                        freelancers, and small business owners present
                        themselves with our smart digital business cards. These
                        aren't just static PDFs; they're interactive, trackable
                        tools that capture contact details, showcase your
                        portfolio, and even generate passive income through
                        referrals.
                      </p>
                      <p className="text-gray-700">
                        At the heart of the SoloBizCards experience is our
                        intuitive <strong>Dashboard Platform</strong>—your
                        command center for managing cards, tracking performance,
                        and unlocking growth opportunities. Whether you're a
                        Free Card Member dipping your toes into digital
                        networking or a Paid Card Member leveraging premium
                        features for scalable success, the dashboard is designed
                        for seamless navigation. No steep learning curves here:
                        with a clean interface, real-time insights, and
                        role-based access, you'll be optimizing your network in
                        minutes.
                      </p>
                      <p className="text-gray-700">
                        This comprehensive guide will walk you through
                        everything you need to know about navigating the
                        SoloBizCards dashboard. We'll cover logging in, key
                        sections, step-by-step instructions for core tasks, and
                        highlight the enhanced capabilities available to Paid
                        members. By the end, you'll be equipped to maximize your
                        digital cards, turning every scan into a potential
                        revenue stream. Let's dive in and get you
                        dashboard-ready!
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Why the SoloBizCards Dashboard Matters
                      </h3>
                      <p className="text-gray-700">
                        Before we explore the nuts and bolts, let's set the
                        stage. The dashboard isn't just a backend tool—it's your
                        strategic hub. For Free members, it provides essential
                        access to create, share, and monitor basic card
                        performance. Paid members enjoy elevated privileges,
                        like advanced analytics, unlimited customizations, and
                        affiliate tools that can earn you commissions on
                        referrals.
                      </p>
                      <p className="text-gray-700">
                        Imagine scanning a QR code at a networking event: the
                        recipient's details flow straight to your dashboard,
                        where you can nurture that lead with automated
                        follow-ups. Or picture reviewing engagement metrics to
                        refine your card's design for higher conversion rates.
                        That's the power of the SoloBizCards
                        dashboard—empowering you to network smarter, not harder.
                      </p>
                      <p className="text-gray-700">
                        Our platform supports two membership tiers:
                      </p>
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Feature
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Free Card Member
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Paid Card Member
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Card Creation</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                1 Basic Digital Card
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Unlimited Cards with Premium Templates
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Sharing Options</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                QR Code, Link, Email
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                + Social Integrations, Bulk Sharing
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Analytics</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Basic Views &amp; Scans
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Advanced Metrics (e.g., Geo-Tracking, A/B
                                Testing)
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Lead Capture</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Unlimited Contacts
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                + CRM Exports, Automated Workflows
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Earning Potential</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Referral Commissions (Basic)
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Full Affiliate Program + Passive Income Tools
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Support</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Community Forums
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Priority Email/Chat Support
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Price</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                $0 Forever
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Starting at $9.99/month (Billed Annually)
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-gray-700">
                        This table outlines the core differences, but the
                        dashboard unifies the experience, adapting to your tier
                        for a tailored journey. Now, let's get you logged in and
                        exploring.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Getting Started: Logging In and Initial Setup
                      </h3>
                      <p className="text-gray-700">
                        Accessing your dashboard is as simple as a quick
                        login—designed for busy solopreneurs who value time.
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                        <li>
                          <strong>
                            Navigate to{" "}
                            <a
                              href="https://solobizcards.com"
                              className="text-blue-600 underline"
                            >
                              SoloBizCards.com
                            </a>
                          </strong>
                          : Open your web browser (we recommend Chrome or
                          Firefox for optimal performance) and head to{" "}
                          <a
                            href="https://solobizcards.com"
                            className="text-blue-600 underline"
                          >
                            https://solobizcards.com
                          </a>
                          . The homepage greets you with a vibrant
                          call-to-action: "Create Your Free Card in 60 Seconds."
                        </li>
                        <li>
                          <strong>Sign In or Register</strong>:
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li>
                              If you're new, click "Get Started Free." Enter
                              your email, create a password, and verify via the
                              confirmation link sent to your inbox. No credit
                              card required for Free members—ever.
                            </li>
                            <li>
                              Returning users: Click "Log In" in the top-right
                              corner. Use your email and password, or connect
                              via Google/Apple for one-click access.
                            </li>
                            <li>
                              Pro Tip for Paid Members: During signup, you'll
                              have the option to upgrade immediately for instant
                              access to premium templates.
                            </li>
                          </ul>
                        </li>
                        <li>
                          <strong>
                            Two-Factor Authentication (Optional but Recommended)
                          </strong>
                          : For added security, enable 2FA in your account
                          settings. This ensures only you can access sensitive
                          lead data.
                        </li>
                      </ol>
                      <p className="text-gray-700 mt-4">
                        Once logged in, you're whisked to the dashboard
                        homepage—a clean, responsive layout that works
                        seamlessly on desktop, tablet, or mobile. The top
                        navigation bar features your profile icon (for quick
                        settings), a search bar for cards/leads, and a "New
                        Card" button. The sidebar on the left houses main
                        sections, while the central pane displays your
                        personalized overview.
                      </p>
                      <p className="text-gray-700">
                        Welcome screen highlights:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                        <li>
                          <strong>Quick Stats</strong>: Total scans, new leads,
                          and referral earnings (Paid only).
                        </li>
                        <li>
                          <strong>Recent Activity</strong>: A feed of
                          interactions, like "John Doe scanned your card—follow
                          up now!"
                        </li>
                        <li>
                          <strong>Upgrade Nudge</strong>: Gentle prompts for
                          Free members to explore Paid perks.
                        </li>
                      </ul>
                      <p className="text-gray-700 mt-4">
                        If you're a Free member upgrading to Paid, click the
                        "Upgrade" banner on the dashboard. Enter payment details
                        securely via Stripe, and voilà—your interface expands
                        with new tabs and deeper insights. Downgrading? Manage
                        this anytime in Settings &gt; Billing.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Main Navigation: Exploring the Sidebar Menu
                      </h3>
                      <p className="text-gray-700">
                        The left sidebar is your roadmap—collapsible for focus,
                        with icons for intuitive clicking. It's divided into
                        core modules, accessible to all but enriched for Paid
                        users. Hover over icons for tooltips explaining each
                        section.
                      </p>
                      <h4 className="text-base font-semibold mt-4">
                        1. Home/Overview (🏠 Icon)
                      </h4>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                        <li>
                          <strong>Purpose</strong>: Your launchpad. At-a-glance
                          metrics to start your day right.
                        </li>
                        <li>
                          <strong>Free Member View</strong>: Displays your
                          single card's basic stats—scans today, total shares,
                          and a lead summary (e.g., "5 new contacts this week").
                        </li>
                        <li>
                          <strong>Paid Member Enhancements</strong>: Interactive
                          charts showing trends over time, geo-mapped scan
                          locations, and a revenue ticker for affiliate
                          earnings.
                        </li>
                        <li>
                          <strong>Navigation Tip</strong>: Click "Refresh" to
                          pull live data. Use the "Export Summary" button (Paid
                          only) to download a CSV for your records.
                        </li>
                      </ul>
                      <h4 className="text-base font-semibold mt-4">
                        2. My Cards (📇 Icon)
                      </h4>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                        <li>
                          <strong>Purpose</strong>: Manage your digital business
                          cards—create, edit, and duplicate.
                        </li>
                        <li>
                          <strong>Step-by-Step Creation (All Members)</strong>:
                          <ol className="list-decimal list-inside ml-6 mt-2 space-y-1">
                            <li>Click "Create New Card."</li>
                            <li>
                              Choose a template: Free gets minimalist designs;
                              Paid unlocks animated, branded themes.
                            </li>
                            <li>
                              Add details: Name, photo, bio, social links, and a
                              call-to-action (e.g., "Book a Call").
                            </li>
                            <li>
                              Customize: Upload logos, embed videos (Paid), or
                              add lead forms.
                            </li>
                            <li>
                              Preview and publish—generate QR code instantly.
                            </li>
                          </ol>
                        </li>
                        <li>
                          <strong>Free Limitations</strong>: One active card;
                          basic edits.
                        </li>
                        <li>
                          <strong>Paid Perks</strong>: Unlimited cards, A/B
                          testing (compare designs), and version history.
                        </li>
                        <li>
                          <strong>Pro Navigation</strong>: Use the search bar to
                          filter cards by name or status. Drag-and-drop to
                          reorder your portfolio.
                        </li>
                      </ul>
                      <h4 className="text-base font-semibold mt-4">
                        3. Analytics &amp; Insights (📊 Icon)
                      </h4>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                        <li>
                          <strong>Purpose</strong>: Demystify your networking
                          ROI with data-driven decisions.
                        </li>
                        <li>
                          <strong>Free Access</strong>: View total scans, unique
                          visitors, and top referral sources (e.g., "LinkedIn
                          drove 40% of traffic").
                        </li>
                        <li>
                          <strong>Paid Deep Dive</strong>:
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li>
                              Filter by date range, device type, or location.
                            </li>
                            <li>
                              Heatmaps showing click hotspots on your card.
                            </li>
                            <li>
                              Predictive trends: "Based on current velocity,
                              expect 20% more leads next month."
                            </li>
                          </ul>
                        </li>
                        <li>
                          <strong>How to Navigate</strong>:
                          <ol className="list-decimal list-inside ml-6 mt-2 space-y-1">
                            <li>Select a card from the dropdown.</li>
                            <li>
                              Toggle between "Overview," "Engagement," and
                              "Conversions" tabs.
                            </li>
                            <li>
                              Click into a scan for details: Timestamp, IP, and
                              captured info.
                            </li>
                          </ol>
                        </li>
                        <li>
                          <strong>Bonus for Paid</strong>: Integrate with Google
                          Analytics or Zapier for automated reports emailed
                          weekly.
                        </li>
                      </ul>
                      <h4 className="text-base font-semibold mt-4">
                        4. Leads &amp; CRM (👥 Icon)
                      </h4>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                        <li>
                          <strong>Purpose</strong>: Turn scans into
                          relationships—centralized contact management.
                        </li>
                        <li>
                          <strong>Universal Features</strong>: All captured data
                          (name, email, phone) auto-populates here. Tag leads
                          (e.g., "Hot Prospect") and add notes.
                        </li>
                        <li>
                          <strong>Free Tools</strong>: Basic search, export to
                          CSV, and manual follow-up reminders.
                        </li>
                        <li>
                          <strong>Paid Automation</strong>: Set up drip
                          campaigns (e.g., "Day 1: Thank You Email"), segment
                          lists, and score leads based on engagement.
                        </li>
                        <li>
                          <strong>Navigation Flow</strong>:
                          <ol className="list-decimal list-inside ml-6 mt-2 space-y-1">
                            <li>
                              Browse your lead list—sortable by date added or
                              last interaction.
                            </li>
                            <li>
                              Click a contact for a full profile: Interaction
                              history, linked scans.
                            </li>
                            <li>
                              Use the "+" to import external contacts or merge
                              duplicates.
                            </li>
                          </ol>
                        </li>
                        <li>
                          <strong>Growth Hack</strong>: For Paid members, enable
                          "Lead Scoring" to prioritize high-value connections.
                        </li>
                      </ul>
                      <h4 className="text-base font-semibold mt-4">
                        5. Referrals &amp; Earnings (💰 Icon) – Paid Exclusive
                      </h4>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                        <li>
                          <strong>Purpose</strong>: Monetize your network. Earn
                          commissions when friends sign up via your unique
                          referral link.
                        </li>
                        <li>
                          <strong>Key Actions</strong>:
                          <ol className="list-decimal list-inside ml-6 mt-2 space-y-1">
                            <li>Generate shareable promo codes.</li>
                            <li>
                              Track referrals: Pending, approved, and payout
                              status.
                            </li>
                            <li>
                              View earnings dashboard: Monthly totals, with
                              Stripe payout integration.
                            </li>
                          </ol>
                        </li>
                        <li>
                          <strong>Free Teaser</strong>: Basic referral tracking;
                          upgrade to unlock full commissions (up to 30%
                          recurring).
                        </li>
                        <li>
                          <strong>Pro Tip</strong>: Share your link in the
                          21-Day Challenge community for bonus multipliers.
                        </li>
                      </ul>
                      <h4 className="text-base font-semibold mt-4">
                        6. Settings &amp; Profile (⚙️ Icon)
                      </h4>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                        <li>
                          <strong>Shared Access</strong>: Update personal info,
                          billing, notifications, and privacy settings.
                        </li>
                        <li>
                          <strong>Paid Only</strong>: API keys for integrations,
                          custom domains for cards.
                        </li>
                        <li>
                          <strong>Quick Nav</strong>: Sub-tabs for "Account,"
                          "Security," "Billing," and "Integrations."
                        </li>
                      </ul>
                      <p className="text-gray-700 mt-4">
                        The top-right profile menu offers global shortcuts: Help
                        Center, Logout, and "Contact Support" (prioritized for
                        Paid).
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Advanced Tips for Power Users
                      </h3>
                      <p className="text-gray-700">
                        To elevate your dashboard mastery:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                        <li>
                          <strong>Keyboard Shortcuts</strong>: Cmd/Ctrl + K for
                          search; Cmd/Ctrl + N for new card.
                        </li>
                        <li>
                          <strong>Mobile Optimization</strong>: Pinch-to-zoom on
                          analytics; swipe for sidebar.
                        </li>
                        <li>
                          <strong>Customization</strong>: Pin favorite sections
                          to the top of the sidebar (Paid feature).
                        </li>
                        <li>
                          <strong>Troubleshooting Common Issues</strong>:
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li>
                              "Data Not Refreshing?" Clear cache or check
                              internet.
                            </li>
                            <li>
                              "Upgrade Not Showing?" Log out/in or contact
                              support.
                            </li>
                            <li>
                              For Free members eyeing Paid: Simulate premium
                              views via the "Preview Mode" in Settings.
                            </li>
                          </ul>
                        </li>
                      </ul>
                      <p className="text-gray-700 mt-4">
                        Security is paramount— we use end-to-end encryption for
                        leads and comply with GDPR/CCPA.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Conclusion: Dashboard Your Way to Networking Success
                      </h3>
                      <p className="text-gray-700">
                        Congratulations—you're now a dashboard pro! Whether as a
                        Free Card Member building your foundational network or a
                        Paid Card Member scaling to passive income streams, the
                        SoloBizCards Dashboard Platform puts control at your
                        fingertips. Remember, every great connection starts with
                        a simple scan, but it's the insights and actions in your
                        dashboard that turn them into lasting value.
                      </p>
                      <p className="text-gray-700">
                        Ready to create your first card? Head to{" "}
                        <a
                          href="https://solobizcards.com"
                          className="text-blue-600 underline"
                        >
                          solobizcards.com
                        </a>{" "}
                        and log in today. For Free members, experiment with
                        basics; for Paid, dive into analytics and referrals.
                        Questions? Our community forums and support team are
                        here to help.
                      </p>
                      <p className="text-gray-700">
                        Network smarter. Grow faster. With SoloBizCards, your
                        dashboard isn't just a tool—it's your competitive edge.
                        What's your next scan going to unlock?
                      </p>
                      <p className="text-gray-700 italic mt-4 mb-4">
                        Join the 10,000+ solopreneurs who've ditched paper cards
                        for digital dominance. Start free now!
                      </p>
                    </div>
                  </div>

                  {/* Footer / Actions */}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Close
                    </Button>
                    <Button
                      onClick={() =>
                        window.open("https://solobizcards.com", "_blank")
                      }
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Create a Card 101 */}
          <Card className="hover:border-gray-400 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium border-b border-border pb-2">
                Create a card 101
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-4">
                You create a basic card initially, then after login, you can
                change templates and card designs, add more photos and even a
                company logo and more.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 p-0 h-auto flex items-center gap-1"
                  >
                    View Article
                    <ArrowRight size={14} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="fixed left-[50%] bottom-0 z-50 grid w-full translate-x-[-50%] gap-4 border bg-background p-6 shadow-lg duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:rounded-t-lg max-w-4xl max-h-[90vh] overflow-hidden">
                  <DialogHeader className="flex flex-col space-y-1.5 text-center sm:text-left">
                    <DialogTitle className="font-semibold tracking-tight text-2xl">
                      Create a Card 101
                    </DialogTitle>
                    <DialogDescription>
                      You create a basic card initially, then after login, you
                      can change templates and card designs, add more photos and
                      even a company logo and more.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="relative overflow-y-scroll h-[calc(90vh-100px)] pr-2">
                    <div className="prose prose-sm max-w-none space-y-4">
                      <h2 className="text-xl font-semibold mt-4">
                        Your Guide to Crafting a Standout Digital Business Card
                        with SoloBizCards
                      </h2>
                      <p className="text-gray-700">
                        In the digital age, a business card is no longer just a
                        piece of paper—it's a dynamic, interactive tool that can
                        open doors, capture leads, and showcase your brand in
                        seconds. At{" "}
                        <a
                          href="https://solobizcards.com"
                          className="text-blue-600 underline"
                        >
                          SoloBizCards.com
                        </a>
                        , we've made it effortless for solo entrepreneurs,
                        freelancers, and small business owners to create smart
                        digital business cards that do more than just share
                        contact info. With our intuitive platform, you can
                        design a basic card in under a minute, then customize it
                        with premium templates, photos, logos, and advanced
                        features after login. Whether you're a Free Card Member
                        starting out or a Paid Card Member scaling your network,
                        this guide will walk you through the process of creating
                        and enhancing your card to make every connection count.
                      </p>
                      <p className="text-gray-700">
                        This article is your step-by-step roadmap to mastering
                        card creation on{" "}
                        <a
                          href="https://solobizcards.com"
                          className="text-blue-600 underline"
                        >
                          SoloBizCards.com
                        </a>
                        . From building your first basic card to unlocking a
                        world of customization options, we'll cover everything
                        you need to know to craft a digital card that reflects
                        your brand and drives results. Let's get started and
                        create a card that works as hard as you do!
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Why Choose a SoloBizCards Digital Card?
                      </h3>
                      <p className="text-gray-700">
                        Before diving into the how-to, let's talk about why a
                        digital business card is a game-changer. Unlike
                        traditional cards, SoloBizCards are eco-friendly,
                        instantly shareable via QR code or link, and packed with
                        features like lead capture, real-time analytics, and
                        referral earning potential. They're designed for today's
                        fast-paced networking, whether you're at a conference,
                        virtual event, or sharing on social media.
                      </p>
                      <p className="text-gray-700">
                        Here's what sets SoloBizCards apart:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>
                          <strong>Free to Start</strong>: Create a basic card at
                          no cost, with no credit card required.
                        </li>
                        <li>
                          <strong>Scalable Design</strong>: Upgrade to Paid for
                          premium templates, unlimited cards, and advanced
                          customization.
                        </li>
                        <li>
                          <strong>Trackable Impact</strong>: Monitor scans and
                          leads through the dashboard (more on that later).
                        </li>
                        <li>
                          <strong>Passive Income</strong>: Paid members can earn
                          commissions via referrals.
                        </li>
                      </ul>
                      <p className="text-gray-700">
                        Whether you're a freelancer showcasing your portfolio or
                        a startup founder pitching to investors, your card is
                        your digital handshake. Let's build one that leaves a
                        lasting impression.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Step 1: Creating Your Basic Card
                      </h3>
                      <p className="text-gray-700">
                        Getting started with SoloBizCards is as easy as 1-2-3.
                        You don't need design skills or tech expertise—our
                        platform is built for simplicity.
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                        <li>
                          <strong>
                            Visit{" "}
                            <a
                              href="https://solobizcards.com"
                              className="text-blue-600 underline"
                            >
                              SoloBizCards.com
                            </a>
                          </strong>
                          : Open your browser (Chrome or Safari recommended) and
                          navigate to{" "}
                          <a
                            href="https://solobizcards.com"
                            className="text-blue-600 underline"
                          >
                            https://solobizcards.com
                          </a>
                          . The homepage invites you to "Create Your Free Card
                          in 60 Seconds."
                        </li>
                        <li>
                          <strong>Sign Up for Free</strong>:
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li>Click "Get Started Free."</li>
                            <li>
                              Enter your email and create a password.
                              Alternatively, use Google or Apple for one-click
                              registration.
                            </li>
                            <li>
                              Verify your email via the confirmation link sent
                              to your inbox. This unlocks your Free Card Member
                              account—no payment needed.
                            </li>
                          </ul>
                        </li>
                        <li>
                          <strong>Build Your Basic Card</strong>:
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li>
                              After signing up, you're directed to the card
                              creation wizard.
                            </li>
                            <li>
                              <strong>Select a Template</strong>: Free members
                              get access to minimalist, professional templates.
                              Choose one that aligns with your brand (e.g.,
                              clean white for corporate, vibrant for creatives).
                            </li>
                            <li>
                              <strong>Add Core Details</strong>:
                              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                <li>
                                  Name and job title (e.g., "Jane Doe, Graphic
                                  Designer").
                                </li>
                                <li>
                                  Contact info: Phone, email, and one social
                                  media link (e.g., LinkedIn).
                                </li>
                                <li>
                                  Optional bio: A short pitch, like "Helping
                                  brands shine with bold designs."
                                </li>
                              </ul>
                            </li>
                            <li>
                              <strong>Preview &amp; Publish</strong>: Review
                              your card on a mobile-friendly preview. Click
                              "Publish" to generate a unique QR code and
                              shareable link.
                            </li>
                          </ul>
                        </li>
                      </ol>
                      <p className="text-gray-700 mt-4">
                        That's it! In under a minute, your basic card is live,
                        ready to share via email, text, or QR code. Free members
                        are limited to one active card with basic fields, but
                        don't worry—after login, you can upgrade and unlock a
                        world of customization.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Step 2: Logging In and Accessing the Dashboard
                      </h3>
                      <p className="text-gray-700">
                        Once your basic card is created, the real fun begins.
                        Log in to the SoloBizCards dashboard to manage and
                        enhance your card. Here's how:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                        <li>
                          <strong>Log In</strong>: From the homepage, click "Log
                          In" in the top-right corner. Use your email/password
                          or Google/Apple credentials.
                        </li>
                        <li>
                          <strong>Explore the Dashboard</strong>: The dashboard
                          is your command center. The left sidebar includes "My
                          Cards," where your newly created card lives. Click it
                          to view, edit, or share.
                        </li>
                      </ol>
                      <p className="text-gray-700 mt-4">
                        The dashboard is intuitive, with a clean layout that
                        works on desktop or mobile. Free members see core
                        features like card editing and basic analytics (scans
                        and views). Paid members unlock advanced tools, which
                        we'll explore below.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Step 3: Customizing Your Card
                      </h3>
                      <p className="text-gray-700">
                        After login, you can transform your basic card into a
                        powerful branding tool. The "My Cards" section lets you
                        edit your existing card or create new ones (Paid members
                        only). Here's how to level up your design:
                      </p>
                      <h4 className="text-base font-semibold mt-4">
                        1. Change Templates and Designs
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>
                          <strong>Free Members</strong>: Choose from a curated
                          selection of basic templates. Adjust colors (e.g.,
                          swap blue for green) and fonts (e.g., professional
                          serif or modern sans-serif).
                        </li>
                        <li>
                          <strong>Paid Members</strong>: Unlock premium
                          templates with animations, gradients, and
                          industry-specific designs (e.g., real estate, tech,
                          creative). Switch templates without losing data—your
                          info auto-populates.
                        </li>
                        <li>
                          <strong>How-To</strong>:
                          <ol className="list-decimal list-inside ml-6 mt-2 space-y-1">
                            <li>
                              In "My Cards," select your card and click "Edit
                              Design."
                            </li>
                            <li>
                              Browse the template gallery. Filter by style or
                              industry.
                            </li>
                            <li>
                              Preview changes in real-time. Save to update your
                              live card.
                            </li>
                          </ol>
                        </li>
                      </ul>
                      <h4 className="text-base font-semibold mt-4">
                        2. Add More Photos
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>
                          <strong>Why It Matters</strong>: A headshot or
                          portfolio image builds trust and showcases your work.
                        </li>
                        <li>
                          <strong>Free Members</strong>: Add one profile photo
                          (JPG/PNG, max 2MB).
                        </li>
                        <li>
                          <strong>Paid Members</strong>: Upload multiple images
                          to create a mini-gallery (e.g., product shots, event
                          photos). Embed videos (e.g., a 30-second pitch) for
                          extra impact.
                        </li>
                        <li>
                          <strong>How-To</strong>:
                          <ol className="list-decimal list-inside ml-6 mt-2 space-y-1">
                            <li>In the card editor, click "Add Media."</li>
                            <li>Upload from your device or drag-and-drop.</li>
                            <li>
                              Arrange images in a carousel (Paid) or set a
                              primary photo (Free).
                            </li>
                          </ol>
                        </li>
                      </ul>
                      <h4 className="text-base font-semibold mt-4">
                        3. Incorporate a Company Logo
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>
                          <strong>Why It Matters</strong>: A logo reinforces
                          brand identity, especially for startups or
                          freelancers.
                        </li>
                        <li>
                          <strong>Free Members</strong>: Limited to text-based
                          branding (e.g., company name in bio).
                        </li>
                        <li>
                          <strong>Paid Members</strong>: Upload your logo (PNG
                          with transparent background recommended) to display
                          prominently on your card.
                        </li>
                        <li>
                          <strong>How-To</strong>:
                          <ol className="list-decimal list-inside ml-6 mt-2 space-y-1">
                            <li>In the editor, select "Branding" or "Logo."</li>
                            <li>Upload your logo and adjust size/position.</li>
                            <li>
                              Save to ensure it appears on QR scans and shared
                              links.
                            </li>
                          </ol>
                        </li>
                      </ul>
                      <h4 className="text-base font-semibold mt-4">
                        4. Add Advanced Features (Paid Members)
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>
                          <strong>Social Integrations</strong>: Link multiple
                          platforms (Instagram, Twitter, TikTok) for broader
                          reach.
                        </li>
                        <li>
                          <strong>Lead Capture Forms</strong>: Embed forms to
                          collect names, emails, or custom fields (e.g.,
                          "Interested in: Consulting/Coaching").
                        </li>
                        <li>
                          <strong>Call-to-Action Buttons</strong>: Add clickable
                          buttons like "Book a Call" or "Visit Portfolio."
                        </li>
                        <li>
                          <strong>Custom Domains</strong>: Use your own URL
                          (e.g., cards.yourbrand.com) for a professional touch.
                        </li>
                      </ul>
                      <h4 className="text-base font-semibold mt-4">
                        5. Test and Publish
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>
                          Preview your card on desktop and mobile to ensure it
                          looks sharp.
                        </li>
                        <li>
                          Click "Publish" to update your live card. Existing QR
                          codes and links automatically reflect changes.
                        </li>
                      </ul>
                      <h3 className="text-lg font-semibold mt-6">
                        Step 4: Sharing and Tracking Your Card
                      </h3>
                      <p className="text-gray-700">
                        Once customized, your card is ready to shine. Share it
                        via:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>
                          <strong>QR Code</strong>: Display at events or on
                          marketing materials. Download as a PNG from the
                          dashboard.
                        </li>
                        <li>
                          <strong>Link</strong>: Copy your unique URL for
                          emails, social bios, or websites.
                        </li>
                        <li>
                          <strong>Social Integrations (Paid)</strong>: Auto-post
                          to LinkedIn or Twitter with one click.
                        </li>
                      </ul>
                      <p className="text-gray-700 mt-4">
                        Track performance in the "Analytics &amp; Insights"
                        dashboard section:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>
                          <strong>Free Members</strong>: See total scans and
                          unique visitors.
                        </li>
                        <li>
                          <strong>Paid Members</strong>: Dive into advanced
                          metrics like scan locations, device types, and
                          conversion rates.
                        </li>
                      </ul>
                      <p className="text-gray-700 mt-4">
                        <strong>Pro Tip</strong>: Paid members can A/B test
                        designs (e.g., logo vs. no logo) to optimize engagement.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Free vs. Paid: What's Right for You?
                      </h3>
                      <p className="text-gray-700">
                        Here's a quick comparison to help you decide:
                      </p>
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Feature
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Free Card Member
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Paid Card Member
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Templates</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Basic Designs
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Premium + Animated Templates
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Cards Allowed</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                1 Active Card
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Unlimited Cards
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Media</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                1 Photo
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Multiple Photos + Videos
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Branding</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Text-Based
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Logo + Custom Domains
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Analytics</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Basic Scans
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Advanced Metrics + A/B Testing
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Lead Capture</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Basic Form
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Custom Forms + Automation
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Price</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                $0 Forever
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Starting at $9.99/month (Billed Annually)
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-gray-700">
                        To upgrade, click "Upgrade" in the dashboard and follow
                        the secure Stripe checkout. No long-term commitment—you
                        can downgrade anytime.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Best Practices for a Stellar Card
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>
                          <strong>Keep It Concise</strong>: Highlight essential
                          info—name, title, contact, and a clear call-to-action.
                        </li>
                        <li>
                          <strong>Brand Consistency</strong>: Use colors and
                          fonts that match your website or portfolio.
                        </li>
                        <li>
                          <strong>Test on Mobile</strong>: Ensure your card
                          looks great on smaller screens.
                        </li>
                        <li>
                          <strong>Update Regularly</strong>: Refresh your bio or
                          photos to reflect new projects or achievements.
                        </li>
                        <li>
                          <strong>Leverage Analytics</strong>: Paid members
                          should monitor scan trends to refine their approach.
                        </li>
                      </ul>
                      <h3 className="text-lg font-semibold mt-6">
                        Conclusion: Your Card, Your Brand, Your Success
                      </h3>
                      <p className="text-gray-700">
                        Creating a digital business card with SoloBizCards is
                        more than a task—it's an opportunity to redefine how you
                        network. Start with a basic card in under a minute, then
                        log in to unlock a world of customization, from premium
                        templates to logos and lead-capture forms. Whether you
                        stick with the Free plan or upgrade to Paid for advanced
                        features, your card will be a powerful extension of your
                        brand.
                      </p>
                      <p className="text-gray-700">
                        Ready to make your mark? Head to{" "}
                        <a
                          href="https://solobizcards.com"
                          className="text-blue-600 underline"
                        >
                          solobizcards.com
                        </a>
                        , create your free card, and start customizing. Join
                        thousands of solopreneurs turning scans into
                        opportunities. Your next big connection is just a QR
                        code away!
                      </p>
                      <p className="text-gray-700 italic font-semibold">
                        Create your card today and network smarter with
                        SoloBizCards!
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Other Features */}
          <Card className="hover:border-gray-400 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium border-b border-border pb-2">
                Other Features
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-4">
                You can also add a custom URL, free QR code, add a logo to your
                QR code, and an email signature to your card.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 p-0 h-auto flex items-center gap-1"
                  >
                    View Article
                    <ArrowRight size={14} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="fixed left-[50%] bottom-0 z-50 grid w-full translate-x-[-50%] gap-4 border bg-background p-6 shadow-lg duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:rounded-t-lg max-w-4xl max-h-[90vh] overflow-hidden">
                  <DialogHeader className="flex flex-col space-y-1.5 text-center sm:text-left">
                    <DialogTitle className="font-semibold tracking-tight text-2xl">
                      Other Features
                    </DialogTitle>
                  </DialogHeader>
                  <div className="relative overflow-y-scroll h-[calc(90vh-100px)] pr-2">
                    <div className="prose prose-sm max-w-none space-y-4">
                      <h2 className="text-xl font-semibold mt-4">
                        Unlock Hidden Gems:
                      </h2>
                      <h2 className="text-xl font-semibold mt-4">
                        Custom URLs, QR Codes, Logos, and Email Signatures on
                        SoloBizCards :
                      </h2>
                      <p className="text-gray-700">
                        In the world of solo entrepreneurship, every detail
                        matters. Your digital business card isn't just a
                        contact-sharing tool—it's a gateway to your brand, a
                        lead magnet, and a subtle nod to your professionalism.
                        At{" "}
                        <a
                          href="https://solobizcards.com"
                          className="text-blue-600 underline"
                        >
                          SoloBizCards.com
                        </a>
                        , we've gone beyond the basics of card creation to offer
                        features that make your networking seamless and
                        standout. Imagine claiming a custom URL that screams
                        "you," slapping a free QR code on every pitch deck,
                        embedding your logo right into that QR for instant brand
                        recognition, and turning your daily emails into
                        mini-networking machines with an integrated signature.
                        These aren't just add-ons; they're the secret sauce that
                        turns casual scans into lasting connections.{" "}
                      </p>
                      <p className="text-gray-700">
                        This article dives deep into these powerhouse features,
                        showing you how to implement them step-by-step. Whether
                        you're a Free Card Member keeping things lean or a Paid
                        Card Member stacking every advantage, these tools will
                        elevate your digital presence. We'll explore the why,
                        the how, and the wow-factor, all tailored for busy
                        solopreneurs who want to network smarter, not harder.
                        Let's uncover these features and supercharge your
                        SoloBizCards experience!{" "}
                      </p>
                      <h2 className="text-xl font-semibold mt-4">
                        The Power of Personalization:
                      </h2>
                      <h2 className="text-xl font-semibold mt-4">
                        Why These Features Matter
                      </h2>
                      <p className="text-gray-700">
                        Before we roll up our sleeves, consider this: In a sea
                        of generic LinkedIn profiles and faded paper cards, what
                        makes someone remember you? It's the thoughtful
                        touches—the branded QR that feels like an extension of
                        your vibe, the custom URL that looks like it belongs on
                        a billboard, or the email signature that turns every
                        "thanks" into a potential collaboration. According to
                        industry insights, personalized digital assets like
                        these can boost engagement by up to 30%, as they build
                        trust and make sharing effortless.{" "}
                      </p>
                      <p className="text-gray-700">
                        At SoloBizCards, these features are designed with you in
                        mind:{" "}
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>
                          <strong>Eco-Friendly and Scalable</strong>: No more
                          printing stacks of cards; update once, share forever.
                        </li>
                        <li>
                          <strong>Trackable Results</strong>:Pair them with
                          dashboard analytics to see what's driving scans and
                          clicks.
                        </li>
                        <li>
                          <strong>Free Tier Friendly</strong>: Start basic for
                          free, upgrade for pro-level polish.
                        </li>
                      </ul>
                      <p className="text-gray-700">
                        For Free members, these tools provide essential branding
                        without barriers. Paid members get extras like dynamic
                        QR updates and advanced signature integrations. Ready to
                        customize? Let's break it down.
                      </p>
                      <h2 className="text-xl font-semibold mt-4">
                        Feature 1: Add a Custom URL to Your Card
                      </h2>
                      <p className="text-gray-700">
                        A custom URL is your digital real estate—think
                        "solobizcards.com/yourname" instead of a clunky random
                        string. It screams professionalism, improves SEO, and
                        makes you
                      </p>
                      <h2 className="text-xl font-semibold mt-4">
                        Why It Rocks for Solopreneurs
                      </h2>
                      <p className="text-gray-700">
                        Custom URLs foster memorability. Imagine emailing a
                        prospect: "Scan here for my
                        portfolio—yourname.solobizcards.com." It's clean,
                        shareable, and positions you as a pro. Plus, it
                        integrates seamlessly with social bios, websites, and
                        even print materials.
                      </p>
                      <h2 className="text-xl font-semibold mt-4">
                        Step-by-Step: How to Set It Up
                      </h2>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>
                          <strong>Log In to Your Dashboard</strong>: Head to
                          <a
                            href="https://solobizcards.com"
                            className="text-blue-600 underline"
                          >
                            solobizcards.com{" "}
                          </a>{" "}
                          and sign in. Navigate to "My Cards" in the left
                          sidebar.
                        </li>
                        <li>
                          <strong>Edit Sharing Options</strong>:In the editor,
                          scroll to the "Sharing & Links" tab. Toggle "Custom
                          URL" on.
                        </li>
                        <li>
                          <strong>Claim Your Domain</strong>:Enter your desired
                          slug (e.g., "jane-designer"). Check availability—our
                          system verifies in real-time. Free members get basic
                          slugs; Paid unlocks vanity options like subdomains.
                        </li>
                        <li>
                          <strong>Claim Your Domain</strong>:Enter your desired
                          slug (e.g., "jane-designer"). Check availability—our
                          system verifies in real-time. Free members get basic
                          slugs; Paid unlocks vanity options like subdomains.
                        </li>
                        <li>
                          <strong>Save and Test</strong>:Hit "Publish." Scan
                          your QR or click the link to ensure it redirects
                          perfectly. Pro Tip: Use UTM parameters (Paid only) for
                          tracking traffic sources.
                        </li>
                      </ul>
                      <h3 className="text-lg font-semibold mt-6">
                        Free vs. Paid Breakdown
                      </h3>
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Aspect
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Free Card Member
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Paid Card Member
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Availability</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Basic Slugs (e.g., user123)
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Vanity URLs + Custom Subdomains
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Length Limit</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                20 Characters
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Unlimited + SEO Optimization
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Updates</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Manual Refresh
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Real-Time Edits Without Downtime
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-gray-700">
                        With a custom URL, your card becomes a mini-landing
                        page—add a tagline like "Unlock Creative Solutions" for
                        that extra punch.
                      </p>
                      <h2 className="text-xl font-semibold mt-4">
                        Feature 2: Generate a Free QR Code
                      </h2>
                      <p className="text-gray-700">
                        QR codes are the unsung heroes of modern
                        networking—quick, contactless, and oh-so-2025. At
                        SoloBizCards, every card comes with a free, high-res QR
                        code that's scannable from any device. No apps needed;
                        just point and connect.
                      </p>
                      <h2 className="text-xl font-semibold mt-4">
                        The Edge for Everyday Networking
                      </h2>
                      <p className="text-gray-700">
                        In a post-pandemic world, QR codes have exploded in
                        popularity, with scans up 94% year-over-year for
                        business use. They're perfect for events, trade shows,
                        or even your coffee shop napkin scribbles. Free means
                        zero barrier to entry, and our codes are optimized for
                        error correction—up to 30% logo coverage without
                        failing.
                      </p>
                      <h2 className="text-xl font-semibold mt-4">
                        How to Create and Use Yours
                      </h2>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>
                          <strong>Access the Generator</strong>: From the
                          dashboard's "My Cards" section, select your card and
                          click "Generate QR."
                        </li>
                        <li>
                          <strong>Customize Basics</strong>:Choose size (small
                          for emails, large for prints) and color scheme to
                          match your brand. Free members get static designs;
                          Paid adds animations.
                        </li>
                        <li>
                          <strong>Download Instantly</strong>:Export as PNG,
                          SVG, or EPS. Embed in docs, stickers, or your phone
                          case.
                        </li>
                        <li>
                          <strong>Share Strategically</strong>:Print on business
                          cards, add to slides, or link in bios. Track scans in
                          "Analytics" to see hot spots.
                        </li>
                      </ul>
                      <p className="text-gray-700">
                        Fun Hack: For Free users, pair it with free tools like
                        Canva to mock up print versions. Paid? Integrate with
                        Zapier for auto-shares to Slack or email.{" "}
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Quick Comparison
                      </h3>
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Element
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Free Access
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Paid Enhancements
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Generation</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Unlimited Static QRs
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Dynamic (Editable Post-Print)
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Resolution</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Up to 300 DPI
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Vector + High-Res for Large Prints
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Integration</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Basic Downloads
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                NFC Tags & Wallet Exports
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-gray-700">
                        Fun Your free QR isn't just a code—it's a conversation
                        starter.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Feature 3: Add a Logo to Your QR Code
                      </h3>
                      <p className="text-gray-700">
                        Branding isn't complete without visuals. Embedding your
                        company logo into the QR code turns a functional square
                        into a branded beacon. It's subtle yet powerful,
                        ensuring your identity pops with every scan.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Why Logos Level Up Your Game
                      </h3>
                      <p className="text-gray-700">
                        Logos in QRs boost recognition by 20-30%, per design
                        studies, as they tie the scan directly to your brand
                        memory. Ideal for freelancers with evolving logos or
                        startups reinforcing visual identity—without sacrificing
                        scannability.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Step-by-Step Implementation
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>
                          <strong>Prep Your Logo</strong>: Ensure it's a
                          transparent PNG (under 1MB). Simple designs work best
                          to avoid scan errors.
                        </li>
                        <li>
                          <strong>Enter the Editor</strong>:In "My Cards," open
                          your card, then head to "QR Customization" under
                          Sharing.
                        </li>
                        <li>
                          <strong>Upload and Position</strong>:Drag your logo
                          into the center or corner. Our AI auto-adjusts error
                          correction for reliability.
                        </li>
                        <li>
                          <strong>Preview & Fine-Tune</strong>:Scan-test on
                          multiple devices. Adjust opacity or size for balance.
                        </li>
                        <li>
                          Publish: Save changes—your branded QR updates across
                          all shares.
                        </li>
                      </ul>
                      <p className="text-gray-700">
                        Free members can add one static logo; Paid users enjoy
                        multiples, colors, and frames for that premium flair.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Feature Snapshot
                      </h3>
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Customization
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Free Tier
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Paid Tier
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Logo Slots</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                1 Basic Upload
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Unlimited + Animated Overlays
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Error Correction</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Standard (21%)
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Advanced (Up to 30%)
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Templates</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                None
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Branded Frames & Shapes
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-gray-700">
                        This feature makes your QR unmistakably yours—scan,
                        smile, remember.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Feature 4: Integrate an Email Signature with Your Card
                      </h3>
                      <p className="text-gray-700">
                        Emails are your daily touchpoint—why not make every
                        sign-off a networking win? SoloBizCards lets you embed
                        your full card (QR, links, and all) into an email
                        signature, turning routine replies into opportunity
                        engines.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        The Networking Multiplier
                      </h3>
                      <p className="text-gray-700">
                        Email signatures with digital cards see 40% higher
                        click-throughs, as they provide instant access without
                        extra steps. Perfect for follow-ups, proposals, or
                        casual chats—recipients save you to contacts with one
                        click.
                      </p>

                      <h3 className="text-lg font-semibold mt-6">
                        Easy Setup Guide
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>
                          <strong>Generate Signature Code</strong>: In the
                          dashboard, go to "Integrations" "Email Signature."
                          Select your card.
                        </li>
                        <li>
                          <strong>Customize Layout</strong>:Choose HTML snippet
                          or image-based. Include QR, custom URL, and a teaser
                          like "Let's Connect!"
                        </li>
                        <li>
                          <strong>Copy & Paste</strong>:For Gmail/Outlook/Free
                          members, use the plain HTML. Paid integrates directly
                          via API for auto-sync.
                        </li>
                        <li>
                          <strong>Test Send</strong>:Email yourself—ensure the
                          QR scans and links work.
                        </li>
                        <li>
                          <strong>Advanced Tweaks (Paid):</strong> Add dynamic
                          fields (e.g., latest blog link) or A/B test designs.
                        </li>
                      </ul>

                      <h3 className="text-lg font-semibold mt-6">
                        Free vs. Paid at a Glance
                      </h3>
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Capability
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Free Card Member
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Paid Card Member
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Format</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Static HTML/Image
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Dynamic + Auto-Updates
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Platforms</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Manual Setup (Gmail, etc.)
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Native Integrations (Outlook, etc.)
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2">
                                <strong>Analytics</strong>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Basic Clicks
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                Full Tracking + Lead Alerts
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-gray-700">
                        Your inbox just became your best business card.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Tying It All Together: Best Practices and Pro Tips
                      </h3>
                      <p className="text-gray-700">
                        To maximize these features:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>
                          <strong>Consistency is Key</strong>: Use the same
                          custom URL and logo across cards, signatures, and
                          socials.
                        </li>
                        <li>
                          <strong>Mobile-First</strong>:Always preview on
                          phones—80% of scans happen there.
                        </li>
                        <li>
                          <strong>A/B Testing (Paid)</strong>:Experiment with
                          logo placements or signature CTAs to boost engagement.
                        </li>
                        <li>
                          <strong>Security Note</strong>:All features use HTTPS
                          and GDPR-compliant data handling.
                        </li>
                      </ul>
                      <p className="text-gray-700">
                        Combine them for magic: A custom URL-linked QR with your
                        logo, embedded in a signature—boom, branded ecosystem.
                      </p>
                      <h3 className="text-lg font-semibold mt-6">
                        Conclusion: Feature Up and Network On
                      </h3>
                      <p className="text-gray-700">
                        These "other features" at SoloBizCards aren't
                        extras—they're essentials that transform your digital
                        card from good to unforgettable. A custom URL for
                        polish, free QR for accessibility, logo-embedded scans
                        for branding, and email signatures for constant
                        visibility: together, they create a networking flywheel
                        that works while you sleep.
                      </p>
                      <p className="text-gray-700">
                        Free members, dip in today—no strings. Paid? Unlock the
                        full suite and watch leads flow. Head to
                        <a
                          href="https://solobizcards.com"
                          className="text-blue-600 underline"
                        >
                          &nbsp;SoloBizCards.com
                        </a>
                        , log in, and start customizing. Your next connection
                        isn't a scan away—it's embedded in every detail you
                        share.
                      </p>
                      <p className="text-gray-700">
                        Elevate your edge with SoloBizCards. Create, customize,
                        connect—today!
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Accessories & Orders */}
          <Card className="hover:border-gray-400 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium border-b border-border pb-2">
                Accessories & Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-4">
                Other paid accessories are available to enhance your card
                features even further, like NFC cards.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 p-0 h-auto flex items-center gap-1"
                  >
                    View Article
                    <ArrowRight size={14} />
                  </Button>
                </DialogTrigger>

                <DialogContent className="fixed left-[50%] bottom-0 z-50 grid w-full translate-x-[-50%] gap-4 border bg-background p-6 shadow-lg duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:rounded-t-lg max-w-4xl max-h-[90vh] overflow-hidden">
                  <DialogHeader className="flex flex-col space-y-1.5 text-center sm:text-left">
                    <DialogTitle className="font-semibold tracking-tight text-2xl">
                      Accessories & Orders
                    </DialogTitle>
                  </DialogHeader>
                  <h2 className="text-xl font-semibold mt-4">
                    Enhance Your Networking Edge: Paid Accessories Like NFC
                    Cards for SoloBizCards
                  </h2>
                  <div className="relative overflow-y-scroll h-[calc(90vh-100px)] pr-2">
                    <p className="text-gray-700 mb-4">
                      In the ever-evolving landscape of professional networking,
                      your digital business card is more than a digital
                      handshake—it's a dynamic tool that evolves with your
                      brand. At{" "}
                      <a
                        href="https://solobizcards.com"
                        className="text-blue-600 underline"
                      >
                        SoloBizCards.com
                      </a>
                      , we've empowered thousands of solo entrepreneurs,
                      freelancers, and small business owners with smart,
                      interactive cards that capture leads, showcase portfolios,
                      and even generate referral income. But why stop at the
                      screen? Our lineup of paid accessories takes your digital
                      presence into the physical world, blending cutting-edge
                      tech with tangible impact. From sleek NFC cards that share
                      your profile with a single tap to customizable holders and
                      stands that keep your branding front and center, these
                      add-ons supercharge your networking strategy.
                    </p>
                    <p className="text-gray-700 mb-4">
                      This article explores the world of SoloBizCards
                      accessories and how to order them seamlessly. We'll dive
                      into the must-have options, spotlight the game-changing
                      NFC cards, and guide you through the ordering process—all
                      designed to help you stand out in a crowded market.
                      Whether you're a Paid Card Member ready to upgrade or a
                      Free user eyeing that next level, these accessories aren't
                      just extras; they're investments in connections that
                      convert. Let's unpack how to order up your edge and turn
                      every interaction into an opportunity.
                    </p>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      Why Invest in Paid Accessories?
                    </h2>

                    <p className="text-gray-700 mb-4">
                      Picture this: You're at a bustling networking event, phone
                      in hand, but your counterpart pulls out a slim, metallic
                      card that— with an effortless tap—beams your full digital
                      profile straight to their device. No fumbling for links,
                      no awkward typing. That's the magic of accessories like
                      NFC cards, which bridge the gap between digital
                      convenience and physical presence. In 2025, where 94% of
                      networking happens contactlessly, these tools aren't
                      luxuries—they're necessities for solopreneurs aiming to
                      leave lasting impressions.{" "}
                    </p>

                    <p className="text-gray-700 mb-4">
                      SoloBizCards accessories enhance your core digital card by
                      adding layers of professionalism and versatility. They
                      address common pain points: forgotten cards, lost leads,
                      or bland handoffs. Benefits include:{" "}
                    </p>

                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>
                        <strong>Eco-Friendly Durability</strong>: Reusable
                        materials reduce waste, aligning with sustainable
                        business practices.
                      </li>
                      <li>
                        <strong>Instant Sharing</strong>:Tap-to-connect speeds
                        up exchanges by up to 70%, fostering deeper engagement.
                      </li>
                      <li>
                        <strong>Analytics Boost</strong>:Track physical
                        interactions alongside digital scans for a holistic view
                        of your ROI.
                      </li>
                      <li>
                        <strong>Brand Amplification</strong>:Custom designs
                        ensure your logo and colors pop, reinforcing recall by
                        30%.
                      </li>
                    </ul>

                    <p className="text-gray-700 mb-4 mt-6">
                      For Free members, dipping into accessories unlocks
                      Paid-level perks without a full subscription. Paid users
                      get bundled discounts and priority customization. The
                      result? A hybrid toolkit that works for events, desks, or
                      daily carry—turning passive networks into active
                      pipelines.
                    </p>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      Spotlight on NFC Cards: The Ultimate Accessory Upgrade
                    </h2>

                    <p className="text-gray-600 mb-4">
                      At the forefront of our accessories lineup is the NFC
                      (Near Field Communication) card—a slim, programmable
                      powerhouse that embeds your SoloBizCards digital profile
                      into a physical form. Compatible with 99% of NFC-enabled
                      smartphones (iOS and Android), these cards let recipients
                      tap to instantly access your contact details, social
                      links, portfolio, and even lead forms. No apps required;
                      it's as simple as Apple Pay.
                    </p>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      Key Features of SoloBizCards NFC Cards
                    </h2>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      NFC cards aren't one-size-fits-all; we've crafted them for
                      the modern hustler:
                    </h2>

                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>
                        <strong>Materials Galore</strong>: Choose from premium
                        PVC (durable plastic), bamboo (eco-warrior vibe), or
                        anodized metal (sleek executive feel). Each withstands
                        daily wear without losing signal strength.
                      </li>
                      <li>
                        <strong>Customization Depth</strong>:Engrave your logo,
                        embed edge-to-edge designs, or add a colored QR fallback
                        for non-NFC devices. Update your linked digital card
                        anytime—changes reflect instantly, no reprints needed.
                      </li>
                      <li>
                        <strong>Advanced Tech</strong>:Powered by NTAG215 chips
                        for secure, encrypted data transfer. Supports up to 1KB
                        of info, perfect for bios, videos, or payment links
                        (ideal for quick gigs).
                      </li>
                      <li>
                        <strong>Battery-Free Magic</strong>:Passive NFC means no
                        charging—tap and go, every time.
                      </li>
                    </ul>

                    <p className="text-sm text-gray-600 mb-4">
                      Pros and Cons: Is NFC Right for You?Like any tech, NFC
                      shines bright but has nuances:{" "}
                    </p>

                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              Aspect
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              Pros
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              Cons
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2">
                              <strong>Usability </strong>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Effortless tap-sharing; works 100% on iPhones, 90%
                              on Androids
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              NFC must be enabled on recipient's phone (rare
                              issue)
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2">
                              <strong>Cost </strong>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Long-term savings (reusable, no reprints)
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Higher upfront ($29.99+) vs. paper cards
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2">
                              <strong>Impact </strong>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Zero waste; materials like bamboo cut carbon
                              footprint
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Initial manufacturing eco-impact (offset via
                              partners)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <p className="text-gray-600 mb-4">
                      For entrepreneurs, the pros dominate: Imagine a real
                      estate agent tapping to share virtual tours or a
                      freelancer demoing a portfolio mid-pitch. Users report 25%
                      more follow-ups thanks to the "wow" factor.
                    </p>

                    <p className="text-gray-600 mb-4">
                      Pair it with your SoloBizCards analytics for geo-tracked
                      taps—pure gold for refining pitches.
                    </p>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      Beyond NFC:
                    </h2>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      Other Paid Accessories to Explore
                    </h2>

                    <p className="text-gray-600 mb-4">
                      NFC steals the show, but our ecosystem rounds out with
                      versatile add-ons tailored for every scenario. These paid
                      accessories integrate seamlessly with your digital card,
                      available exclusively to Paid members or as standalone
                      purchases.
                    </p>

                    <h3 className="text-lg font-semibold mt-6">
                      Smart Key Fobs and Phone Buttons
                    </h3>

                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>
                        <strong>What They Are</strong>: Compact NFC-enabled fobs
                        for keychains or adhesive buttons that stick to your
                        phone case—always-on networking tools.
                      </li>
                      <li>
                        <strong>Enhancements</strong>: Tap to share during
                        casual chats or desk drops. Custom engravings match your
                        brand; battery-free like NFC cards.
                      </li>
                      <li>
                        <strong>Ideal For</strong>:Freelancers on the go—clip to
                        keys for coffee shop serendipity. Price: $19.99 (fob) /
                        $14.99 (button).
                      </li>
                      <li>
                        <strong>Pro Tip</strong>:Use the button as a "social
                        shield" at events; recipients get your vCard plus a
                        branded thank-you animation.
                      </li>
                    </ul>
                    <h3 className="text-lg font-semibold mt-6">
                      Desk Stands and Table Tags
                    </h3>

                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>
                        <strong>What They Are</strong>: Acrylic or wooden stands
                        with embedded NFC chips, doubling as conversation
                        starters for your workspace or trade shows.
                      </li>
                      <li>
                        <strong>Enhancements</strong>:Scan-to-connect for
                        walk-up visitors; link to event-specific landing pages.
                        Add LED glow for low-light venues (Paid upgrade).
                      </li>
                      <li>
                        <strong>Ideal For</strong>:Consultants hosting
                        meetings—place on your desk for seamless client
                        onboarding. Price: $24.99–$39.99.
                      </li>
                      <li>
                        <strong>User Story</strong>:One Paid member, a life
                        coach, saw 15% lead growth by tabling these at
                        workshops. 
                      </li>
                    </ul>

                    <h3 className="text-lg font-semibold mt-6">
                      Custom Metal Wallets and Holders
                    </h3>

                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>
                        <strong>What They Are</strong>: RFID-blocking wallets or
                        slim holders that store multiple NFC cards, with your
                        logo laser-etched.
                      </li>
                      <li>
                        <strong>Enhancements</strong>:Protects against signal
                        interference; includes a built-in NFC relay for
                        wallet-to-phone sharing.
                      </li>
                      <li>
                        <strong>Ideal For</strong>:Sales pros juggling
                        teams—hand out pre-loaded team cards. Price: $34.99+.
                      </li>
                      <li>
                        <strong>Sustainability Angle</strong>:Made from recycled
                        metals, aligning with eco-conscious branding.
                      </li>
                    </ul>

                    <h3 className="text-lg font-semibold mt-6">
                      Premium QR Stickers and Badges
                    </h3>

                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>
                        <strong>What They Are</strong>: Weatherproof stickers or
                        lanyard badges with dynamic QR codes linked to your card
                        (NFC optional).
                      </li>
                      <li>
                        <strong>Enhancements</strong>:Bulk packs for swag bags;
                        track scans per sticker for campaign insights.
                      </li>
                      <li>
                        <strong>Ideal For</strong>:Event organizers—affix to
                        name tags for hybrid networking. Price: $9.99 for
                        50-pack.
                      </li>
                      <li>
                        <strong>Hack</strong>:Layer with NFC for dual-mode
                        sharing, covering all devices. 
                      </li>
                    </ul>

                    <p className="text-gray-700 mt-6">
                      These accessories aren't siloed; they sync with your
                      dashboard for unified analytics. Free members can preview
                      designs, but ordering unlocks full integration.
                    </p>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      How to Order Accessories: A Seamless Process
                    </h2>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      Ordering from SoloBizCards is as intuitive as creating
                      your card—secure, fast, and tailored for busy pros. Here's
                      your step-by-step:
                    </h2>

                    <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4 mt-6">
                      <li>
                        <strong>Log In to the Dashboard</strong>: Visit{" "}
                        <a
                          href="https://solobizcards.com"
                          className="text-blue-600 underline"
                        >
                          SoloBizCards.com
                        </a>{" "}
                        and sign in. Paid members see the "Accessories & Orders"
                        tab in the sidebar; Free users, it's under "Upgrade &
                        Shop."
                      </li>
                      <li>
                        <strong>Browse the Catalog</strong>: Click "Shop
                        Accessories." Filter by type (NFC, Holders) or price.
                        Hover for 360° previews and compatibility checks with
                        your card.
                      </li>
                      <li>
                        <strong>Customize and Add to Cart</strong>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                          <li>Select material/color (e.g., bamboo NFC). </li>
                          <li>
                            Upload branding files (logo, colors—AI
                            auto-optimizes).{" "}
                          </li>
                          <li>Bundle for savings: NFC + Key Fob = 20% off. </li>
                          <li>
                            Review personalization: Ensure it matches your
                            digital card's vibe.
                          </li>
                        </ul>
                      </li>
                      <li>
                        <strong>Checkout Securely</strong>: Powered by Stripe,
                        enter details (no account needed). Options: One-time buy
                        or subscription for replenishments. Shipping: Free over
                        $50, 3–5 days domestic.{" "}
                      </li>
                      <li>
                        <strong>Track and Activate</strong>: Get a confirmation
                        email with order ID. Once arrived, "Pair" in the
                        dashboard via NFC scan—updates sync in seconds.{" "}
                      </li>
                    </ol>

                    <h3 className="text-lg font-semibold mt-6">Pro Tips</h3>

                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>
                        <strong>Bulk Orders</strong>: Paid teams save 15% on 10+
                        units.
                      </li>
                      <li>
                        <strong>Returns</strong>: 30-day window if
                        unused/unprogrammed.
                      </li>
                      <li>
                        <strong>Global Shipping</strong>: Available worldwide;
                        duties calculated at checkout.
                      </li>
                    </ul>

                    <h3 className="text-lg font-semibold mt-6">
                      From cart to connect, it's under 5 minutes—leaving you
                      more time for what matters: building your empire.
                    </h3>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      Maximizing Your Accessories Investment
                    </h2>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      To get the most bang:
                    </h2>

                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>
                        <strong>Event-Ready Kit</strong>: NFC card + badge for
                        conferences; track ROI via geo-analytics.
                      </li>
                      <li>
                        <strong>Daily Carry</strong>: Phone button for impromptu
                        meets—users note 2x more casual leads.
                      </li>
                      <li>
                        <strong>Sustainability Play</strong>: Opt for
                        bamboo/wood to appeal to green clients; highlight in
                        your bio.
                      </li>
                      <li>
                        <strong>A/B Testing</strong>: Rotate accessories and
                        monitor engagement in your dashboard.
                      </li>
                    </ul>
                    <p className="text-gray-700 mt-6">
                      Remember, these pair best with a Paid membership for
                      unlimited customizations and priority support.
                    </p>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      Conclusion: Order Up Your Networking Revolution
                    </h2>

                    <p className="text-gray-700 mt-6">
                      Accessories like our NFC cards aren't just add-ons—they're
                      accelerators for solopreneurs ready to hybridize their
                      hustle. By blending physical flair with digital smarts,
                      SoloBizCards empowers you to network without limits: tap a
                      card, share a stand, or fob a key, all feeding into your
                      lead machine. In a world where first impressions last
                      milliseconds, these paid gems ensure yours endures.
                    </p>

                    <p className="text-gray-700 mt-6">
                      Ready to enhance? Log in at{" "}
                      <a
                        href="https://solobizcards.com"
                        className="text-blue-600 underline"
                      >
                        https://solobizcards.com
                      </a>
                      , browse "Accessories & Orders," and snag your NFC starter
                      pack today. Join 10,000+ pros who've turned taps into
                      triumphs. Your upgraded edge awaits—what accessory will
                      unlock your next big win?
                    </p>

                    <p className="text-gray-700 mt-6">
                      Shop now and connect contactlessly with SoloBizCards!
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Second row - 2 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Referral System 101 */}
          <Card className="hover:border-gray-400 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium border-b border-border pb-2">
                Referral System 101
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-4">
                All your members are automatically granted affiliate status, no
                additional step require. No special signup required, no
                additional work required, just continue doing what you were
                already doing... sharing your BizCard with others. If someone
                signs up from your affiliate link, you get credit, if they
                purchase something on the website, you get up to 50% recurring
                passive income from their purchase for as long as the service is
                active.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 p-0 h-auto flex items-center gap-1"
                  >
                    View Article
                    <ArrowRight size={14} />
                  </Button>
                </DialogTrigger>

                <DialogContent className="fixed left-[50%] bottom-0 z-50 grid w-full translate-x-[-50%] gap-4 border bg-background p-6 shadow-lg duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:rounded-t-lg max-w-4xl max-h-[90vh] overflow-hidden">
                  <DialogHeader className="flex flex-col space-y-1.5 text-center sm:text-left">
                    <DialogTitle className="font-semibold tracking-tight text-2xl">
                      Referral System 101
                    </DialogTitle>
                  </DialogHeader>
                  <h2 className="text-xl font-semibold mt-4">
                    Unlock Passive Income with SoloBizCards:
                  </h2>
                  <div className="relative overflow-y-scroll h-[calc(90vh-100px)] pr-2">
                    <h2 className="text-xl font-semibold mt-4">
                      Your Guide to Effortless Affiliate Earnings
                    </h2>
                    <p className="text-gray-700 mb-4">
                      In the hustle of solo entrepreneurship, finding ways to
                      grow your income without adding to your workload is a
                      game-changer. At SoloBizCards.com, we've made it
                      ridiculously easy for every member—Free or Paid—to tap
                      into a powerful revenue stream through our Referral
                      System. No extra signups, no complicated processes, just
                      seamless integration into what you're already doing:
                      sharing your digital business card. Every time someone
                      signs up via your unique affiliate link and makes a
                      purchase, you earn up to 50% recurring passive income for
                      as long as their service remains active. It’s like
                      planting a seed that grows into a money tree—effortless,
                      scalable, and rewarding.
                    </p>

                    <p className="text-gray-700 mb-4">
                      This article is your ultimate guide to mastering the
                      SoloBizCards Referral System. We’ll break down how it
                      works, how to share your link, track your earnings, and
                      maximize your payouts, whether you're a Free Card Member
                      dipping your toes or a Paid Card Member scaling to new
                      heights. By the end, you’ll see why our referral program
                      is the easiest side hustle for solopreneurs, turning every
                      card scan into a potential payday. Let’s dive into
                      Referral System 101 and start monetizing your network
                      today!
                    </p>

                    <h2 className="text-xl font-semibold mt-4">
                      Why the SoloBizCards Referral System Stands Out
                    </h2>
                    <p className="text-gray-700">
                      Imagine earning a steady stream of income just for sharing
                      your digital business card—the same card you’re already
                      using to network, pitch clients, or showcase your brand.
                      That’s the beauty of the SoloBizCards Referral System.
                      Every member, from the moment they join, is automatically
                      enrolled as an affiliate. No forms, no fees, no extra
                      steps. Your unique referral link is baked into your card,
                      ready to earn you commissions from day one.
                    </p>
                    <h2 className="text-xl font-semibold mt-4">
                      Here’s what makes it a no-brainer:
                    </h2>

                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-6">
                      <li>
                        <strong>Zero Barrier to Entry</strong>: Free and Paid
                        members alike get affiliate status instantly—no special
                        signup required.
                      </li>
                      <li>
                        <strong>High Earning Potential</strong>: Earn up to 50%
                        recurring commissions on purchases like Paid
                        memberships, NFC cards, or other accessories, for as
                        long as the referred user stays active.
                      </li>
                      <li>
                        <strong>Passive Income</strong>: Once someone signs up
                        and buys, you keep earning without lifting a finger.
                      </li>
                      <li>
                        <strong>Trackable and Transparent</strong>: Monitor
                        clicks, signups, and payouts in real-time via your
                        dashboard.
                      </li>
                    </ul>
                    <p className="text-gray-700 mt-6">
                      Industry stats show that referral programs can boost
                      revenue by 20–30% for active sharers, and with 70% of
                      consumers trusting peer recommendations, your card is a
                      natural trust-builder. Whether you’re a freelancer,
                      consultant, or startup founder, this system turns your
                      network into a profit engine without disrupting your
                      workflow.
                    </p>

                    <h2 className="text-xl font-semibold mt-4">
                      How the Referral System Works
                    </h2>
                    <p className="text-gray-700">
                      The SoloBizCards Referral System is designed for
                      simplicity, leveraging your existing networking habits.
                      Here’s the nuts and bolts of how it operates:
                    </p>

                    <ul className="list-decimal list-inside space-y-1 text-gray-700 ml-4 mt-6">
                      <li>
                        <strong>Automatic Affiliate Status</strong>: Upon
                        signing up at{" "}
                        <a
                          href="https://solobizcards.com"
                          className="text-blue-600 underline"
                        >
                          SoloBizCards.com
                        </a>
                        , every member—Free or Paid—receives a unique referral
                        link (e.g., solobizcards.com/ref/yourname). This link is
                        embedded in your digital card’s shareable URL and QR
                        code.
                      </li>
                      <li>
                        Share Your Card, Share Your Link: Every time you share
                        your card—via QR scan, email, social media, or
                        website—the referral link goes along for the ride. No
                        extra effort needed; it’s part of your card’s DNA.
                      </li>
                      <li>
                        Earn on Signups and Purchases:
                        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                          <li>
                            If someone signs up for a SoloBizCards account (Free
                            or Paid) via your link, they’re tagged as your
                            referral.{" "}
                          </li>
                          <li>
                            If they purchase anything—Paid membership
                            ($9.99+/month), NFC cards ($29.99+), or
                            accessories—you earn a commission of up to 50% of
                            their spend, recurring monthly for subscriptions.{" "}
                          </li>
                          <li>
                            <strong>Example</strong>: Refer a Paid member
                            ($9.99/month plan). You earn $5/month for as long as
                            they’re active. Refer 10? That’s $50/month passive
                            income.{" "}
                          </li>
                        </ul>
                      </li>
                      <li>
                        <strong>Payouts Made Easy</strong>: Commissions are
                        credited to your dashboard wallet and paid out monthly
                        via Stripe (minimum $25 threshold). No chasing
                        invoices—just cash flow.{" "}
                      </li>
                    </ul>

                    <p className="text-gray-700 mt-6">
                      The system is built for scale: a single viral share on
                      LinkedIn could lead to dozens of signups, each potentially
                      netting you recurring revenue. It’s networking with a
                      paycheck.
                    </p>

                    <h2 className="text-xl font-semibold mt-4">
                      Navigating Your Referral Dashboard
                    </h2>
                    <p className="text-gray-700">
                      Your SoloBizCards dashboard is your command center for
                      tracking and amplifying your referral success. Here’s how
                      to dive in:
                    </p>

                    <ul className="list-decimal list-inside space-y-1 text-gray-700 ml-4 mt-6">
                      <li>
                        <strong>Log In</strong>: Visit{" "}
                        <a
                          href="https://solobizcards.com"
                          className="text-blue-600 underline"
                        >
                          {" "}
                          SoloBizCards.com{" "}
                        </a>
                        and sign in. The “Referrals & Earnings” tab is in the
                        left sidebar, accessible to all members.
                      </li>
                      <li>
                        Key Sections:
                        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                          <li>
                            <strong>Referral Link</strong>: Find your unique
                            link (e.g., solobizcards.com/ref/yourname) and copy
                            it for sharing. Paid members can customize it (e.g.,
                            yourbrand.solobizcards.com).{" "}
                          </li>
                          <li>
                            <strong>Performance Overview</strong>: See real-time
                            stats—clicks, signups, purchases, and pending
                            commissions.
                          </li>
                          <li>
                            <strong>Payout History</strong>: Track paid and
                            upcoming payouts, with exportable CSVs for
                            accounting.{" "}
                          </li>
                          <li>
                            <strong>Promo Tools (Paid Only)</strong>: Access
                            banners, social posts, and email templates to boost
                            shares.{" "}
                          </li>
                        </ul>
                      </li>
                      <li>
                        Analytics Breakdown:
                        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                          <li>
                            <strong>Free Members</strong>: View total clicks and
                            signups, plus basic conversion rates (e.g., “10% of
                            clicks led to accounts”).{" "}
                          </li>
                          <li>
                            <strong>Paid Members</strong>: Get granular
                            insights—geo-location of clicks, top referral
                            sources (e.g., Twitter vs. email), and predictive
                            earnings trends.{" "}
                          </li>
                        </ul>
                      </li>
                      <li>
                        <strong>Pro Tip</strong>: Use the search bar to filter
                        referrals by date or status (e.g., “Pending Payouts”).
                        Paid users can set alerts for new signups or big
                        purchases.{" "}
                      </li>
                    </ul>

                    <p className="text-gray-700 mt-6">
                      The dashboard is mobile-friendly, so you can check your
                      earnings on the go—perfect for busy solopreneurs.
                    </p>

                    <h2 className="text-xl font-semibold mt-4">
                      Strategies to Maximize Your Referral Earnings
                    </h2>
                    <p className="text-gray-700">
                      Sharing your card is the first step, but strategic sharing
                      turns clicks into cash. Here are proven tactics to amplify
                      your referral game:
                    </p>

                    <h3 className="text-lg font-semibold mt-6">
                      1. Embed in Everyday Networking{" "}
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>
                        <strong>QR Code Power</strong>: Print your QR code (with
                        referral link embedded) on stickers, flyers, or event
                        swag. Hand it out at meetups or conferences—each scan is
                        a potential commission.{" "}
                      </li>

                      <li>
                        <strong>Social Media</strong>: Add your link to your
                        LinkedIn, Twitter, or Instagram bio. Post about your
                        card’s value: “Ditch paper cards—go digital with my
                        SoloBizCards link!” Users report 15% higher clicks on
                        visual posts.{" "}
                      </li>

                      <li>
                        <strong>Email Signature</strong>: Include your referral
                        link in your email footer (Free: static link; Paid:
                        dynamic with QR). Every reply becomes a referral
                        opportunity.{" "}
                      </li>
                    </ul>

                    <h3 className="text-lg font-semibold mt-6">
                      2. Leverage Communities
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>
                        Join the SoloBizCards 21-Day Challenge (accessible via
                        the dashboard) to share tips with other members. Top
                        referrers earn bonus multipliers (e.g., 10% extra
                        commission for 10+ referrals/month).{" "}
                      </li>

                      <li>
                        Post in niche groups—freelancer forums, startup Slack
                        channels, or local business meetups. Frame it as a
                        value-add: “This tool tripled my lead capture—try it
                        free!”{" "}
                      </li>
                    </ul>

                    <h3 className="text-lg font-semibold mt-6">
                      3. Optimize for Conversions
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>
                        Personalize Your Pitch: Share a quick story about how
                        SoloBizCards helped you (e.g., “Landed a $5K client from
                        one QR scan”). Authenticity drives 20% more signups.
                      </li>

                      <li>
                        Use Paid Features: Paid members can create multiple
                        cards for different audiences (e.g., one for clients,
                        one for referrals) and A/B test which drives more
                        signups.{" "}
                      </li>

                      <li>
                        Track and Tweak: Check your dashboard weekly. If
                        LinkedIn outperforms Instagram, double down there.{" "}
                      </li>
                    </ul>

                    <h3 className="text-lg font-semibold mt-6">
                      4. Incentivize Referrals
                    </h3>

                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>
                        Offer value to your network: “Sign up via my link, and
                        I’ll share my top networking hacks!” Paid members can
                        create promo codes (e.g., 10% off first month) to
                        sweeten the deal.
                      </li>
                    </ul>

                    <p className="text-gray-700 mt-6">
                      Real-world win: A graphic designer shared her link in a
                      creative Slack group, netting 15 signups and $75/month
                      passive income within 90 days. Your network is your net
                      worth—literally.
                    </p>

                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              Feature
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              Free Card Member
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              Paid Card Member
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2">
                              <strong>Commission Rate</strong>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Up to 30% recurring
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Up to 50% recurring
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2">
                              <strong>Referral Link</strong>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Basic (solobizcards.com/ref/123)
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Customizable (yourbrand.solobizcards.com)
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2">
                              <strong>Analytics </strong>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Basic clicks and signups
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Advanced (geo, source, trends)
                            </td>
                          </tr>

                          <tr>
                            <td className="border border-gray-300 px-4 py-2">
                              <strong>Promo Tools </strong>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              None
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Banners, email templates, promo codes
                            </td>
                          </tr>

                          <tr>
                            <td className="border border-gray-300 px-4 py-2">
                              <strong>Payout Frequency</strong>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Monthly ($25 minimum)
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Monthly + Priority Processing
                            </td>
                          </tr>

                          <tr>
                            <td className="border border-gray-300 px-4 py-2">
                              <strong>Price</strong>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              $0 Forever
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Starting at $9.99/month (Billed Annually)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <p className="text-gray-700">
                      To upgrade, click “Upgrade” in the dashboard and follow
                      the secure Stripe checkout. You’ll instantly access higher
                      commissions and pro tools.
                    </p>

                    <h2 className="text-xl font-semibold mt-4">
                      Best Practices for Referral Success
                    </h2>

                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-6">
                      <li>
                        <strong>Stay Authentic</strong>: Share your genuine
                        SoloBizCards experience—why it works for you. Trust
                        drives conversions.
                      </li>
                      <li>
                        <strong>Batch Your Efforts</strong>: Dedicate 10 minutes
                        weekly to share your link across platforms.
                      </li>
                      <li>
                        <strong>Monitor Trends</strong>: Use analytics to spot
                        high-performing channels and lean into them.
                      </li>
                      <li>
                        <strong>Combine with Accessories</strong>: Paid members,
                        pair your link with an NFC card for tap-to-refer ease.
                      </li>
                      <li>
                        <strong>Stay Compliant</strong>: SoloBizCards handles
                        GDPR/CCPA for data security, but avoid spammy
                        tactics—quality over quantity.
                      </li>
                    </ul>

                    <p className="text-gray-700 mt-6">
                      Troubleshooting tip: If your link isn’t tracking, clear
                      your browser cache or contact support (Paid gets priority
                      chat).
                    </p>
                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      Conclusion: Turn Sharing into Earning
                    </h2>

                    <p className="text-gray-700 mt-6">
                      The SoloBizCards Referral System is your ticket to passive
                      income without the hassle. Every member is an affiliate
                      from day one—no extra steps, just your usual networking
                      amplified with earning potential. Share your card, watch
                      signups roll in, and enjoy up to 50% recurring commissions
                      for as long as your referrals stay active. From QR scans
                      at events to links in your email signature, every share is
                      a seed for revenue.
                    </p>

                    <p className="text-gray-700 mt-6">
                      Ready to cash in? Log in at{" "}
                      <a
                        href="https://solobizcards.com"
                        className="text-blue-600 underline"
                      >
                        https://solobizcards.com
                      </a>
                      , grab your referral link from the “Referrals & Earnings”
                      tab, and start sharing. Free members, test the waters;
                      Paid users, scale with pro tools. Join thousands of
                      solopreneurs turning connections into cash flow. Your next
                      share could be your next paycheck—what’s stopping you?
                    </p>

                    <p className="text-gray-700 mt-6">
                      Start earning with SoloBizCards today—share smart, profit
                      simple!
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* How SoloPro Works */}
          <Card className="hover:border-gray-400 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium border-b border-border pb-2">
                How SoloPro Works
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-4">
                SoloBizCards is a business marketing community. We offer a free
                digital business card to all our members. Members can purchase
                additional services if they choose to. Our members makes up to
                50% on purchases made by the members associated with their
                account. Our digital marketing assist group enable members to
                reach/market to targeted groups via social media. Participants
                are automatically entered into our weekly bonus jackpot and
                could win 20%, 50% or 100% of the allocated cash prize.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 p-0 h-auto flex items-center gap-1"
                  >
                    View Article
                    <ArrowRight size={14} />
                  </Button>
                </DialogTrigger>

                <DialogContent className="fixed left-[50%] bottom-0 z-50 grid w-full translate-x-[-50%] gap-4 border bg-background p-6 shadow-lg duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:rounded-t-lg max-w-4xl max-h-[90vh] overflow-hidden">
                  <DialogHeader className="flex flex-col space-y-1.5 text-center sm:text-left">
                    <DialogTitle className="font-semibold tracking-tight text-2xl">
                      How SoloPro Works
                    </DialogTitle>
                  </DialogHeader>
                  <h2 className="text-xl font-semibold mt-4">
                    Your Guide to SoloBizCards’ Business Marketing Community and
                    SoloPro Benefits
                  </h2>
                  <div className="relative overflow-y-scroll h-[calc(90vh-100px)] pr-2">
                    <p className="text-gray-700 mb-4">
                      In the fast-paced world of solo entrepreneurship, standing
                      out isn’t just about what you do—it’s about how you
                      connect, market, and grow. At SoloBizCards.com, we’ve
                      built a vibrant business marketing community designed to
                      empower freelancers, entrepreneurs, and small business
                      owners with tools to amplify their brand. At the heart of
                      this ecosystem is SoloPro, our premium offering that
                      blends free digital business cards, optional paid
                      services, a lucrative referral program, and innovative
                      digital marketing tools. Whether you’re networking at a
                      conference or targeting niche audiences on social media,
                      SoloPro equips you to shine. Plus, every participant is
                      automatically entered into our weekly bonus jackpot, with
                      chances to win 20%, 50%, or even 100% of a cash prize.
                    </p>

                    <p className="text-gray-700 mb-4">
                      This article breaks down how SoloPro works, from crafting
                      your free digital card to leveraging paid upgrades,
                      earning up to 50% recurring commissions, and tapping into
                      our digital marketing assist group. We’ll also cover the
                      thrill of the weekly jackpot and how it rewards active
                      members. Ready to unlock the full potential of your
                      network? Let’s dive into SoloPro and transform your hustle
                      into results.
                    </p>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      What is SoloPro?
                    </h2>

                    <p className="text-gray-700 mt-6">
                      SoloPro is the premium tier of SoloBizCards, a business
                      marketing community designed to simplify networking and
                      amplify growth for solopreneurs. At its core, SoloBizCards
                      offers every member a free digital business card—a
                      dynamic, shareable tool that captures leads, showcases
                      your brand, and integrates with your workflow. SoloPro
                      takes it further with optional paid services, a powerful
                      referral system, and exclusive access to our digital
                      marketing assist group for targeted social media outreach.
                      It’s not just a card; it’s a growth engine.
                    </p>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      Key pillars of SoloPro:
                    </h2>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-6">
                      <li>
                        <strong>Free Digital Card</strong>: Every member gets a
                        customizable card with QR code and link sharing, no cost
                        required.
                      </li>
                      <li>
                        <strong>Paid Upgrades</strong>: Access premium features
                        like NFC cards, advanced analytics, and unlimited card
                        designs.
                      </li>
                      <li>
                        <strong>Referral Earnings</strong>: Earn up to 50%
                        recurring commissions on purchases by members you refer.
                      </li>
                      <li>
                        <strong>Digital Marketing Assist</strong>: Reach
                        targeted audiences via social media with curated group
                        support.
                      </li>
                      <li>
                        <strong>Weekly Bonus Jackpot</strong>: Automatic entry
                        for all members, with chances to win 20%, 50%, or 100%
                        of a cash prize.
                      </li>
                    </ul>
                    <p className="text-gray-700 mt-6">
                      With 80% of professionals citing networking as key to
                      success, SoloPro’s blend of free and premium tools makes
                      it a no-brainer for growth-focused solopreneurs. Let’s
                      explore each component.
                    </p>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      Step 1: Start with Your Free Digital Business Card
                    </h2>

                    <p className="text-gray-700 mt-6">
                      Every SoloBizCards member—Free or SoloPro—gets a free
                      digital business card upon signup. This isn’t your
                      grandpa’s paper card; it’s a mobile-friendly, trackable
                      asset that lives on https://solobizcards.com.
                    </p>

                    <h3 className="text-lg font-semibold mt-6">
                      How to Create Your Card
                    </h3>
                    <ul className="list-decimal list-inside space-y-1 text-gray-700 ml-4 mt-6">
                      <li>
                        <strong>Sign Up</strong>: Visit the website, click “Get
                        Started Free,” and register with your email or
                        Google/Apple login. No credit card needed.
                      </li>
                      <li>
                        <strong>Design Your Card</strong>: Choose a minimalist
                        template (Free) or premium designs (SoloPro). Add
                        essentials: name, title, contact info, and a bio (e.g.,
                        “Freelance Designer | Crafting Bold Brands”).
                      </li>
                      <li>
                        <strong>Share Instantly</strong>: Generate a QR code and
                        unique link. Share via email, social media, or in-person
                        scans.{" "}
                      </li>
                    </ul>

                    <p className="text-gray-700 mt-6">
                      Free vs. SoloPro Card Features
                    </p>

                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              Feature
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              Free Member
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left">
                              SoloPro Member
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2">
                              <strong>Templates</strong>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Basic Designs
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Premium + Animated Designs
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2">
                              <strong>Cards Allowed </strong>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              1 Active Card
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Unlimited Cards
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2">
                              <strong>Analytics </strong>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Basic Scans
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Advanced (Geo, Trends, A/B Testing)
                            </td>
                          </tr>

                          <tr>
                            <td className="border border-gray-300 px-4 py-2">
                              <strong>Lead Capture </strong>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Basic Form
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              Custom Forms + Automation
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <p className="text-gray-700">
                      Free cards are perfect for testing the waters; SoloPro
                      unlocks unlimited creativity and deeper insights. Upgrade
                      anytime via the dashboard’s “Upgrade” button, starting at
                      $9.99/month (billed annually).
                    </p>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      Step 2: Optional Paid Services for Next-Level Impact
                    </h2>

                    <p className="text-gray-700 mt-6">
                      While the free card is a powerhouse, SoloPro members can
                      enhance their toolkit with paid services tailored for
                      scalability. These optional add-ons elevate your
                      networking and branding:
                    </p>

                    <ul className="list-decimal list-inside space-y-1 text-gray-700 ml-4 mt-6">
                      <li>
                        <strong>NFC Cards ($29.99+)</strong>: Tap-to-share
                        physical cards with embedded chips. Choose PVC, bamboo,
                        or metal; customize with your logo. Syncs with your
                        digital card for real-time updates.
                      </li>
                      <li>
                        <strong>Premium Templates ($5+/month)</strong>: Access
                        animated, industry-specific designs (e.g., real estate,
                        tech) for multiple cards.
                      </li>
                      <li>
                        <strong>Advanced Analytics ($10+/month)</strong>: Track
                        scan locations, device types, and conversion rates.
                        Ideal for A/B testing card designs.
                      </li>
                      <li>
                        <strong>Accessories ($14.99–$39.99)</strong>: Desk
                        stands, key fobs, or QR stickers to extend your reach at
                        events or workspaces.
                      </li>
                      <li>
                        <strong>Custom Domains ($15+/year)</strong>: Use
                        yourbrand.solobizcards.com for a polished, SEO-friendly
                        link.
                      </li>
                    </ul>

                    <p className="text-gray-700 mt-6">Ordering Process</p>

                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>
                        <strong>Browse</strong>: In the dashboard, go to
                        “Accessories & Orders” (SoloPro) or “Shop” (Free).
                      </li>
                      <li>
                        <strong>Customize</strong>: Upload logos, select
                        materials, and preview.
                      </li>
                      <li>
                        <strong>Checkout</strong>: Secure payment via Stripe;
                        free shipping on orders over $50.
                      </li>
                      <li>
                        <strong>Track</strong>: Monitor delivery and pair
                        accessories (e.g., NFC) via the dashboard.
                      </li>
                    </ul>

                    <p className="text-gray-700 mt-6">
                      These services are optional, but 65% of SoloPro users
                      report higher engagement with at least one add-on. Pick
                      what fits your budget and goals.(Word count so far:
                      782)Step 3: Earn Up to 50% with the Referral
                      ProgramSoloPro’s referral system is a standout feature:
                      every member is automatically an affiliate, earning up to
                      50% recurring commissions on purchases by referred
                      members. No signup, no extra work—just share your card as
                      usual.
                    </p>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      How It Works
                    </h2>

                    <ul className="list-decimal list-inside space-y-1 text-gray-700 ml-4 mt-6">
                      <li>
                        <strong>Get Your Link</strong>: Upon signup, your unique
                        referral link (e.g., solobizcards.com/ref/yourname) is
                        embedded in your card’s QR and URL.
                      </li>
                      <li>
                        <strong>Share Naturally</strong>: Share via QR scans,
                        social posts, or email signatures. Every click is
                        tracked.
                      </li>
                      <li>
                        <strong>Earn Commissions</strong>:
                        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                          <li>
                            If a referral signs up and buys (e.g., SoloPro
                            membership, NFC card), you earn 30% (Free) or 50%
                            (SoloPro) of their spend, recurring for
                            subscriptions.{" "}
                          </li>
                          <li>
                            <strong>Example</strong>: Refer a $9.99/month
                            SoloPro user. Earn $5/month (SoloPro) or $3/month
                            (Free) for as long as they’re active.{" "}
                          </li>
                        </ul>
                      </li>
                      <li>
                        <strong>Track & Cash Out</strong>: Monitor clicks,
                        signups, and earnings in the “Referrals & Earnings”
                        dashboard tab. Payouts via Stripe monthly ($25 minimum).{" "}
                      </li>
                    </ul>

                    <h3 className="text-lg font-semibold mt-6">
                      Maximizing Earnings
                    </h3>

                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-6">
                      <li>
                        <strong>Social Media</strong>: Add your link to LinkedIn
                        or Twitter bios. Posts with visuals drive 20% more
                        clicks.
                      </li>
                      <li>
                        <strong> Events</strong>: Share NFC cards at
                        conferences—each tap could net a referral.
                      </li>

                      <li>
                        <strong>Community</strong>: Join the 21-Day Challenge
                        (dashboard access) to share tips and earn bonus
                        multipliers (e.g., 10% extra for 10+ referrals).
                      </li>
                    </ul>

                    <p className="text-gray-700 mt-6">
                      One user, a consultant, earned $100/month by sharing in a
                      startup Slack group. Your network is your revenue stream.
                    </p>
                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      Step 4: Digital Marketing Assist Group
                    </h2>

                    <p className="text-gray-700 mt-6">
                      SoloPro’s digital marketing assist group is a game-changer
                      for reaching targeted audiences via social media. This
                      community-driven tool connects you with curated groups to
                      amplify your card’s reach.
                    </p>

                    <h3 className="text-lg font-semibold mt-6">How It Works</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-6">
                      <li>
                        <strong>Access</strong>: Available to SoloPro members
                        via the “Marketing Assist” dashboard tab.
                      </li>
                      <li>
                        <strong> Targeted Groups</strong>: Join niche
                        communities (e.g., “Freelance Designers,” “Tech
                        Startups”) for sharing your card. Moderated for quality,
                        ensuring relevant connections.
                      </li>

                      <li>
                        <strong>Automated Outreach</strong>: Use pre-built
                        templates to post your card in groups. SoloPro’s AI
                        suggests optimal times and platforms (e.g., LinkedIn at
                        9 AM PST).
                      </li>
                      <li>
                        <strong>Analytics</strong>: Track engagement from group
                        shares—clicks, scans, and conversions.
                      </li>
                    </ul>

                    <h3 className="text-lg font-semibold mt-6">Benefits</h3>

                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-6">
                      <li>
                        <strong>Precision Marketing</strong>: Reach audiences
                        who care (e.g., realtors for a mortgage broker’s card).
                      </li>
                      <li>
                        <strong>Time-Saving</strong>: Automated posts cut manual
                        effort by 60%.
                      </li>

                      <li>
                        <strong>Community Boost</strong>: Collaborate with
                        members for cross-promotion, driving 15% more referrals.
                      </li>
                    </ul>

                    <h3 className="text-lg font-semibold mt-6">
                      Getting Started
                    </h3>
                    <ul className="list-decimal list-inside space-y-1 text-gray-700 ml-4 mt-6">
                      <li>
                        Navigate to “Marketing Assist” in the dashboard. Join up
                      </li>
                      <li>
                        to 5 groups (SoloPro; Free members preview 1). Post your
                      </li>
                      <li>
                        card with a pitch (e.g., “Boost your leads with my
                        digital
                      </li>
                      <li>
                        card tool!”). Monitor results and refine based on
                        analytics.
                      </li>
                    </ul>

                    <p className="text-gray-700 mt-6">
                      This feature turns social media into a lead machine, with
                      users reporting 25% higher engagement in targeted groups.
                    </p>

                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      Step 5: Weekly Bonus Jackpot
                    </h2>

                    <p className="text-gray-700 mt-6">
                      Every SoloBizCards member is automatically entered into
                      our weekly bonus jackpot—a cash prize pool that rewards
                      active participants. No extra steps; just use your card
                      and engage in the community.
                    </p>
                    <h3 className="text-lg font-semibold mt-6">How It Works</h3>

                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-6">
                      <li>
                        <strong>Eligibility</strong>: All members (Free and
                        SoloPro) qualify by sharing their card or making
                        referrals.
                      </li>
                      <li>
                        <strong>Prizes</strong>: Win 20%, 50%, or 100% of the
                        weekly pool (varies, e.g., $500–$2,000). Announced every
                        Monday via email and dashboard.
                      </li>
                      <li>
                        <strong>Boost Your Odds</strong>: More shares and
                        referrals increase your entries. SoloPro members get 2x
                        entries for premium activity (e.g., NFC scans, group
                        posts).
                      </li>
                      <li>
                        <strong>Payout</strong>: Winners receive funds via
                        Stripe within 7 days.
                      </li>
                    </ul>

                    <h3 className="text-lg font-semibold mt-6">Real Impact</h3>
                    <p className="text-gray-700 mt-6 mt-6">
                      One freelancer won $500 by sharing her card in a single
                      LinkedIn post that went viral. The jackpot adds excitement
                      and rewards your hustle.(Word count so far: 1,330)Best
                      Practices for SoloPro Success
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-6">
                      <li>
                        Start Free, Scale Smart: Use the free card to test, then
                        upgrade for SoloPro perks.
                      </li>
                      <li>
                        <strong>Share Strategically</strong>: Embed your
                        referral link in emails, bios, and NFC taps.
                      </li>
                      <li>
                        <strong>Engage Actively</strong>: Post in marketing
                        groups and the 21-Day Challenge to boost referrals and
                        jackpot odds.
                      </li>
                      <li>
                        <strong>Track Everything</strong>: Use SoloPro’s
                        advanced analytics to optimize sharing channels.
                      </li>
                      <li>
                        <strong>Stay Compliant</strong>: Our GDPR/CCPA-compliant
                        system protects data—share ethically, not spammy.
                      </li>
                    </ul>
                    <h2 className="text-xl font-semibold mt-4 mb-4">
                      Conclusion: SoloPro—Your All-in-One Growth Hub
                    </h2>

                    <p className="text-gray-700 mt-6">
                      SoloPro transforms networking into a powerhouse of
                      opportunity. Start with a free digital card, upgrade with
                      paid services like NFC cards, earn up to 50% recurring
                      commissions, amplify reach via our digital marketing
                      assist group, and get a shot at weekly cash jackpots. It’s
                      a community built for solopreneurs who want more—more
                      leads, more income, more impact.
                    </p>

                    <p className="text-gray-700 mt-6">
                      Join the movement at{" "}
                      <a
                        href="https://solobizcards.com"
                        className="text-blue-600 underline"
                      >
                        https://solobizcards.com
                      </a>
                      . Create your free card, explore SoloPro, and start
                      sharing. With 10,000+ members turning scans into success,
                      your next connection could be your biggest win. Why wait?
                    </p>

                    <p className="text-gray-700 mt-6">
                      Launch your SoloPro journey today—connect, earn, grow!
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Request Support Form */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              <div className="flex items-center gap-1 text-xs sm:text-sm">
                Submit an Issue
                {/* {isProLocked && (
                  <Lock
                    size={14}
                    className="ml-1 text-yellow-500"
                    onClick={() => setShowWarning(true)}
                  />
                )} */}
              </div>
            </CardTitle>
          </CardHeader>
          <div
            className={`transition-all duration-300`}
          >
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userName">User Name</Label>
                    <Input
                      id="userName"
                      placeholder="Enter your name"
                      value={formData.userName}
                      onChange={handleChange}
                      required
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">User Email</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.userEmail}
                      onChange={handleChange}
                      required
                      readOnly
                    />
                  </div>
                </div>

                {/* ✅ Subject Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    onValueChange={handleSubjectChange}
                    value={formData.subject}
                    required
                  >
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="-- Select an option --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Report a bug">Report a bug</SelectItem>
                      <SelectItem value="Cancellation">Cancellation</SelectItem>
                      <SelectItem value="Tech support">Tech support</SelectItem>
                      <SelectItem value="Suggestions">Suggestions</SelectItem>
                      <SelectItem value="How to earn income">
                        How to earn income
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ✅ Description */}
                {/* ✅ Description with 2000 character limit */}
                <div className="space-y-2">
                  <Label htmlFor="issueDescription">Description</Label>
                  <Textarea
                    id="issueDescription"
                    placeholder="Describe your issue (max 2000 characters)"
                    rows={4}
                    maxLength={2000} // <-- built-in character limit
                    value={formData.issueDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        issueDescription: e.target.value,
                      })
                    }
                    required
                  />
                  <p className="text-xs text-gray-500">
                    {formData.issueDescription.length}/2000 characters
                  </p>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Submit"}
                </Button>
                {status && <p className="text-sm mt-2">{status}</p>}
              </form>
            </CardContent>
          </div>
        </Card>
      </div>
      <UpgradeModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
      />
    </div>
  );
}
