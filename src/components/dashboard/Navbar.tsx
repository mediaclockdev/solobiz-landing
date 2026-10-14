"use client";

import {
  LogIn,
  Bell,
  ChevronDown,
  Menu,
  User,
  CreditCard,
  Trophy,
  LogOut,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ModeToggle } from "./ModeToggle";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "@/lib/navigation";
import { NextLink } from "@/components/ui/NextLink";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { loadBusinessCards } from "@/utils/cardStorage";
import { getFullName } from "@/utils/businessCard";
import { loadUserData, hasUserAccount } from "@/utils/userStorage";
import { useState, useEffect, useContext } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { CardDataContext } from "@/contexts/CardContext";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import Header from "@/components/Header";

const clearedCardData = {
  visibility: "private",
  theme: "#4299E1",
  profile: { cardName: "", profilePic: null },
  business: {
    first: "",
    last: "",
    accreditations: "",
    name: "",
    jobTitle: "",
    department: "",
    slogan: "",
    phone: "",
    email: "",
    website: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  },
  social: {
    linkedin: "",
    twitter: "",
    facebook: "",
    youtube: "",
    instagram: "",
    tiktok: "",
  },
  about: { aboutMe: "" },
  cta: {
    type: "booking",
    link: "",
    label: "",
    adsType: "product",
    adsImg: null,
  },
};

