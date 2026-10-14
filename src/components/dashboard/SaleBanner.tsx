"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface SaleBannerProps {
  saleName: string;
  percentage: number;
  endDate: string;
}

export function SaleBanner({ saleName, percentage, endDate }: SaleBannerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (isExpired) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-lg">
      <div className="flex flex-col lg:flex-col xl:flex-row items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Left: Sale name and percentage */}
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-base">{saleName}</span>
          <Badge className="bg-purple-500 text-white hover:bg-purple-500 font-semibold text-xs px-2 py-0.5">
            {percentage}% OFF
          </Badge>
        </div>

        {/* Center: Countdown timer */}
        <div className="flex items-center gap-1.5 text-white">
          <div className="flex items-center gap-0.5 font-mono text-sm">
            <span className="font-semibold">
              {String(timeLeft.days).padStart(2, "0")}
            </span>
            <span className="text-white/60">d</span>
            <span className="mx-1 text-white/60">:</span>
            <span className="font-semibold">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            <span className="text-white/60">h</span>
            <span className="mx-1 text-white/60">:</span>
            <span className="font-semibold">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            <span className="text-white/60">m</span>
            <span className="mx-1 text-white/60">:</span>
            <span className="font-semibold">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
            <span className="text-white/60">s</span>
          </div>
        </div>

        {/* Right: Applied badge */}
        <Badge className="bg-white/20 text-white hover:bg-white/20 font-medium text-xs px-3 py-1 flex items-center gap-1">
          <Check className="h-3 w-3" />
          Applied
        </Badge>
      </div>
    </div>
  );
}
