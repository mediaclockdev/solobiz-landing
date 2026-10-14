"use client";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useLocation } from "@/lib/navigation";
import { NextLink } from "@/components/ui/NextLink";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Contact,
  Shirt,
  Settings,
  HelpCircle,
  Boxes,
  LogOut,
  MessageCircle,
  X,
  DollarSign,
} from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  loadUserData,
  hasUserAccount,
  loadUserRoleData,
} from "@/utils/userStorage";
import { loadBusinessCards } from "@/utils/cardStorage";
import { useState, useEffect } from "react";
type SidebarItem = {
  title: string;
  icon: React.ElementType;
  path: string;
};

import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

const mainNavItems: SidebarItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    title: "Cards",
    icon: CreditCard,
    path: "/dashboard/cards",
  },
  {
    title: "Referrals",
    icon: Users,
    path: "/dashboard/referrals",
  },
  {
    title: "Contacts",
    icon: Contact,
    path: "/dashboard/contacts",
  },
  {
    title: "Earnings",
    icon: DollarSign,
    path: "/dashboard/earnings",
  },
  {
    title: "Accessories",
    icon: Shirt,
    path: "/dashboard/accessories",
  },
];

const bottomNavItems: SidebarItem[] = [
  {
    title: "Settings",
    icon: Settings,
    path: "/dashboard/settings",
  },
  {
    title: "Support",
    icon: HelpCircle,
    path: "/dashboard/support",
  },
  {
    title: "Systems",
    icon: Boxes,
    path: "/dashboard/systems",
  },
];

