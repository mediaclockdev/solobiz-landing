// ============================================================================
// COMMENTED OUT FOR FUNNEL-ONLY DEPLOYMENT:
// This repo only serves the welcome funnel (/, /login, /signup, /forgot).
// To restore this page, uncomment the code below.
// ============================================================================
// "use client";
// import { Suspense } from "react";
// import Settings from "@/pageComponents/dashboard/Settings";
// 
// export default function SettingsPage() {
//   return (
//     <Suspense fallback={<div>Loading settings...</div>}>
//       <Settings />
//     </Suspense>
//   );
// }
// 

import { redirect } from "next/navigation";

export default function DisabledRoute() {
  redirect("/");
  return null;
}
