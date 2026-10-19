import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function FunnelFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto min-h-screen w-full max-w-[500px] overflow-x-hidden bg-[#f5f5f5] shadow-md [--primary:0_0%_9%] [--primary-foreground:0_0%_98%] [--ring:0_0%_9%]",
        className,
      )}
    >
      {children}
    </div>
  );
}
