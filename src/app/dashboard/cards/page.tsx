// ============================================================================
// COMMENTED OUT FOR FUNNEL-ONLY DEPLOYMENT:
// This repo only serves the welcome funnel (/, /login, /signup, /forgot).
// To restore this page, uncomment the code below.
// ============================================================================
// "use client";
// import Cards from "@/pageComponents/dashboard/Cards";
// 
// export default function CardsPage() {
//   return <Cards />;
// }
// 

import { redirect } from "next/navigation";

export default function DisabledRoute() {
  redirect("/");
  return null;
}
