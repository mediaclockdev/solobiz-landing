"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/services/firebase";
import { signOut } from "firebase/auth";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    signOut(auth).finally(() => {
      router.replace("/");
    });
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
      <p className="text-sm text-muted-foreground">Logging out...</p>
    </div>
  );
}
