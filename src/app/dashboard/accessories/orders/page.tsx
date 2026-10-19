// ============================================================================
// COMMENTED OUT FOR FUNNEL-ONLY DEPLOYMENT:
// This repo only serves the welcome funnel (/, /login, /signup, /forgot).
// To restore this page, uncomment the code below.
// ============================================================================
// "use client";
// 
// import Orders from "@/pageComponents/dashboard/Orders";
// 
// export default function OrdersPage() {
//   return <Orders />;
// }
// 

import { redirect } from "next/navigation";

export default function DisabledRoute() {
  redirect("/");
  return null;
}
