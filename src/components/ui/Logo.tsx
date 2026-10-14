import Image from "next/image";
import soloLogo from "@/assets/solo-logo-icon.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  clickable?: boolean;
}

const sizeClasses = {
  sm: "w-11 h-11 sm:w-14 sm:h-14",
  md: "w-16 h-16 sm:w-20 sm:h-20",
  lg: "w-20 h-20 sm:w-24 sm:h-24",
};

export function Logo({ size = "sm", className, clickable = true }: LogoProps) {
  const logoImage = (
    <Image
      src={soloLogo}
      alt="Solo Logo"
      className={cn(sizeClasses[size], "object-contain rounded-lg", className)}
    />
  );

  if (clickable) {
    return (
      <a
        href="https://solobizcards.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block hover-scale"
      >
        {logoImage}
      </a>
    );
  }

  return logoImage;
}
