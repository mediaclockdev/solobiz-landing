"use client";

import { useState, useEffect, useContext, MouseEvent } from "react";
import { Menu, MenuItem, Typography } from "@mui/material";
import { LogOut, User, Home, LogIn, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { CardDataContext } from "@/contexts/CardContext";
import { Logo } from "@/components/ui/Logo";

type HeaderProps = {
  onShowSignIn?: () => void;
};

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

export default function Header({ onShowSignIn }: HeaderProps) {
  const { showToast } = useToast();
  const { user, logout, isLoading, isLoggedIn } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { setCardData } = useContext(CardDataContext);
  const router = useRouter();

  // useEffect(() => {
  //   setAnchorEl(null);
  // }, [user]);
  const handleMenuOpen = (event: MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(event.currentTarget);

  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    const { success, error } = await logout();
    if (success) {
      showToast("Logged out successfully!", "success");
      setCardData(clearedCardData);
    } else {
      showToast(error, "error");
    }
  };

  // if (isLoading) {
  //   return <div className="fixed top-4 right-4 z-50" />;
  // }
  if (user) {
    const displayName =
      user.displayName ||
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      (user.email ? user.email.split("@")[0] : "User");
    const initials = (displayName.charAt(0) || "U").toUpperCase();

    return (
      <div className="fixed top-4 right-4 z-40 flex items-center gap-3">
        <div className="hidden md:block">
          <Logo size="sm" />
        </div>
        <button
          onClick={handleMenuOpen}
          aria-controls="user-menu"
          aria-haspopup="true"
          aria-expanded={open ? "true" : "false"}
          aria-label="User menu"
          className="flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/90 px-3 py-2 text-black shadow-md backdrop-blur-md transition-colors hover:bg-white active:scale-95"
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              {initials}
            </div>
          )}
          <span className="hidden text-sm font-medium text-gray-700 sm:block">
            {displayName}
          </span>
        </button>

        {/* Dropdown Menu */}
        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            style: {
              backdropFilter: "blur(4px)",
              backgroundColor: "rgba(255,255,255,0.95)",
              border: "1px solid rgba(229,231,235,0.8)",
              borderRadius: "8px",
              width: "14rem",
              marginTop: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            },
          }}
        >
          <div className="border-b border-gray-200/80 px-4 py-2">
            <Typography className="truncate text-sm font-medium text-gray-900">
              {displayName}
            </Typography>
            <Typography className="truncate text-xs text-gray-500">
              {user.email}
            </Typography>
          </div>

          <MenuItem
            onClick={() => {
              router.push("/dashboard/settings");
              handleMenuClose();
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
          >
            <User size={16} /> Profile
          </MenuItem>

          <MenuItem
            onClick={() => {
              router.push("/dashboard");
              handleMenuClose();
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
          >
            <Home size={16} /> Dashboard
          </MenuItem>

          <div className="my-1 border-t border-gray-200" />

          <MenuItem
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={16} /> Sign Out
          </MenuItem>
        </Menu>
      </div>
    );
  }

  // ✅ When no user is logged in
  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-3">
      <div className="hidden md:block">
        <Logo size="sm" />
      </div>
      <button
        onClick={onShowSignIn}
        aria-label="Sign in"
        className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-slate-900/10 text-slate-900 backdrop-blur-sm transition hover:bg-slate-900/20 active:scale-95 border border-slate-200/60 shadow-sm"
      >
        <LogIn className="h-5 w-5" />
      </button>
    </div>
  );
}
