"use client";
import { Suspense } from "react";
import Settings from "@/pageComponents/dashboard/Settings";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading settings...</div>}>
      <Settings />
    </Suspense>
  );
}