export function Navbar({
  collapsed,
  setMobileOpen,
}: {
  collapsed: boolean;
  setMobileOpen: (open: boolean) => void;
}) {
  const location = useLocation();
  const path = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get("tab");
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const { user, logout, isLoading, isLoggedIn } = useAuth();
  const [isForgotOpen, setForgotOpen] = useState(false);

  // User data state
  const [userDisplayName, setUserDisplayName] = useState("User");
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [userInitials, setUserInitials] = useState("U");
  const [cardInfo, setCardInfo] = useState();
  const { showToast } = useToast();
  const { setCardData } = useContext(CardDataContext);
  const navigate = useNavigate();
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [planName, setPlanName] = useState<string>("");
  const [planType, setPlanType] = useState<string>("");
  useEffect(() => {
    if (!user?.uid) return;

    const fetchAvatar = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setPlanName(data.planName);
        setPlanType(data.planType);
        if (data.avatarUrl) {
          setAvatarUrl(data.avatarUrl);
        }
      }
    };
    fetchAvatar();
  }, [user]);

  // Load user data on component mount
  useEffect(() => {
    const loadUserInfo = () => {
      if (user) {
        const firstName = user.displayName || "";
        const lastName = user.lastName || "";
        const initials =
          (firstName.charAt(0) || "").toUpperCase() +
          (lastName.charAt(0) || "").toUpperCase();
        setUserInitials(initials);
        return;
      }
      if (hasUserAccount()) {
        const userData = loadUserData();
        if (userData) {
          setUserDisplayName(userData.firstName);
          setUserEmail(userData.email);
          setUserInitials(userData.firstName.charAt(0).toUpperCase());
        }
      } else {
        const cards = loadBusinessCards();
        if (cards.length > 0) {
          const firstCard = cards[0];
          const fullName = getFullName(firstCard);
          setUserDisplayName(fullName);
          setUserEmail(firstCard.business?.email || "user@example.com");
          setUserInitials(
            firstCard.profile.firstName.charAt(0).toUpperCase() +
              (firstCard.profile.lastName?.charAt(0).toUpperCase() || "")
          );
        }
      }
    };
    // if (user) {
    //   console.log("test3");
    //   const firstName = user.displayName || "";
    //   const lastName = user.lastName || "";
    //   const initials =
    //     (firstName.charAt(0) || "").toUpperCase() +
    //     (lastName.charAt(0) || "").toUpperCase();
    //   setUserInitials(initials);
    // }

    loadUserInfo();
  }, [user]);

  const handleLogout = async () => {
    const { success, error } = await logout();
    if (success) {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        updateDoc(userRef, { isLoggedIn: false });
      }
      showToast("Logged out successfully!", "success");
      setCardData(clearedCardData);
      navigate("/");
    } else {
      showToast(error, "error");
    }
  };

  // Page title mapping
  const getPageTitle = () => {
    if (path === "/dashboard" || path === "/dashboard/") return "Dashboard";
    if (path === "/dashboard/cards") return "Cards";
    if (path === "/dashboard/settings") return "Settings";
    if (path === "/dashboard/referrals") return "Referrals";
    if (path === "/dashboard/contacts") return "Contacts";
    if (path === "/dashboard/earnings") return "Earnings";
    if (path === "/dashboard/accessories") return "Accessories";
    if (path === "/dashboard/support") return "Support";
    if (path === "/dashboard/systems") return "Systems";
    if (path === "/dashboard/get-started") return "Create Business Card";
    return "Dashboard";
  };

  // Check if we're on a card details page
  const isCardDetailsPage = path.startsWith("/dashboard/cards/");
  const cardId = isCardDetailsPage ? path.split("/").pop() : null;

  // Get card info for breadcrumb

  const getDataBaseCard = async (cardId: string) => {
    try {
      if (user) {
        const cardsRef = collection(db, "cards");
        const q = query(cardsRef, where("metadata.id", "==", cardId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const userCard: any = {
            id: docSnap.id,
            ...(docSnap.data() as Omit<any, "id">),
          };
          return userCard;
        } else {
          return getCardInfo();
        }
      } else {
        return getCardInfo();
      }
    } catch (err) {
      console.error("Error fetching card:", err);
    }
  };
  const getCardInfo = () => {
    if (!cardId) return null;
    const cards = loadBusinessCards();
    return cards.find((c) => c.metadata.id === cardId);
  };

  useEffect(() => {
    isCardDetailsPage
      ? getDataBaseCard(cardId).then((res) => {
          if (res) setCardInfo(res);
        })
      : null;
  }, [isCardDetailsPage]);

  // Breadcrumb logic for Settings page
  const getSettingsSubpage = () => {
    if (tab === "subscriptions") return "Subscriptions";
    if (tab === "appearance") return "Appearance";
    if (tab === "notifications") return "Notifications";
    if (tab === "my-accessories" || tab === "nfc_cards") return "Accessory";
    return "Account";
  };
  const isSettingsPage = path === "/dashboard/settings";
  const pageTitle = getPageTitle();
  return (
    <header
      className={cn(
        "header-bg h-[80px] border-b fixed top-0 right-0 z-30 flex items-center px-4 md:px-6 transition-all duration-300 left-0 md:left-auto",
        collapsed ? "md:left-20" : "md:left-64",
        "bg-card text-sidebar-foreground md:text-foreground"
      )}
    >
      <div className="flex items-center gap-2 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-sidebar-foreground"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>

        {isSettingsPage ? (
          <Breadcrumb>
            <BreadcrumbList className="text-xl">
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="font-semibold">
                  <NextLink to="/dashboard/settings">Settings</NextLink>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="px-0 py-0" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm">
                  {getSettingsSubpage()}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ) : isCardDetailsPage && cardInfo ? (
          <Breadcrumb>
            <BreadcrumbList className="text-xl">
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="font-semibold">
                  <NextLink to="/dashboard/cards">Cards</NextLink>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="px-0 py-0" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm">
                  {/* @ts-ignore */}
                  {cardInfo?.urlName ?? "local cards"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto h-[48px]">
        {" "}
        {/* {user ? ( */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 border border-border rounded-md p-1 sm:p-2 h-full" /* Made button inherit full height */
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={avatarUrl} alt="User" />

                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {" "}
                    {user.displayName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    {user.email}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 ml-0 md:ml-1 shrink-0" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-full min-w-[200px]">
              <DropdownMenuItem asChild>
                <NextLink
                  to="/dashboard/settings"
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Account
                </NextLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <NextLink
                  to="/dashboard/settings?tab=subscriptions"
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Subscriptions
                </NextLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                {isLoggedIn ? (
                  planType === "free" ? (
                    <NextLink to="/pricing" className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Upgrade to PRO
                    </NextLink>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      {planName}
                    </div>
                  )
                ) : null}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-md hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // <Header onShowSignIn={() => setIsSignInOpen(true)} />
          <button
            onClick={() => setIsSignInOpen(true)}
            aria-label="Sign in"
            className="rounded-lg bg-blue-500/30 p-2 text-blue-700 backdrop-blur-sm transition hover:bg-blue-500/40"
          >
            <LogIn className="h-4 w-4" />
          </button>
        )}
        {/* Added explicit height with 20% increase */}
        <ModeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="relative hidden sm:flex h-full" /* Made button inherit full height */
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>
      </div>

      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onShowSignUp={() => {
          setIsSignInOpen(false);
          setIsSignUpOpen(true);
        }}
        onShowForgotPassword={() => {
          setIsSignInOpen(false);
          setForgotOpen(true);
        }}
      />
      <ForgotPasswordModal
        isOpen={isForgotOpen} // ✅ Correct state
        onClose={() => setForgotOpen(false)}
      />

      {/* ✅ Sign Up Modal */}
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onShowSignIn={() => {
          setIsSignUpOpen(false);
          setIsSignInOpen(true);
        }}
      />
    </header>
  );
}
