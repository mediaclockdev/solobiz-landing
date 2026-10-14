"use client";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center !mt-0">
      {/* Fullscreen overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Centered modal box */}
      <div className="relative bg-white rounded-2xl shadow-xl p-6 z-50 w-full max-w-sm mx-4 text-center animate-enter">
        <h1 className="text-xl font-bold mb-4">Upgrade to Pro</h1>
        <p className="text-gray-600 mb-6">
          <b>Pro feature</b>. Upgrade your plan to unlock unlimited
          customization.
        </p>

        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              window.location.href = "/pricing";
            }}
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
}
