"use client";

import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

export default function BenefitsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [soloCardsTitle, setSoloCardsTitle] = useState("");
  const [soloCardsSubTitle, setSoloCardsSubTitle] = useState("");
  const [soloCardsVideoLink, setSoloCardsVideoLink] = useState("");

  const settingsRef = doc(db, "settings", "SoloCardsVideo");
  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(settingsRef);
      if (snap.exists()) {
        const data = snap.data();
        setSoloCardsTitle(data.title);
        setSoloCardsSubTitle(data.subtitle);
        setSoloCardsVideoLink(data.videoLink);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            {soloCardsTitle}
          </h2>
          <p className="text-xl text-slate-600">{soloCardsSubTitle}</p>
        </div>

        {/* Grid Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-8">
            {[
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-leaf h-6 w-6 text-green-600"
                  >
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
                  </svg>
                ),
                title: "Eco-Friendly Digital Cards",
                text: "No more wasted paper—eco-friendly digital cards.",
              },
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-smartphone h-6 w-6 text-indigo-600"
                  >
                    <rect
                      width="14"
                      height="20"
                      x="5"
                      y="2"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M12 18h.01"></path>
                  </svg>
                ),
                title: "24/7 Access",
                text: "Share via QR code, link, text, email, or NFC.",
              },
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-form-input h-6 w-6 text-purple-600"
                  >
                    <rect width="20" height="12" x="2" y="6" rx="2"></rect>
                    <path d="M12 12h.01"></path>
                    <path d="M17 12h.01"></path>
                    <path d="M7 12h.01"></path>
                  </svg>
                ),
                title: "Lead Capture",
                text: "Capture leads automatically with built-in contact forms.",
              },
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-megaphone h-6 w-6 text-orange-600"
                  >
                    <path d="m3 11 18-5v12L3 14v-3z"></path>
                    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
                  </svg>
                ),
                title: "Direct Promotion",
                text: "Promote your services, events, or affiliate products directly on your card.",
              },
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-dollar-sign h-6 w-6 text-emerald-600"
                  >
                    <line x1="12" x2="12" y1="2" y2="22"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                ),
                title: "Passive Income",
                text: "Earn passive income: Get paid for referrals and ad space on your card.",
              },
            ].map((item, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center rounded-xl bg-blue-50 p-3">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {item.title}
                  </h3>
                </div>
                <p className="text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Right Column - Video */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video group cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2000&auto=format&fit=crop"
              alt="Video thumbnail"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-tr from-indigo-900/90 to-indigo-800/50 flex items-center justify-center transition-transform"
              onClick={() => setIsOpen(true)}
            >
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-play w-8 h-8 text-indigo-600 ml-1"
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h3 className="text-xl font-semibold mb-2">
                  See SoloCards in Action
                </h3>
                <p className="text-sm text-indigo-200">
                  Watch how entrepreneurs use SoloCards to grow their business
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox (Dialog) */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      >
        <Dialog.Panel className="relative w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={soloCardsVideoLink}
            title="SoloCards Demo"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 text-white bg-black/40 hover:bg-black/60 rounded-full p-2"
          >
            ✕
          </button>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}
