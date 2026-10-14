"use client";

import { Providers } from "@/providers/Providers";
import { Suspense } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </Providers>
  );
}