export function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  isLoading,
  setMobileOpen,
  setShowModal,
  setIsLoading,
}: {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  mobileOpen: boolean;
  isLoading: boolean;
  setMobileOpen: (val: boolean) => void;
  setShowModal: (val: boolean) => void;
  setIsLoading: (val: boolean) => void;
}) {
  const location = useLocation();
  const [userEmail, setUserEmail] = useState("");
  const [isAdminUSer, setIsAdminUser] = useState("");
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  useEffect(() => {
    const loadUserEmail = () => {
      const userData = loadUserRoleData();
      if (userData) {
        setUserEmail(userData.email);
        if (userData.role === "admin") {
          setIsAdminUser(userData.email);
        }
      } else {
        const cards = loadBusinessCards();
        if (cards.length > 0) {
          const firstCard = cards[0];
          setUserEmail(firstCard.business?.email || "");
        }
      }
    };

    loadUserEmail();
  }, []);

  // Check if user is admin (robuc33@yahoo.com)
  const isAdmin = user?.role ? user?.role === "admin" : false;
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    // Wait for auth to resolve before deciding, otherwise the permission
    // modal flashes for a signed-in user on first paint.
    if (authLoading) return;

    const isCardsPage = pathname.toLowerCase().includes("cards");
    const isAccessoriesPage = pathname.toLowerCase().includes("accessories");
    setShowModal(!user && !isCardsPage && !isAccessoriesPage);
    setIsLoading(false);
  }, [user, authLoading, pathname]);
  const [soloCardsVideoLink, setSoloCardsVideoLink] = useState("");
  const settingsRef = doc(db, "settings", "SoloCardsVideo");
  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(settingsRef);
      if (snap.exists()) {
        const data = snap.data();
        setSoloCardsVideoLink(data.videoLink);
      }
    };
    fetchSettings();
  }, []);

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar fixed left-0 top-0 z-40 flex flex-col transition-all duration-300 ease-in-out group",
        // Desktop styles
        // w-64 (16rem) must stay in sync with the offsets every sibling hard-codes:
        // Navbar's md:left-64 and DashboardLayout's md:ml-64 / left-64.
        // This was "w-65", which is not a Tailwind utility and compiled to nothing,
        // so the fixed sidebar shrink-wrapped to its content and no longer lined up
        // with those offsets (the edge toggle button then sat off the real boundary).
        "md:w-64 md:translate-x-0",
        collapsed && "md:w-20",
        // Mobile styles
        "w-64 -translate-x-full",
        mobileOpen && "translate-x-0",
      )}
    >
      {/* <p>Email: {user?.email??""}</p>
      <p>UID: {user?.role??""}</p> */}
      <div className="flex items-center h-[80px] px-4 border-b border-blue-200 relative">
        <NextLink
          to="/"
          className={cn(
            "flex items-center gap-2 transition-all duration-300",
            collapsed ? "md:mx-auto" : "",
          )}
          onClick={() => setMobileOpen(false)}
        >
          <div className="bg-white rounded-md p-1.5">
            <img
              src="/lovable-uploads/6e79eba6-9505-44d3-9af1-e8b13b7c46d0.png"
              alt="SoloBizCards Logo"
              className="h-6 w-6"
            />
          </div>
          {/* Only show the text when not collapsed or on mobile */}
          {(!collapsed || mobileOpen) && (
            <span className="text-sidebar-foreground text-lg font-semibold transition-opacity duration-300">
              SoloBizCards
            </span>
          )}
        </NextLink>

        {/* Close button on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-foreground md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Toggle button on desktop - now always visible on hover of the sidebar */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute transition-opacity duration-200 h-6 w-6",
            collapsed ? "-right-3" : "-right-3",
            "top-1/2 -translate-y-1/2 bg-blue-200 border border-sidebar-border rounded-full z-40",
            "hidden md:flex opacity-0 group-hover:opacity-100",
          )}
          onClick={toggleSidebar}
        >
          {collapsed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          )}
        </Button>
      </div>

      <div className="flex flex-col flex-1 gap-1 py-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {mainNavItems.map((item) => (
          <NextLink
            key={item.title}
            to={item.path}
            className={cn(
              "sidebar-item hover:bg-[#3b73ed] transition-all duration-300",
              // Apply darker blue when active and maintain hover color
              location.pathname === item.path ? "bg-[#1d4ed8]" : "",
              // Desktop styles for collapsed state
              collapsed ? "md:justify-center md:px-2" : "px-4",
              // Mobile always shows full size
              "mx-4",
            )}
            onClick={() => {
              setShowModal(false);
              if (
                !user &&
                item.title !== "Cards" &&
                item.title !== "Accessories"
              ) {
                setShowModal(true);
              } else {
                setShowModal(false);
              }
              setMobileOpen(false);
            }}
          >
            <item.icon className="w-5 h-5 text-[#f7faff]" />
            {/* Only show the text when not collapsed or on mobile */}
            {(!collapsed || mobileOpen) && (
              <span className="text-[#f7faff] transition-opacity duration-300">
                {item.title}
              </span>
            )}
          </NextLink>
        ))}

        <div className="flex-1 border-b border-blue-200 mt-2 mb-2 mx-4"></div>

        {bottomNavItems
          .filter((item) => {
            // Hide Systems button if user is not admin
            if (item.title === "Systems" && !isAdmin) {
              return false;
            }
            return true;
          })
          .map((item) => (
            <NextLink
              key={item.title}
              to={item.path}
              className={cn(
                "sidebar-item hover:bg-[#3b73ed] transition-all duration-300",
                // Apply darker blue when active and maintain hover color
                location.pathname === item.path ? "bg-[#1d4ed8]" : "",
                // Desktop styles for collapsed state
                collapsed ? "md:justify-center md:px-2" : "px-4",
                // Mobile always shows full size
                "mx-4",
              )}
              onClick={() => {
                setShowModal(false);
                if (!user) {
                  setShowModal(true);
                } else {
                  setShowModal(false);
                }
                setMobileOpen(false);
              }}
            >
              <item.icon className="w-5 h-5 text-[#f7faff]" />
              {/* Only show the text when not collapsed or on mobile */}
              {(!collapsed || mobileOpen) && (
                <span className="text-[#f7faff] transition-opacity duration-300">
                  {item.title}
                </span>
              )}
            </NextLink>
          ))}
      </div>

      <div className="border-t border-blue-200 mx-0 py-[16px] my-0">
        <a
          href={soloCardsVideoLink}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "sidebar-item hover:bg-[#3b73ed] transition-all duration-300",
            // Desktop styles for collapsed state
            collapsed ? "md:justify-center md:px-2" : "px-4",
            // Mobile always shows full size
            "mx-4",
          )}
          onClick={() => setMobileOpen(false)}
        >
          <MessageCircle className="w-5 h-5 text-[#f7faff]" />
          {/* Only show the text when not collapsed or on mobile */}
          {(!collapsed || mobileOpen) && (
            <span className="text-[#f7faff] text-sm transition-opacity duration-300">
              How to Get Started Video
            </span>
          )}
        </a>
      </div>
    </aside>
  );
}
