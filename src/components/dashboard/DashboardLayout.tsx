"use client";

import { useState, ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { applyBodyScrollLock } from "@/utils/scrollLock";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => applyBodyScrollLock(showModal), [showModal]);

  return (
    <div className="min-h-screen flex relative">
      {/* Mobile overlay when sidebar is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (never blurred or dimmed) */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        setShowModal={setShowModal}
        setIsLoading={setIsLoading}
        isLoading={isLoading}
      />

      {/* Main content area */}
      {isLoading ? (
        <div className="min-h-screen bg-background p-4 flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      ) : (
        <div
          className={cn(
            "flex-1 transition-all duration-300 w-full relative",
            collapsed ? "md:ml-20" : "md:ml-64",
            "ml-0" // No margin on mobile
          )}
        >
          {/* Content wrapper with blur on modal */}

          <div className={cn(showModal ? "blur-sm pointer-events-none" : "")}>
            <Navbar collapsed={collapsed} setMobileOpen={setMobileOpen} />
            <main className="p-4 md:p-6 mt-[80px] animate-enter">
              {children}
            </main>
          </div>

          {/* Modal overlay only on content area (not sidebar) */}
          {showModal && (
            <div
              className={cn(
                "fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center",
                collapsed ? "left-20" : "left-64" // matches sidebar width
              )}
            >
              {/* Dark overlay (only covers content area) */}
              <div className="absolute inset-0 bg-black/40" />
              {/* Modal Box */}
              <div className="relative bg-white rounded-lg shadow-xl p-6 z-50 w-full max-w-sm mx-4 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-7 h-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                {/* Heading */}
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Permission Required
                </h2>

                {/* Message */}
                <p className="text-gray-600 mb-8 leading-relaxed">
                  You need to{" "}
                  <span className="font-medium text-gray-800">sign in</span>
                  to access this page. Please log in with your account.
                </p>

                <div className="flex justify-center gap-3">
                  <Button
                    onClick={() => {
                      router.replace("/?signIn=true");
                    }}
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
