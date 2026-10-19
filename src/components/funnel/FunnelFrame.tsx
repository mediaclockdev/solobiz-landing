import type { ReactNode } from "react";

export default function FunnelFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[500px] overflow-x-hidden bg-background shadow-md [--primary:0_0%_9%] [--primary-foreground:0_0%_98%] [--ring:0_0%_9%]">
      {children}
    </div>
  );
}
